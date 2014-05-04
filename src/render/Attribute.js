define([], function () {

  'use strict';

  var Attribute = function (gl, program, name, size, type) {
    this.gl_ = gl; // webgl context
    this.location_ = gl.getAttribLocation(program, name); // the location
    this.size_ = size; // numbe of components
    this.type_ = type; // type of the components
  };

  Attribute.prototype = {
    /** Update the buffer content */
    bindToBuffer: function (buffer) {
      var gl = this.gl_;
      buffer.bind();
      gl.enableVertexAttribArray(this.location_);
      gl.vertexAttribPointer(this.location_, this.size_, this.type_, false, 0, 0);
    }
  };

  return Attribute;
});