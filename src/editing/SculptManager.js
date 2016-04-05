define(function (require, exports, module) {

  'use strict';

  var Selection = require('drawables/Selection');
  var Tools = require('editing/tools/Tools');
  var Enums = require('misc/Enums');

  var SculptManager = function (main) {
    this._main = main;

    this._toolIndex = Enums.Tools.BRUSH; // sculpting mode
    this._tools = []; // the sculpting tools

    // symmetry stuffs
    this._symmetry = true; // if symmetric sculpting is enabled  

    // continuous stuffs
    this._continuous = false; // continuous sculpting
    this._sculptTimer = -1; // continuous interval timer

    this._selection = new Selection(main._gl); // the selection geometry (red hover circle)

    this.init();
  };

  SculptManager.prototype = {
    setToolIndex: function (id) {
      this._toolIndex = id;
    },
    getToolIndex: function () {
      return this._toolIndex;
    },
    getCurrentTool: function () {
      return this._tools[this._toolIndex];
    },
    getSymmetry: function () {
      return this._symmetry;
    },
    getTool: function (index) {
      return this._tools[index];
    },
    getSelection: function () {
      return this._selection;
    },
    init: function () {
      var main = this._main;
      var tools = this._tools;
      for (var i = 0, nb = Tools.length; i < nb; ++i) {
        if (Tools[i]) tools[i] = new Tools[i](main);
      }
    },
    canBeContinuous: function () {
      switch (this._toolIndex) {
      case Enums.Tools.TWIST:
      case Enums.Tools.MOVE:
      case Enums.Tools.DRAG:
      case Enums.Tools.LOCALSCALE:
      case Enums.Tools.TRANSFORM:
        return false;
      default:
        return true;
      }
    },
    isUsingContinuous: function () {
      return this._continuous && this.canBeContinuous();
    },
    start: function (ctrl) {
      var tool = this.getCurrentTool();
      var canEdit = tool.start(ctrl);
      if (this._main.getPicking().getMesh() && this.isUsingContinuous())
        this._sculptTimer = window.setInterval(tool._cbContinuous, 16.6);
      return canEdit;
    },
    end: function () {
      this.getCurrentTool().end();
      if (this._sculptTimer !== -1) {
        clearInterval(this._sculptTimer);
        this._sculptTimer = -1;
      }
    },
    preUpdate: function () {
      this.getCurrentTool().preUpdate(this.canBeContinuous());
    },
    update: function () {
      if (this.isUsingContinuous())
        return;
      this.getCurrentTool().update();
    },
    postRender: function () {
      this.getCurrentTool().postRender(this._selection);
    },
    addSculptToScene: function (scene) {
      return this.getCurrentTool().addSculptToScene(scene);
    }
  };

  module.exports = SculptManager;
});
