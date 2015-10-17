define(function (require, exports, module) {

  'use strict';

  var StateCustom = function (undocb, redocb) {
    this._undocb = undocb;
    this._redocb = redocb ? redocb : undocb;
  };

  StateCustom.prototype = {
    isNoop: function () {
      return !this._undocb;
    },
    undo: function () {
      this._undocb();
    },
    redo: function () {
      this._redocb();
    },
    createRedo: function () {
      return new StateCustom(this._undocb, this._redocb);
    }
  };

  module.exports = StateCustom;
});