define([
  'editor/tools/Brush',
  'editor/tools/Inflate',
  'editor/tools/Twist',
  'editor/tools/Smooth',
  'editor/tools/Flatten',
  'editor/tools/Pinch',
  'editor/tools/Crease',
  'editor/tools/Drag',
  'editor/tools/Paint',
  'editor/tools/Scale',
  'editor/tools/Translate',
  'editor/tools/Rotate'
], function (Brush, Inflate, Twist, Smooth, Flatten, Pinch, Crease, Drag, Paint, Scale, Translate, Rotate) {

  'use strict';

  function Sculpt(states) {
    this.states_ = states; // for undo-redo

    this.tool_ = Sculpt.tool.BRUSH; // sculpting mode
    this.tools_ = []; // the sculpting tools

    // symmetry stuffs
    this.symmetry_ = true; // if symmetric sculpting is enabled  

    // continous stuffs
    this.continuous_ = false; // continuous sculpting
    this.sculptTimer_ = -1; // continuous interval timer

    this.init();
  }

  // the sculpting tools
  Sculpt.tool = {
    BRUSH: 0,
    INFLATE: 1,
    TWIST: 2,
    SMOOTH: 3,
    FLATTEN: 4,
    PINCH: 5,
    CREASE: 6,
    DRAG: 7,
    PAINT: 8,
    SCALE: 9,
    TRANSLATE: 10,
    ROTATE: 11
  };

  Sculpt.prototype = {
    /** Get current tool */
    getCurrentTool: function () {
      return this.tools_[this.tool_];
    },
    getSymmetry: function () {
      return this.symmetry_;
    },
    /** Initialize tools */
    init: function () {
      var states = this.states_;
      this.tools_[Sculpt.tool.BRUSH] = new Brush(states);
      this.tools_[Sculpt.tool.INFLATE] = new Inflate(states);
      this.tools_[Sculpt.tool.TWIST] = new Twist(states);
      this.tools_[Sculpt.tool.SMOOTH] = new Smooth(states);
      this.tools_[Sculpt.tool.FLATTEN] = new Flatten(states);
      this.tools_[Sculpt.tool.PINCH] = new Pinch(states);
      this.tools_[Sculpt.tool.CREASE] = new Crease(states);
      this.tools_[Sculpt.tool.DRAG] = new Drag(states);
      this.tools_[Sculpt.tool.PAINT] = new Paint(states);
      this.tools_[Sculpt.tool.SCALE] = new Scale(states);
      this.tools_[Sculpt.tool.TRANSLATE] = new Translate(states);
      this.tools_[Sculpt.tool.ROTATE] = new Rotate(states);
    },
    /** Return true if the current tool doesn't prevent picking */
    allowPicking: function () {
      var tool = this.tool_;
      var st = Sculpt.tool;
      return tool !== st.TWIST && tool !== st.DRAG && tool !== st.SCALE && tool !== st.TRANSLATE && tool !== st.ROTATE;
    },
    /** Return true if the current tool is using continous sculpting */
    isUsingContinuous: function () {
      return this.continuous_ && this.allowPicking();
    },
    /** Start sculpting */
    start: function (main) {
      var tool = this.getCurrentTool();
      tool.start(main);
      if (!main.getPicking().getMesh() || !this.isUsingContinuous())
        return;
      // we do not execute this code if we are replaying
      if (main.isReplayed())
        return;
      this.sculptTimer_ = window.setInterval(function () {
        main.replayer_.pushUpdateContinuous();
        tool.update(main);
        main.render();
      }, 16.6);
    },
    /** End sculpting */
    end: function () {
      var tool = this.getCurrentTool();
      if (tool.mesh_)
        tool.mesh_.checkLeavesUpdate();
      if (this.sculptTimer_ !== -1) {
        clearInterval(this.sculptTimer_);
        this.sculptTimer_ = -1;
      }
    },
    /** Update sculpting */
    update: function (main) {
      if (this.isUsingContinuous())
        return;
      this.getCurrentTool().update(main);
    }
  };

  return Sculpt;
});