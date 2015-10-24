define(function (require, exports, module) {

  'use strict';

  var Buffer = require('render/Buffer');
  var Shader = require('render/Shader');
  var WebGLCaps = require('render/WebGLCaps');

  var singletonBuffer;

  var Rtt = function (gl, depth) {
    this._gl = gl; // webgl context

    this._rtt = gl.createTexture();
    this._depth = depth === undefined ? gl.createRenderbuffer() : depth;
    this._framebuffer = gl.createFramebuffer();

    this._shader = null;
    this._invSize = new Float32Array(2);
    this._vertexBuffer = null;

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
    getDepth: function () {
      return this._depth;
    },
    getInverseSize: function () {
      return this._invSize;
    },
    init: function () {
      var gl = this._gl;
      this._shader = Shader[this.getShaderType()].getOrCreate(gl);

      if (!singletonBuffer) {
        singletonBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
        singletonBuffer.update(new Float32Array([-1.0, -1.0, 4.0, -1.0, -1.0, 4.0]));
      }

      this._vertexBuffer = singletonBuffer;
    },
    getShaderType: function () {
      return 'RTT';
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

      this._invSize[0] = 1.0 / width;
      this._invSize[1] = 1.0 / height;

      gl.bindTexture(gl.TEXTURE_2D, this._rtt);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      if (this._depth) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, this._depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._rtt, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depth);

      gl.bindTexture(gl.TEXTURE_2D, null);
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

  module.exports = Rtt;
});