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
    this._main = main;

    this._tool = Sculpt.tool.BRUSH; // sculpting mode
    this._tools = []; // the sculpting tools

    // symmetry stuffs
    this._symmetry = true; // if symmetric sculpting is enabled  

    // continous stuffs
    this._continuous = false; // continuous sculpting
    this._sculptTimer = -1; // continuous interval timer

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
      return this._tools[this._tool];
    },
    getSymmetry: function () {
      return this._symmetry;
    },
    getTool: function (key) {
      return this._tools[key] ? this._tools[key] : this._tools[Sculpt.tool[key]];
    },
    init: function () {
      var main = this._main;
      this._tools[Sculpt.tool.BRUSH] = new Brush(main);
      this._tools[Sculpt.tool.INFLATE] = new Inflate(main);
      this._tools[Sculpt.tool.TWIST] = new Twist(main);
      this._tools[Sculpt.tool.SMOOTH] = new Smooth(main);
      this._tools[Sculpt.tool.FLATTEN] = new Flatten(main);
      this._tools[Sculpt.tool.PINCH] = new Pinch(main);
      this._tools[Sculpt.tool.CREASE] = new Crease(main);
      this._tools[Sculpt.tool.DRAG] = new Drag(main);
      this._tools[Sculpt.tool.PAINT] = new Paint(main);
      this._tools[Sculpt.tool.MOVE] = new Move(main);
      this._tools[Sculpt.tool.MASKING] = new Masking(main);
      this._tools[Sculpt.tool.LOCALSCALE] = new LocalScale(main);
      this._tools[Sculpt.tool.TRANSLATE] = new Translate(main);
      this._tools[Sculpt.tool.ROTATE] = new Rotate(main);
      this._tools[Sculpt.tool.SCALE] = new Scale(main);
    },
    /** Return true if the current tool doesn't prevent picking */
    allowPicking: function () {
      var tool = this._tool;
      var st = Sculpt.tool;
      return tool !== st.TWIST && tool !== st.MOVE && tool !== st.DRAG && tool !== st.LOCALSCALE && tool !== st.TRANSLATE && tool !== st.ROTATE && tool !== st.SCALE;
    },
    /** Return true if the current tool is using continous sculpting */
    isUsingContinuous: function () {
      return this._continuous && this.allowPicking();
    },
    start: function (ctrl) {
      var tool = this.getCurrentTool();
      tool.start(ctrl);
      if (!this._main.getPicking().getMesh() || !this.isUsingContinuous())
        return;
      this._sculptTimer = window.setInterval(tool._cbContinuous, 16.6);
    },
    end: function () {
      this.getCurrentTool().end();
      if (this._sculptTimer !== -1) {
        clearInterval(this._sculptTimer);
        this._sculptTimer = -1;
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