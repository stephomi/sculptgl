define([], function () {

  'use strict';

  var Buffer = function (gl, type, hint) {
    this.gl_ = gl; //webgl context
    this.buffer_ = gl.createBuffer(); //the buffer
    this.type_ = type; //the type (vert data vs index)
    this.hint_ = hint; //the buffer update hint
    this.size_ = 0; //the size of the buffer
  };

  Buffer.prototype = {
    /** Bind the buffer */
    bind: function () {
      this.gl_.bindBuffer(this.type_, this.buffer_);
    },
    /** Release the buffer */
    release: function () {
      this.gl_.deleteBuffer(this.buffer_);
    },
    /** Update the buffer content */
    update: function (data) {
      this.gl_.bindBuffer(this.type_, this.buffer_);
      if (data.length > this.size_) {
        this.gl_.bufferData(this.type_, data, this.hint_);
        this.size_ = data.length;
      } else {
        this.gl_.bufferSubData(this.type_, 0, data);
      }
    }
  };

  return Buffer;
});