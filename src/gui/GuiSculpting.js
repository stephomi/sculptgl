define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var Tools = require('editing/tools/Tools');
  var getOptionsURL = require('misc/getOptionsURL');
  var GuiSculptingTools = require('gui/GuiSculptingTools');

  var GuiSculpting = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui; // main gui
    this._sculpt = ctrlGui._main.getSculpt(); // sculpting management
    this._toolOnRelease = -1; // tool to apply when the mouse or the key is released
    this._invertSign = false; // invert sign of tool (add/sub)

    this._modalBrushRadius = false; // modal brush radius change
    this._modalBrushIntensity = false; // modal brush intensity change

    // modal stuffs (not canvas based, because no 3D picking involved)
    this._lastPageX = 0;
    this._lastPageY = 0;
    // for modal radius
    this._refX = 0;
    this._refY = 0;

    this._menu = null;
    this._ctrlSculpt = null;
    this._ctrlSymmetry = null;
    this._ctrlContinuous = null;
    this._ctrlTitleCommon = null;
    this.init(guiParent);
  };

  GuiSculpting.prototype = {
    /** Initialisculze */
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('sculptTitle'));
      menu.open();

      menu.addTitle(TR('sculptTool'));

      // sculpt tool
      var optTools = {};
      var tools = Tools.keys;
      for (var i = 0, nbTools = tools.length; i < nbTools; ++i) {
        var tn = tools[i];
        optTools[tn] = TR(Tools[tn].uiName);
      }
      this._ctrlSculpt = menu.addCombobox(TR('sculptTool'), this._sculpt._tool, this.onChangeTool.bind(this), optTools);

      GuiSculptingTools.initGuiTools(this._sculpt, this._menu, this._main);

      this._ctrlTitleCommon = menu.addTitle(TR('sculptCommon'));
      // symmetry
      this._ctrlSymmetry = menu.addCheckbox(TR('sculptSymmetry'), this._sculpt._symmetry, this.onSymmetryChange.bind(this));
      // continuous
      this._ctrlContinuous = menu.addCheckbox(TR('sculptContinuous'), this._sculpt, '_continuous');

      GuiSculptingTools.show(this._sculpt._tool);
      this.addEvents();
      this.onChangeTool(this._sculpt._tool);
    },
    onSymmetryChange: function (value) {
      this._sculpt._symmetry = value;
      this._main.render();
    },
    addEvents: function () {
      var cbLoadAlpha = this.loadAlpha.bind(this);
      document.getElementById('alphaopen').addEventListener('change', cbLoadAlpha, false);
      this.removeCallback = function () {
        document.getElementById('alphaopen').removeEventListener('change', cbLoadAlpha, false);
      };
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    getSelectedTool: function () {
      return this._ctrlSculpt.getValue();
    },
    releaseInvertSign: function () {
      if (!this._invertSign)
        return;
      this._invertSign = false;
      var tool = GuiSculptingTools[this.getSelectedTool()];
      if (tool.toggleNegative)
        tool.toggleNegative();
    },
    onChangeTool: function (newValue) {
      GuiSculptingTools.hide(this._sculpt._tool);
      this._sculpt._tool = newValue;
      GuiSculptingTools.show(newValue);

      var showContinuous = this._sculpt.canBeContinuous() === true;
      this._ctrlContinuous.setVisibility(showContinuous);

      var showSym = newValue !== 'TRANSFORM';
      this._ctrlSymmetry.setVisibility(showSym);

      this._ctrlTitleCommon.setVisibility(showContinuous || showSym);

      this._main.getPicking().updateLocalAndWorldRadius2();
    },
    loadAlpha: function (event) {
      if (event.target.files.length === 0)
        return;

      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;

      var reader = new FileReader();
      var main = this._main;
      var tool = GuiSculptingTools[main.getSculpt()._tool];

      reader.onload = function (evt) {
        var img = new Image();
        img.src = evt.target.result;
        img.onload = main.onLoadAlphaImage.bind(main, img, file.name || 'new alpha', tool);
      };

      document.getElementById('alphaopen').value = '';
      reader.readAsDataURL(file);
    },
    addAlphaOptions: function (opts) {
      var keys = Tools.keys;
      for (var i = 0, nb = keys.length; i < nb; ++i) {
        var t = GuiSculptingTools[keys[i]];
        if (t && t._ctrlAlpha) t._ctrlAlpha.addOptions(opts);
      }
    },
    updateMesh: function () {
      this._menu.setVisibility(!!this._main.getMesh());
    },
    _startModalBrushRadius: function (x, y) {
      this._refX = x;
      this._refY = y;
      var cur = GuiSculptingTools[this.getSelectedTool()];
      if (cur._ctrlRadius) {
        var rad = cur._ctrlRadius.getValue();
        this._refX -= rad;
        this._main.getSelectionRadius().setOffsetX(-rad * this._main.getPixelRatio());
        this._main.renderSelectOverRtt();
      }
    },
    _checkModifierKey: function (event) {
      var selectedTool = this.getSelectedTool();

      if (this._main._action === 'NOTHING') {
        if (event.shiftKey && !event.altKey && !event.ctrlKey) {
          // smoothing on shift key
          if (selectedTool !== 'SMOOTH') {
            this._toolOnRelease = selectedTool;
            this._ctrlSculpt.setValue('SMOOTH');
          }
        }
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
          // masking on ctrl key
          if (selectedTool !== 'MASKING') {
            this._toolOnRelease = selectedTool;
            this._ctrlSculpt.setValue('MASKING');
          }
        }
      }
      if (event.altKey) {
        // invert sign on alt key
        if (this._invertSign || event.shiftKey) return true;
        this._invertSign = true;
        var curTool = GuiSculptingTools[selectedTool];
        if (curTool.toggleNegative)
          curTool.toggleNegative();
        return true;
      }
      return false;
    },
    ////////////////
    // KEY EVENTS
    //////////////// 
    onKeyDown: function (event) {
      if (event.handled === true)
        return;

      var main = this._main;
      var shk = getOptionsURL.getShortKey(event.which);
      event.stopPropagation();

      if (!main._focusGui || shk === 'RADIUS' || shk === 'INTENSITY')
        event.preventDefault();

      event.handled = true;
      if (this._checkModifierKey(event))
        return;

      if (main._action !== 'NOTHING')
        return;

      if (shk && Tools[shk])
        return this._ctrlSculpt.setValue(shk);

      var cur = GuiSculptingTools[this.getSelectedTool()];

      switch (shk) {
      case 'DELETE':
        main.deleteCurrentSelection();
        break;
      case 'INTENSITY':
        this._modalBrushIntensity = main._focusGui = true;
        break;
      case 'RADIUS':
        if (!this._modalBrushRadius) this._startModalBrushRadius(this._lastPageX, this._lastPageY);
        this._modalBrushRadius = main._focusGui = true;
        break;
      case 'NEGATIVE':
        if (cur.toggleNegative) cur.toggleNegative();
        break;
      case 'PICKER':
        var ctrlPicker = cur._ctrlPicker;
        if (ctrlPicker && !ctrlPicker.getValue()) ctrlPicker.setValue(true);
        break;
      default:
        event.handled = false;
      }
    },
    onKeyUp: function (event) {
      var releaseTool = this._main._action === 'NOTHING' && this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey;
      if (!event.altKey || releaseTool)
        this.releaseInvertSign();

      if (releaseTool) {
        this._ctrlSculpt.setValue(this._toolOnRelease);
        this._toolOnRelease = -1;
      }

      var main = this._main;
      switch (getOptionsURL.getShortKey(event.which)) {
      case 'RADIUS':
        this._modalBrushRadius = main._focusGui = false;
        main.getSelectionRadius().setOffsetX(0.0);
        event.pageX = this._lastPageX;
        event.pageY = this._lastPageY;
        main.setMousePosition(event);
        main.getPicking().intersectionMouseMeshes();
        main.renderSelectOverRtt();
        break;
      case 'PICKER':
        var cur = GuiSculptingTools[this.getSelectedTool()];
        var ctrlPicker = cur._ctrlPicker;
        if (ctrlPicker && ctrlPicker.getValue()) ctrlPicker.setValue(false);
        break;
      case 'INTENSITY':
        this._modalBrushIntensity = main._focusGui = false;
        break;
      }
    },
    ////////////////
    // MOUSE EVENTS
    ////////////////
    onMouseUp: function (event) {
      if (this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey) {
        this.releaseInvertSign();
        this._ctrlSculpt.setValue(this._toolOnRelease);
        this._toolOnRelease = -1;
      }
    },
    onMouseMove: function (event) {
      var wid = GuiSculptingTools[this.getSelectedTool()];

      if (this._modalBrushRadius && wid._ctrlRadius) {
        var dx = event.pageX - this._refX;
        var dy = event.pageY - this._refY;
        wid._ctrlRadius.setValue(Math.sqrt(dx * dx + dy * dy));
        this._main.renderSelectOverRtt();
      }

      if (this._modalBrushIntensity && wid._ctrlIntensity) {
        wid._ctrlIntensity.setValue(wid._ctrlIntensity.getValue() + event.pageX - this._lastPageX);
      }

      this._lastPageX = event.pageX;
      this._lastPageY = event.pageY;
    },
    onMouseOver: function (event) {
      if (this._modalBrushRadius)
        this._startModalBrushRadius(event.pageX, event.pageY);
    }
  };

  module.exports = GuiSculpting;
});