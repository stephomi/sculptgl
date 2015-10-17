define([
  'gui/GuiTR',
  'editor/Sculpt',
  'editor/tools/Tools',
  'misc/getOptionsURL',
  'render/Shader',
  'gui/GuiSculptingTools'
], function (TR, Sculpt, Tools, getOptionsURL, Shader, GuiSculptingTools) {

  'use strict';

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
    /** Add events */
    addEvents: function () {
      var canvas = document.getElementById('canvas');

      var cbKeyDown = this.onKeyDown.bind(this);
      var cbKeyUp = this.onKeyUp.bind(this);
      var cbMouseUp = this.onMouseUp.bind(this);
      var cbMouseMove = this.onMouseMove.bind(this);
      var cbLoadAlpha = this.loadAlpha.bind(this);

      window.addEventListener('keydown', cbKeyDown, false);
      window.addEventListener('keyup', cbKeyUp, false);
      canvas.addEventListener('mousemove', cbMouseMove, false);
      canvas.addEventListener('mouseup', cbMouseUp, false);
      canvas.addEventListener('mouseout', cbMouseUp, false);
      document.getElementById('alphaopen').addEventListener('change', cbLoadAlpha, false);

      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
        window.removeEventListener('keyup', cbKeyUp, false);
        canvas.removeEventListener('mousemove', cbMouseMove, false);
        canvas.removeEventListener('mouseup', cbMouseUp, false);
        canvas.removeEventListener('mouseout', cbMouseUp, false);
        document.getElementById('alphaopen').removeEventListener('change', cbLoadAlpha, false);
      };
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    getSelectedTool: function () {
      return this._ctrlSculpt.getValue();
    },
    checkModifierKey: function (event) {
      var selectedTool = this.getSelectedTool();

      if (this._main._action === 'NOTHING') {
        if (event.shiftKey && !event.altKey && !event.ctrlKey) {
          // smoothing on shift key
          if (selectedTool === 'SMOOTH')
            return true;
          this._toolOnRelease = selectedTool;
          this._ctrlSculpt.setValue('SMOOTH');
          return true;
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
    /** Key pressed event */
    onKeyDown: function (event) {
      if (event.handled === true)
        return;

      var main = this._main;
      var key = event.which;
      event.stopPropagation();

      if (!main._focusGui || key === 88 || key === 67)
        event.preventDefault();

      event.handled = true;
      if (this.checkModifierKey(event))
        return;

      if (main._action !== 'NOTHING')
        return;

      // handles numpad
      if (key >= 96 && key <= 105) key -= 48;
      var opts = getOptionsURL();
      var strTool = opts.shortcuts[key];
      if (strTool && Tools[strTool])
        return this._ctrlSculpt.setValue(strTool);

      switch (key) {
      case 88: // X
        if (!this._modalBrushRadius) {
          this._refX = this._lastPageX;
          this._refY = this._lastPageY;
        }
        this._modalBrushRadius = main._focusGui = true;
        break;
      case 67: // C
        this._modalBrushIntensity = main._focusGui = true;
        break;
      case 46: // DEL
        main.deleteCurrentSelection();
        break;
      case 78: // N
        var cur = GuiSculptingTools[this.getSelectedTool()];
        if (cur.toggleNegative)
          cur.toggleNegative();
        break;
      default:
        event.handled = false;
      }
    },
    releaseInvertSign: function () {
      if (!this._invertSign)
        return;
      this._invertSign = false;
      var tool = GuiSculptingTools[this.getSelectedTool()];
      if (tool.toggleNegative)
        tool.toggleNegative();
    },
    onKeyUp: function (event) {
      var releaseTool = this._main._action === 'NOTHING' && this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey;
      if (!event.altKey || releaseTool)
        this.releaseInvertSign();
      if (releaseTool) {
        this._ctrlSculpt.setValue(this._toolOnRelease);
        this._toolOnRelease = -1;
      }
      if (event.which === 88) // X
        this._modalBrushRadius = this._main._focusGui = false;
      else if (event.which === 67) // C
        this._modalBrushIntensity = this._main._focusGui = false;
    },
    onMouseUp: function (event) {
      if (this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey) {
        this.releaseInvertSign();
        this._ctrlSculpt.setValue(this._toolOnRelease);
        this._toolOnRelease = -1;
      }
    },
    onMouseMove: function (e) {
      var wid = GuiSculptingTools[this.getSelectedTool()];
      if (this._modalBrushRadius && wid._ctrlRadius) {
        var dx = e.pageX - this._refX;
        var dy = e.pageY - this._refY;
        wid._ctrlRadius.setValue(Math.sqrt(dx * dx + dy * dy));
        this.updateRadiusPicking();
        this._main.render();
      }
      if (this._modalBrushIntensity && wid._ctrlIntensity) {
        wid._ctrlIntensity.setValue(wid._ctrlIntensity.getValue() + e.pageX - this._lastPageX);
      }
      this._lastPageX = e.pageX;
      this._lastPageY = e.pageY;
    },
    updateRadiusPicking: function () {
      this._main.getPicking().computeLocalAndWorldRadius2(this._main._mouseX, this._main._mouseY);
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

      this.updateRadiusPicking();
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
        document.getElementById('alphaopen').value = '';
      };
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
    }
  };

  return GuiSculpting;
});