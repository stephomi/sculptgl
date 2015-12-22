define(function (require, exports, module) {

  'use strict';

  var Tools = require('editing/tools/Tools');

  var Sculpt = function (main) {
    this._main = main;

    this._tool = 'BRUSH'; // sculpting mode
    this._tools = []; // the sculpting tools

    // symmetry stuffs
    this._symmetry = true; // if symmetric sculpting is enabled  

    // continuous stuffs
    this._continuous = false; // continuous sculpting
    this._sculptTimer = -1; // continuous interval timer

    this.init();
  };

  Sculpt.prototype = {
    getToolName: function () {
      return this._tool;
    },
    getCurrentTool: function () {
      return this._tools[this._tool];
    },
    getSymmetry: function () {
      return this._symmetry;
    },
    getTool: function (key) {
      return this._tools[key];
    },
    init: function () {
      var main = this._main;
      var tools = this._tools;
      var tnames = Tools.keys;
      for (var i = 0, nb = tnames.length; i < nb; ++i) {
        var tn = tnames[i];
        tools[tn] = new Tools[tn](main);
      }
    },
    canBeContinuous: function () {
      switch (this._tool) {
      case 'TWIST':
      case 'MOVE':
      case 'DRAG':
      case 'LOCALSCALE':
      case 'TRANSFORM':
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
      this.getCurrentTool().postRender();
    },
    addSculptToScene: function (scene) {
      return this.getCurrentTool().addSculptToScene(scene);
    }
  };

  module.exports = Sculpt;
});