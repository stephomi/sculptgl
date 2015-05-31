define([
  'gui/GuiTR',
  'editor/Sculpt',
  'render/Shader',
  'gui/GuiSculptingTools'
], function (TR, Sculpt, Shader, GuiSculptingTools) {

  'use strict';

  var GuiSculpting = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui; // main gui
    this._sculpt = ctrlGui._main.getSculpt(); // sculpting management
    this._toolOnRelease = -1; // tool to apply when the mouse or the key is released
    this._invertSign = false; // invert sign of tool (add/sub)

    this._modalBrushRadius = false; // modal brush radius change
    this._modalBrushIntensity = false; // modal brush intensity change
    this._lastMouseX = 0;

    this._menu = null;
    this._ctrlSculpt = null;
    this._ctrlSymmetry = null;
    this._ctrlContinuous = null;
    this.init(guiParent);
  };

  var uiTools = GuiSculptingTools.TOOLS;

  GuiSculpting.prototype = {
    /** Initialisculze */
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('sculptTitle'));
      menu.open();

      menu.addTitle(TR('sculptTool'));

      // sculpt tool
      var optionsSculpt = {};
      optionsSculpt[Sculpt.tool.BRUSH] = TR('sculptBrush');
      optionsSculpt[Sculpt.tool.INFLATE] = TR('sculptInflate');
      optionsSculpt[Sculpt.tool.TWIST] = TR('sculptTwist');
      optionsSculpt[Sculpt.tool.SMOOTH] = TR('sculptSmooth');
      optionsSculpt[Sculpt.tool.FLATTEN] = TR('sculptFlatten');
      optionsSculpt[Sculpt.tool.PINCH] = TR('sculptPinch');
      optionsSculpt[Sculpt.tool.CREASE] = TR('sculptCrease');
      optionsSculpt[Sculpt.tool.DRAG] = TR('sculptDrag');
      optionsSculpt[Sculpt.tool.PAINT] = TR('sculptPaint');
      optionsSculpt[Sculpt.tool.MASKING] = TR('sculptMasking');
      optionsSculpt[Sculpt.tool.MOVE] = TR('sculptMove');
      optionsSculpt[Sculpt.tool.LOCALSCALE] = TR('sculptLocalScale');
      optionsSculpt[Sculpt.tool.TRANSLATE] = TR('sculptTranslate');
      optionsSculpt[Sculpt.tool.ROTATE] = TR('sculptRotate');
      optionsSculpt[Sculpt.tool.SCALE] = TR('sculptScale');
      this._ctrlSculpt = menu.addCombobox(TR('sculptTool'), this._sculpt._tool, this.onChangeTool.bind(this), optionsSculpt);

      // init all the specific subtools ui
      this.initTool(Sculpt.tool.BRUSH);
      this.initTool(Sculpt.tool.INFLATE);
      this.initTool(Sculpt.tool.TWIST);
      this.initTool(Sculpt.tool.SMOOTH);
      this.initTool(Sculpt.tool.FLATTEN);
      this.initTool(Sculpt.tool.PINCH);
      this.initTool(Sculpt.tool.CREASE);
      this.initTool(Sculpt.tool.DRAG);
      this.initTool(Sculpt.tool.PAINT);
      this.initTool(Sculpt.tool.MASKING);
      this.initTool(Sculpt.tool.MOVE);
      this.initTool(Sculpt.tool.LOCALSCALE);
      this.initTool(Sculpt.tool.TRANSLATE);
      this.initTool(Sculpt.tool.ROTATE);
      this.initTool(Sculpt.tool.SCALE);

      menu.addTitle(TR('Extra'));
      // symmetry
      this._ctrlSymmetry = menu.addCheckbox(TR('sculptSymmetry'), this._sculpt._symmetry, this.onSymmetryChange.bind(this));
      // continuous
      this._ctrlContinuous = menu.addCheckbox(TR('sculptContinuous'), this._sculpt, '_continuous');

      GuiSculptingTools.show(this._sculpt._tool);
      this.addEvents();
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
    /** Remove events */
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    /** Return selected tool */
    getSelectedTool: function () {
      return parseInt(this._ctrlSculpt.getValue(), 10);
    },
    checkModifierKey: function (event) {
      var selectedTool = this.getSelectedTool();

      if (this._main._mouseButton === 0) {
        if (event.shiftKey && !event.altKey && !event.ctrlKey) {
          // smoothing on shift key
          if (selectedTool === Sculpt.tool.SMOOTH)
            return true;
          this._toolOnRelease = selectedTool;
          this._ctrlSculpt.setValue(Sculpt.tool.SMOOTH);
          return true;
        }
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
          // masking on ctrl key
          if (selectedTool !== Sculpt.tool.MASKING) {
            this._toolOnRelease = selectedTool;
            this._ctrlSculpt.setValue(Sculpt.tool.MASKING);
          }
        }
      }
      if (event.altKey) {
        // invert sign on alt key
        if (this._invertSign || event.shiftKey) return true;
        this._invertSign = true;
        var curTool = uiTools[selectedTool];
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
      var key = event.which;
      event.stopPropagation();
      if (!this._main._focusGui || key === 88 || key === 67)
        event.preventDefault();
      event.handled = true;
      if (this.checkModifierKey(event))
        return;

      if (this._main._mouseButton !== 0)
        return;

      var ctrlSculpt = this._ctrlSculpt;
      switch (key) {
      case 88: // X
        this._modalBrushRadius = this._main._focusGui = true;
        break;
      case 67: // C
        this._modalBrushIntensity = this._main._focusGui = true;
        break;
      case 46: // DEL
        if (window.confirm(TR('sculptDeleteSelection')))
          this._main.deleteCurrentSelection();
        break;
      case 48: // 0
      case 96: // NUMPAD 0
        ctrlSculpt.setValue(Sculpt.tool.MOVE);
        break;
      case 49: // 1
      case 97: // NUMPAD 1
        ctrlSculpt.setValue(Sculpt.tool.BRUSH);
        break;
      case 50: // 2
      case 98: // NUMPAD 2
        ctrlSculpt.setValue(Sculpt.tool.INFLATE);
        break;
      case 51: // 3
      case 99: // NUMPAD 3
        ctrlSculpt.setValue(Sculpt.tool.TWIST);
        break;
      case 52: // 4
      case 100: // NUMPAD 4
        ctrlSculpt.setValue(Sculpt.tool.SMOOTH);
        break;
      case 53: // 5
      case 101: // NUMPAD 5
        ctrlSculpt.setValue(Sculpt.tool.FLATTEN);
        break;
      case 54: // 6
      case 102: // NUMPAD 6
        ctrlSculpt.setValue(Sculpt.tool.PINCH);
        break;
      case 55: // 7
      case 103: // NUMPAD 7
        ctrlSculpt.setValue(Sculpt.tool.CREASE);
        break;
      case 56: // 8
      case 104: // NUMPAD 8
        ctrlSculpt.setValue(Sculpt.tool.DRAG);
        break;
      case 57: // 9
      case 105: // NUMPAD 9
        ctrlSculpt.setValue(Sculpt.tool.PAINT);
        break;
      case 69: // E
        ctrlSculpt.setValue(Sculpt.tool.TRANSLATE);
        break;
      case 82: // R
        ctrlSculpt.setValue(Sculpt.tool.ROTATE);
        break;
      case 71: // G
        ctrlSculpt.setValue(Sculpt.tool.SCALE);
        break;
      case 78: // N
        var cur = uiTools[this.getSelectedTool()];
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
      var tool = uiTools[this.getSelectedTool()];
      if (tool.toggleNegative)
        tool.toggleNegative();
    },
    /** Key released event */
    onKeyUp: function (event) {
      var releaseTool = this._main._mouseButton === 0 && this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey;
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
    /** Mouse released event */
    onMouseUp: function (event) {
      if (this._toolOnRelease !== -1 && !event.ctrlKey && !event.shiftKey) {
        this.releaseInvertSign();
        this._ctrlSculpt.setValue(this._toolOnRelease);
        this._toolOnRelease = -1;
      }
    },
    /** Mouse move event */
    onMouseMove: function (e) {
      var wid = uiTools[this.getSelectedTool()];
      if (this._modalBrushRadius && wid._ctrlRadius) {
        wid._ctrlRadius.setValue(wid._ctrlRadius.getValue() + e.pageX - this._lastMouseX);
        this.updateRadiusPicking();
        this._main.render();
      }
      if (this._modalBrushIntensity && wid._ctrlIntensity) {
        wid._ctrlIntensity.setValue(wid._ctrlIntensity.getValue() + e.pageX - this._lastMouseX);
      }
      this._lastMouseX = e.pageX;
    },
    /** Updates radius picking */
    updateRadiusPicking: function () {
      this._main.getPicking().computeLocalAndWorldRadius2(this._main._mouseX, this._main._mouseY);
    },
    /** Initialize tool */
    initTool: function (toolKey) {
      uiTools[toolKey].init(this._sculpt._tools[toolKey], this._menu, this._main);
      GuiSculptingTools.hide(toolKey);
    },
    /** When the sculpting tool is changed */
    onChangeTool: function (newValue) {
      newValue = parseInt(newValue, 10);
      GuiSculptingTools.hide(this._sculpt._tool);
      this._sculpt._tool = newValue;
      GuiSculptingTools.show(newValue);
      this._ctrlContinuous.setVisibility(this._sculpt.allowPicking() === true);
      var show = newValue !== Sculpt.tool.TRANSLATE && newValue !== Sculpt.tool.ROTATE && newValue !== Sculpt.tool.SCALE;
      this._ctrlSymmetry.setVisibility(show);
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
      var tool = uiTools[main.getSculpt()._tool];

      reader.onload = function (evt) {
        var img = new Image();
        img.src = evt.target.result;
        img.onload = main.onLoadAlphaImage.bind(main, img, file.name || 'new alpha', tool);
        document.getElementById('alphaopen').value = '';
      };
      reader.readAsDataURL(file);
    },
    addAlphaOptions: function (opts) {
      for (var i = 0, nb = uiTools.length; i < nb; ++i) {
        var t = uiTools[i];
        if (t && t._ctrlAlpha) t._ctrlAlpha.addOptions(opts);
      }
    },
    updateMesh: function () {
      this._menu.setVisibility(!!this._main.getMesh());
    }
  };

  return GuiSculpting;
});