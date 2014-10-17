define([
  'gui/GuiTR',
  'editor/Sculpt',
  'render/Shader',
  'gui/GuiSculptingTools'
], function (TR, Sculpt, Shader, GuiSculptingTools) {

  'use strict';

  function GuiSculpting(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.ctrlGui_ = ctrlGui; // main gui
    this.sculpt_ = ctrlGui.main_.getSculpt(); // sculpting management
    this.toolOnRelease_ = -1; // tool to apply when the mouse or the key is released
    this.invertSign_ = false; // invert sign of tool (add/sub)

    this.modelBrushRadius_ = false; // model brush radius change
    this.modelBrushIntensity_ = false; // model brush intensity change
    this.lastMouseX_ = 0; // last x position

    this.menu_ = null; // ui menu
    this.ctrlSculpt_ = null; // sculpt controller
    this.ctrlSymmetry_ = null; // symmetry controller
    this.ctrlContinuous_ = null; // continuous controller
    this.ctrlRadius_ = null; // radius controller
    this.init(guiParent);
  }

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
      optionsSculpt[Sculpt.tool.SCALE] = TR('sculptScale');
      optionsSculpt[Sculpt.tool.TRANSLATE] = TR('sculptTranslate');
      optionsSculpt[Sculpt.tool.ROTATE] = TR('sculptRotate');
      this.ctrlSculpt_ = menu.addCombobox(TR('sculptTool'), this.sculpt_.tool_, this.onChangeTool.bind(this), optionsSculpt);

      // radius
      var picking = this.main_.getPicking();
      this.ctrlRadius_ = menu.addSlider(TR('sculptRadius'), picking, 'rDisplay_', 5, 200, 1);

      // init all the specific subtools ui
      this.initTool(Sculpt.tool.BRUSH, menu);
      this.initTool(Sculpt.tool.INFLATE, menu);
      this.initTool(Sculpt.tool.TWIST, menu);
      this.initTool(Sculpt.tool.SMOOTH, menu);
      this.initTool(Sculpt.tool.FLATTEN, menu);
      this.initTool(Sculpt.tool.PINCH, menu);
      this.initTool(Sculpt.tool.CREASE, menu);
      this.initTool(Sculpt.tool.DRAG, menu);
      this.initTool(Sculpt.tool.PAINT, menu, this.main_);
      this.initTool(Sculpt.tool.SCALE, menu);
      this.initTool(Sculpt.tool.TRANSLATE, menu);
      this.initTool(Sculpt.tool.ROTATE, menu);

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

      window.addEventListener('keydown', cbKeyDown, false);
      window.addEventListener('keyup', cbKeyUp, false);
      canvas.addEventListener('mousemove', cbMouseMove, false);
      canvas.addEventListener('mouseup', cbMouseUp, false);
      canvas.addEventListener('mouseout', cbMouseUp, false);

      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
        window.removeEventListener('keyup', cbKeyUp, false);
        canvas.removeEventListener('mousemove', cbMouseMove, false);
        canvas.removeEventListener('mouseup', cbMouseUp, false);
        canvas.removeEventListener('mouseout', cbMouseUp, false);
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
    /** Key pressed event */
    onKeyDown: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (!this.main_.focusGui_)
        event.preventDefault();
      var key = event.which;
      var ctrlSculpt = this.ctrlSculpt_;
      event.handled = true;
      if (this.main_.mouseButton_ !== 0)
        return;

      if (event.shiftKey && !event.altKey && !event.ctrlKey) {
        // smoothing on alt key
        var selectedTool = this.getSelectedTool();
        if (selectedTool === Sculpt.tool.SMOOTH)
          return;
        this.toolOnRelease_ = selectedTool;
        ctrlSculpt.setValue(Sculpt.tool.SMOOTH);
        return;
      } else if (!event.shiftKey && event.altKey && !event.ctrlKey) {
        // invert sign on alt key
        if (this.invertSign_) return;
        this.invertSign_ = true;
        var curTool = GuiSculptingTools[this.getSelectedTool()];
        if (curTool.toggleNegative)
          curTool.toggleNegative();
        return;
      }

      switch (key) {
      case 88: // X
        this.modelBrushRadius_ = this.main_.focusGui_ = true;
        break;
      case 67: // C
        this.modelBrushIntensity_ = this.main_.focusGui_ = true;
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
        ctrlSculpt.setValue(Sculpt.tool.SCALE);
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
      case 78: // N
        var cur = GuiSculptingTools[this.getSelectedTool()];
        if (cur.toggleNegative)
          cur.toggleNegative();
        break;
      default:
        event.handled = false;
      }
    },
    /** Key released event */
    onKeyUp: function (event) {
      if (this.main_.mouseButton_ === 0 && this.toolOnRelease_ !== -1) {
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      } else if (this.invertSign_) {
        this.invertSign_ = false;
        GuiSculptingTools[this.getSelectedTool()].toggleNegative();
      }
      if (event.which === 88) // X
        this.modelBrushRadius_ = this.main_.focusGui_ = false;
      else if (event.which === 67) // C
        this.modelBrushIntensity_ = this.main_.focusGui_ = false;
    },
    /** Mouse released event */
    onMouseUp: function () {
      if (this.toolOnRelease_ !== -1) {
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      }
    },
    /** Mouse move event */
    onMouseMove: function (e) {
      if (this.modelBrushRadius_) {
        this.ctrlRadius_.setValue(this.ctrlRadius_.getValue() + (e.pageX - this.lastMouseX_) * 1.0);
        this.updateRadiusPicking();
        this.main_.render();
      }
      if (this.modelBrushIntensity_) {
        var wid = GuiSculptingTools[this.getSelectedTool()];
        if (wid.intensity_)
          wid.intensity_.setValue(wid.intensity_.getValue() + (e.pageX - this.lastMouseX_) * 1.0);
      }
      this.lastMouseX_ = e.pageX;
    },
    /** Updates radius picking */
    updateRadiusPicking: function () {
      this.main_.getPicking().computeRadiusWorld2(this.main_.mouseX_, this.main_.mouseY_);
    },
    /** Initialize tool */
    initTool: function (toolKey, foldSculpt, main) {
      GuiSculptingTools[toolKey].init(this.sculpt_.tools_[toolKey], foldSculpt, main);
      GuiSculptingTools.hide(toolKey);
    },
    /** When the sculpting tool is changed */
    onChangeTool: function (newValue) {
      newValue = parseInt(newValue, 10);
      GuiSculptingTools.hide(this.sculpt_.tool_);
      if (newValue === Sculpt.tool.PAINT)
        this.ctrlGui_.ctrlRendering_.ctrlShaders_.setValue(Shader.mode.PBR);
      this.sculpt_.tool_ = newValue;
      GuiSculptingTools.show(newValue);
      this.ctrlContinuous_.setVisibility(this.sculpt_.allowPicking() === true);
      this.ctrlSymmetry_.setVisibility(newValue !== Sculpt.tool.TRANSLATE && newValue !== Sculpt.tool.ROTATE);
    }
  };

  return GuiSculpting;
});