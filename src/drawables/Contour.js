define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Shader = require('render/Shader');
  var Rtt = require('drawables/Rtt');

  var Contour = function (gl) {
    Rtt.call(this, gl, null); // no need for a z-buffer
  };

  Contour.prototype = {
    getShaderType: function () {
      return 'CONTOUR';
    },
    getType: function (gl) {
      return gl.UNSIGNED_BYTE;
    },
    isEffective: function () {
      return Shader.CONTOUR.color[3] > 0.0;
    }
  };

  Utils.makeProxy(Rtt, Contour);

  module.exports = Contour;
});