define([], function () {

  'use strict';

  var Replay = function () {
    this.stack_ = [];
  };

  Replay.prototype = {
    pushMouseCanvas: function (x, y) {
      var obj = {};
      obj.x = x;
      obj.y = y;
      this.stack_.push(obj);
    },
  };

  return Replay;
});