define(function (require, exports, module) {

  'use strict';

  var Buffer = require('render/Buffer');
  var Shader = require('render/ShaderLib');
  var WebGLCaps = require('render/WebGLCaps');

  var singletonBuffer;

  var Rtt = function (gl, shaderName, depth, halfFloat) {
    this._gl = gl; // webgl context

    this._texture = gl.createTexture();
    this._depth = depth === undefined ? gl.createRenderbuffer() : depth;
    this._framebuffer = gl.createFramebuffer();

    this._shaderName = shaderName || '';
    this._invSize = new Float32Array(2);
    this._vertexBuffer = null;

    if (halfFloat && WebGLCaps.hasRTTHalfFloat()) this._type = WebGLCaps.HALF_FLOAT_OES;
    else if (halfFloat && WebGLCaps.hasRTTFloat()) this._type = gl.FLOAT;
    else this._type = gl.UNSIGNED_BYTE;

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
      return this._texture;
    },
    getDepth: function () {
      return this._depth;
    },
    getInverseSize: function () {
      return this._invSize;
    },
    init: function () {
      var gl = this._gl;

      if (!singletonBuffer) {
        singletonBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
        singletonBuffer.update(new Float32Array([-1.0, -1.0, 4.0, -1.0, -1.0, 4.0]));
      }

      this._vertexBuffer = singletonBuffer;
    },
    onResize: function (width, height) {
      var gl = this._gl;

      this._invSize[0] = 1.0 / width;
      this._invSize[1] = 1.0 / height;

      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, this._type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      if (this._depth) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, this._depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depth);

      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    release: function () {
      if (this._texture) this._gl.deleteTexture(this._texture);
      this.getVertexBuffer().release();
    },
    render: function (main) {
      Shader[this._shaderName].getOrCreate(this._gl).draw(this, main);
    }
  };

  module.exports = Rtt;
});