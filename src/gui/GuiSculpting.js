define([
  'gui/GuiTR',
  'editor/Sculpt',
  'render/Shader',
  'gui/GuiSculptingTools'
], function (TR, Sculpt, Shader, GuiSculptingTools) {

  'use strict';

  var GuiSculpting = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.ctrlGui_ = ctrlGui; // main gui
    this.sculpt_ = ctrlGui.main_.getSculpt(); // sculpting management
    this.toolOnRelease_ = -1; // tool to apply when the mouse or the key is released
    this.invertSign_ = false; // invert sign of tool (add/sub)

    this.modalBrushRadius_ = false; // modal brush radius change
    this.modalBrushIntensity_ = false; // modal brush intensity change
    this.lastMouseX_ = 0;

    this.menu_ = null;
    this.ctrlSculpt_ = null;
    this.ctrlSymmetry_ = null;
    this.ctrlContinuous_ = null;
    this.ctrlRadius_ = null;
    this.init(guiParent);
  };

  var uiTools = GuiSculptingTools.TOOLS;

  GuiSculpting.prototype = {
    /** Initialisculze */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('sculptTitle'));

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
      this.ctrlSculpt_ = menu.addCombobox(TR('sculptTool'), this.sculpt_.tool_, this.onChangeTool.bind(this), optionsSculpt);

      // radius
      var picking = this.main_.getPicking();
      this.ctrlRadius_ = menu.addSlider(TR('sculptRadius'), picking, 'rDisplay_', 5, 200, 1);

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
      this.ctrlSymmetry_ = menu.addCheckbox(TR('sculptSymmetry'), this.sculpt_.symmetry_, this.onSymmetryChange.bind(this));
      // continuous
      this.ctrlContinuous_ = menu.addCheckbox(TR('sculptContinuous'), this.sculpt_, 'continuous_');

      GuiSculptingTools.show(this.sculpt_.tool_);
      this.addEvents();
    },
    onSymmetryChange: function (value) {
      this.sculpt_.symmetry_ = value;
      this.main_.render();
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
      return parseInt(this.ctrlSculpt_.getValue(), 10);
    },
    checkModifierKey: function (event) {
      var selectedTool = this.getSelectedTool();

      if (this.main_.mouseButton_ === 0) {
        if (event.shiftKey && !event.altKey && !event.ctrlKey) {
          // smoothing on shift key
          if (selectedTool === Sculpt.tool.SMOOTH)
            return true;
          this.toolOnRelease_ = selectedTool;
          this.ctrlSculpt_.setValue(Sculpt.tool.SMOOTH);
          return true;
        }
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
          // masking on ctrl key
          if (selectedTool !== Sculpt.tool.MASKING) {
            this.toolOnRelease_ = selectedTool;
            this.ctrlSculpt_.setValue(Sculpt.tool.MASKING);
          }
        }
      }
      if (event.altKey) {
        // invert sign on alt key
        if (this.invertSign_ || event.shiftKey) return true;
        this.invertSign_ = true;
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
      event.stopPropagation();
      if (!this.main_.focusGui_)
        event.preventDefault();
      var key = event.which;
      event.handled = true;
      if (this.checkModifierKey(event))
        return;

      if (this.main_.mouseButton_ !== 0)
        return;

      var ctrlSculpt = this.ctrlSculpt_;
      switch (key) {
      case 88: // X
        this.modalBrushRadius_ = this.main_.focusGui_ = true;
        break;
      case 67: // C
        this.modalBrushIntensity_ = this.main_.focusGui_ = true;
        break;
      case 107: // +
        this.ctrlRadius_.setValue(this.ctrlRadius_.getValue() + 3);
        this.updateRadiusPicking();
        break;
      case 109: // -
        this.ctrlRadius_.setValue(this.ctrlRadius_.getValue() - 3);
        this.updateRadiusPicking();
        break;
      case 46: // DEL
        if (window.confirm(TR('sculptDeleteMesh')))
          this.main_.deleteCurrentMesh();
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
      if (!this.invertSign_)
        return;
      this.invertSign_ = false;
      var tool = uiTools[this.getSelectedTool()];
      if (tool.toggleNegative)
        tool.toggleNegative();
    },
    /** Key released event */
    onKeyUp: function (event) {
      var releaseTool = this.main_.mouseButton_ === 0 && this.toolOnRelease_ !== -1 && !event.ctrlKey && !event.shiftKey;
      if (!event.altKey || releaseTool)
        this.releaseInvertSign();
      if (releaseTool) {
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      }
      if (event.which === 88) // X
        this.modalBrushRadius_ = this.main_.focusGui_ = false;
      else if (event.which === 67) // C
        this.modalBrushIntensity_ = this.main_.focusGui_ = false;
    },
    /** Mouse released event */
    onMouseUp: function (event) {
      if (this.toolOnRelease_ !== -1 && !event.ctrlKey && !event.shiftKey) {
        this.releaseInvertSign();
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      }
    },
    /** Mouse move event */
    onMouseMove: function (e) {
      if (this.modalBrushRadius_) {
        this.ctrlRadius_.setValue(this.ctrlRadius_.getValue() + (e.pageX - this.lastMouseX_) * 1.0);
        this.updateRadiusPicking();
        this.main_.render();
      }
      if (this.modalBrushIntensity_) {
        var wid = uiTools[this.getSelectedTool()];
        if (wid.ctrlIntensity_)
          wid.ctrlIntensity_.setValue(wid.ctrlIntensity_.getValue() + (e.pageX - this.lastMouseX_) * 1.0);
      }
      this.lastMouseX_ = e.pageX;
    },
    /** Updates radius picking */
    updateRadiusPicking: function () {
      this.main_.getPicking().computeRadiusWorld2(this.main_.mouseX_, this.main_.mouseY_);
    },
    /** Initialize tool */
    initTool: function (toolKey) {
      uiTools[toolKey].init(this.sculpt_.tools_[toolKey], this.menu_, this.main_);
      GuiSculptingTools.hide(toolKey);
    },
    /** When the sculpting tool is changed */
    onChangeTool: function (newValue) {
      newValue = parseInt(newValue, 10);
      GuiSculptingTools.hide(this.sculpt_.tool_);
      this.sculpt_.tool_ = newValue;
      GuiSculptingTools.show(newValue);
      this.ctrlContinuous_.setVisibility(this.sculpt_.allowPicking() === true);
      var show = newValue !== Sculpt.tool.TRANSLATE && newValue !== Sculpt.tool.ROTATE && newValue !== Sculpt.tool.SCALE;
      this.ctrlSymmetry_.setVisibility(show);
      this.ctrlRadius_.setVisibility(show);
    },
    loadAlpha: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      var reader = new FileReader();
      var main = this.main_;
      var tool = uiTools[main.getSculpt().tool_];

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
        if (t && t.ctrlAlpha_) t.ctrlAlpha_.addOptions(opts);
      }
    }
  };

  return GuiSculpting;
});