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
  'editor/tools/Move',
  'editor/tools/Masking',
  'editor/tools/LocalScale',
  'editor/tools/Translate',
  'editor/tools/Rotate',
  'editor/tools/Scale'
], function (Brush, Inflate, Twist, Smooth, Flatten, Pinch, Crease, Drag, Paint, Move, Masking, LocalScale, Translate, Rotate, Scale) {

  'use strict';

  var Sculpt = function (main) {
    this.main_ = main;

    this.tool_ = Sculpt.tool.BRUSH; // sculpting mode
    this.tools_ = []; // the sculpting tools

    // symmetry stuffs
    this.symmetry_ = true; // if symmetric sculpting is enabled  

    // continous stuffs
    this.continuous_ = false; // continuous sculpting
    this.sculptTimer_ = -1; // continuous interval timer

    this.init();
  };

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
    MOVE: 9,
    MASKING: 10,
    LOCALSCALE: 11,
    TRANSLATE: 12,
    ROTATE: 13,
    SCALE: 14
  };

  Sculpt.prototype = {
    getCurrentTool: function () {
      return this.tools_[this.tool_];
    },
    getSymmetry: function () {
      return this.symmetry_;
    },
    getTool: function (key) {
      return this.tools_[key] ? this.tools_[key] : this.tools_[Sculpt.tool[key]];
    },
    init: function () {
      var main = this.main_;
      this.tools_[Sculpt.tool.BRUSH] = new Brush(main);
      this.tools_[Sculpt.tool.INFLATE] = new Inflate(main);
      this.tools_[Sculpt.tool.TWIST] = new Twist(main);
      this.tools_[Sculpt.tool.SMOOTH] = new Smooth(main);
      this.tools_[Sculpt.tool.FLATTEN] = new Flatten(main);
      this.tools_[Sculpt.tool.PINCH] = new Pinch(main);
      this.tools_[Sculpt.tool.CREASE] = new Crease(main);
      this.tools_[Sculpt.tool.DRAG] = new Drag(main);
      this.tools_[Sculpt.tool.PAINT] = new Paint(main);
      this.tools_[Sculpt.tool.MOVE] = new Move(main);
      this.tools_[Sculpt.tool.MASKING] = new Masking(main);
      this.tools_[Sculpt.tool.LOCALSCALE] = new LocalScale(main);
      this.tools_[Sculpt.tool.TRANSLATE] = new Translate(main);
      this.tools_[Sculpt.tool.ROTATE] = new Rotate(main);
      this.tools_[Sculpt.tool.SCALE] = new Scale(main);
    },
    /** Return true if the current tool doesn't prevent picking */
    allowPicking: function () {
      var tool = this.tool_;
      var st = Sculpt.tool;
      return tool !== st.TWIST && tool !== st.MOVE && tool !== st.DRAG && tool !== st.LOCALSCALE && tool !== st.TRANSLATE && tool !== st.ROTATE && tool !== st.SCALE;
    },
    /** Return true if the current tool is using continous sculpting */
    isUsingContinuous: function () {
      return this.continuous_ && this.allowPicking();
    },
    start: function (ctrl) {
      var tool = this.getCurrentTool();
      tool.start(ctrl);
      if (!this.main_.getPicking().getMesh() || !this.isUsingContinuous())
        return;
      this.sculptTimer_ = window.setInterval(tool.cbContinuous_, 16.6);
    },
    end: function () {
      this.getCurrentTool().end();
      if (this.sculptTimer_ !== -1) {
        clearInterval(this.sculptTimer_);
        this.sculptTimer_ = -1;
      }
    },
    update: function () {
      if (this.isUsingContinuous())
        return;
      this.getCurrentTool().update();
    }
  };

  return Sculpt;
});