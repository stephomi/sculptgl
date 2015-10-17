define(function (require, exports, module) {

  'use strict';

  var Buffer = function (gl, type, hint) {
    this._gl = gl; // webgl context
    this._buffer = gl.createBuffer(); // the buffer
    this._type = type; // the type (vert data vs index)
    this._hint = hint; //the buffer update hint
    this._size = 0; // the size of the buffer
  };

  Buffer.prototype = {
    /** Bind the buffer */
    bind: function () {
      this._gl.bindBuffer(this._type, this._buffer);
    },
    /** Release the buffer */
    release: function () {
      this._gl.deleteBuffer(this._buffer);
    },
    /** Update the buffer content */
    update: function (data) {
      this._gl.bindBuffer(this._type, this._buffer);
      if (data.length > this._size) {
        this._gl.bufferData(this._type, data, this._hint);
        this._size = data.length;
      } else {
        this._gl.bufferSubData(this._type, 0, data);
      }
    }
  };

  module.exports = Buffer;
});