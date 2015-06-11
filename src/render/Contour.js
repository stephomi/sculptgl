define([
  'misc/Utils',
  'render/Shader',
  'render/Rtt'
], function (Utils, Shader, Rtt) {

  'use strict';

  var Contour = function (gl) {
    Rtt.call(this, gl);
    this._depth = null; // no need for a z-buffer
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

  return Contour;
});