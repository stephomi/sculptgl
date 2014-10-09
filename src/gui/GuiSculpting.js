define([
  'gui/GuiTR',
  'editor/Sculpt',
  'gui/GuiSculptingTools'
], function (TR, Sculpt, GuiSculptingTools) {

  'use strict';

  function GuiSculpting(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.sculpt_ = ctrlGui.main_.getSculpt(); // sculpting management
    this.toolOnRelease_ = -1; // tool to apply when the mouse or the key is released

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
      this.initTool(Sculpt.tool.PAINT, menu);
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
      var cbKeyDown = this.onKeyDown.bind(this);
      var cbKeyUp = this.onKeyUp.bind(this);
      var cbMouseUp = this.onMouseUp.bind(this);
      window.addEventListener('keydown', cbKeyDown, false);
      window.addEventListener('keyup', cbKeyUp, false);
      var canvas = document.getElementById('canvas');
      canvas.addEventListener('mouseup', cbMouseUp, false);
      canvas.addEventListener('mouseout', cbMouseUp, false);
      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
        window.removeEventListener('keyup', cbKeyUp, false);
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
        var selectedTool = this.getSelectedTool();
        if (selectedTool === Sculpt.tool.SMOOTH)
          return;
        this.toolOnRelease_ = selectedTool;
        ctrlSculpt.setValue(Sculpt.tool.SMOOTH);
        return;
      }
      switch (key) {
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
    onKeyUp: function () {
      if (this.main_.mouseButton_ === 0 && this.toolOnRelease_ !== -1) {
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      }
    },
    /** Mouse released event */
    onMouseUp: function () {
      if (this.toolOnRelease_ !== -1) {
        this.ctrlSculpt_.setValue(this.toolOnRelease_);
        this.toolOnRelease_ = -1;
      }
    },
    /** Initialize tool */
    initTool: function (toolKey, foldSculpt) {
      GuiSculptingTools[toolKey].init(this.sculpt_.tools_[toolKey], foldSculpt);
      GuiSculptingTools.hide(toolKey);
    },
    /** When the sculpting tool is changed */
    onChangeTool: function (newValue) {
      newValue = parseInt(newValue, 10);
      GuiSculptingTools.hide(this.sculpt_.tool_);
      this.sculpt_.tool_ = newValue;
      GuiSculptingTools.show(newValue);
      this.ctrlContinuous_.setVisibility(this.sculpt_.allowPicking() === true);
      this.ctrlSymmetry_.setVisibility(newValue !== Sculpt.tool.TRANSLATE && newValue !== Sculpt.tool.ROTATE);
    }
  };

  return GuiSculpting;
});