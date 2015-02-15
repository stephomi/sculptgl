define([], function () {

  'use strict';

  var StateCustom = function (undocb, redocb) {
    this.undocb_ = undocb;
    this.redocb_ = redocb ? redocb : undocb;
  };

  StateCustom.prototype = {
    undo: function () {
      this.undocb_();
    },
    redo: function () {
      this.redocb_();
    },
    createRedo: function () {
      return new StateCustom(this.undocb_, this.redocb_);
    }
  };

  return StateCustom;
});