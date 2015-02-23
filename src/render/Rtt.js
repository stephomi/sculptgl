define([
  'render/Buffer',
  'render/Shader',
  'render/WebGLCaps'
], function (Buffer, Shader, WebGLCaps) {

  'use strict';

  var Rtt = function (gl) {
    this.gl_ = gl; // webgl context

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this.rtt_ = gl.createTexture();
    this.depth_ = gl.createRenderbuffer();
    this.framebuffer_ = gl.createFramebuffer();

    this.shader_ = null; // the shader

    this.init();
  };

  Rtt.prototype = {
    getGL: function () {
      return this.gl_;
    },
    getVertexBuffer: function () {
      return this.vertexBuffer_;
    },
    getFramebuffer: function () {
      return this.framebuffer_;
    },
    getTexture: function () {
      return this.rtt_;
    },
    init: function () {
      var gl = this.gl_;

      // set texture parameter
      gl.bindTexture(gl.TEXTURE_2D, this.rtt_);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var quad = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
      this.vertexBuffer_.update(quad);

      this.shader_ = Shader[Shader.mode.RTT].getOrCreate(gl);
    },
    getType: function (gl) {
      if (WebGLCaps.hasRTTHalfFloat())
        return WebGLCaps.HALF_FLOAT_OES;
      if (WebGLCaps.hasRTTFloat())
        return gl.FLOAT;
      return gl.UNSIGNED_BYTE;
    },
    onResize: function (width, height) {
      var gl = this.gl_;
      var type = this.getType(gl);

      gl.bindTexture(gl.TEXTURE_2D, this.rtt_);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);

      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer_);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rtt_, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_);
    },
    release: function () {
      if (this.rtt_)
        this.gl_.deleteTexture(this.rtt_);
      this.getVertexBuffer().release();
    },
    render: function () {
      this.shader_.draw(this);
    }
  };

  return Rtt;
});