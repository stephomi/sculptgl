define(function (require, exports, module) {

  'use strict';

  var Attribute = function (gl, program, name, size, type) {
    this._gl = gl; // webgl context
    this._location = gl.getAttribLocation(program, name); // the location
    this._size = size; // numbe of components
    this._type = type; // type of the components
  };

  Attribute.prototype = {
    /** Update the buffer content */
    bindToBuffer: function (buffer) {
      var gl = this._gl;
      buffer.bind();
      gl.enableVertexAttribArray(this._location);
      gl.vertexAttribPointer(this._location, this._size, this._type, false, 0, 0);
    }
  };

  module.exports = Attribute;
});