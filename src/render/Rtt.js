define([
  'render/Buffer',
  'render/Shader',
  'render/WebGLCaps'
], function (Buffer, Shader, WebGLCaps) {

  'use strict';

  var Rtt = function (gl) {
    this._gl = gl; // webgl context

    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this._rtt = gl.createTexture();
    this._depth = gl.createRenderbuffer();
    this._framebuffer = gl.createFramebuffer();

    this._shader = null; // the shader

    this._size = [0, 0];

    this.init();
  };

  Rtt.prototype = {
    getGL: function () {
      return this._gl;
    },
    getVertexBuffer: function () {
      return this._vertexBuffer;
    },
    getFramebuffer: function () {
      return this._framebuffer;
    },
    getTexture: function () {
      return this._rtt;
    },
    init: function () {
      var gl = this._gl;

      // set texture parameter
      gl.bindTexture(gl.TEXTURE_2D, this._rtt);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this._vertexBuffer.update(new Float32Array([-1.0, -1.0, 4.0, -1.0, -1.0, 4.0]));

      this._shader = Shader[this.getShaderType()].getOrCreate(gl);
    },
    getShaderType: function () {
      return Shader.mode.RTT;
    },
    getType: function (gl) {
      if (WebGLCaps.hasRTTHalfFloat())
        return WebGLCaps.HALF_FLOAT_OES;
      if (WebGLCaps.hasRTTFloat())
        return gl.FLOAT;
      return gl.UNSIGNED_BYTE;
    },
    onResize: function (width, height) {
      var gl = this._gl;
      var type = this.getType(gl);

      this._size[0] = width;
      this._size[1] = height;

      gl.bindTexture(gl.TEXTURE_2D, this._rtt);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);

      gl.bindRenderbuffer(gl.RENDERBUFFER, this._depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._rtt, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depth);
    },
    release: function () {
      if (this._rtt)
        this._gl.deleteTexture(this._rtt);
      this.getVertexBuffer().release();
    },
    render: function () {
      this._shader.draw(this);
    }
  };

  return Rtt;
});