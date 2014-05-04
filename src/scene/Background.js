define([
  'render/Buffer',
  'render/Attribute',
  'render/Shader'
], function (Buffer, Attribute, Shader) {

  'use strict';

  function Background(gl) {
    this.gl_ = gl; // webgl context

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this.texCoordBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // tex coord buffer
    this.backgroundLoc_ = null; // texture background

    this.shader_ = null; // the shader
    this.init();
  }

  Background.prototype = {
    /** Return vertex buffer */
    getVertexBuffer: function () {
      return this.vertexBuffer_;
    },
    /** Return tex coord buffer */
    getTexCoordBuffer: function () {
      return this.texCoordBuffer_;
    },
    /** Initialize Vertex Buffer Object (VBO) */
    init: function () {
      this.initBuffer();
      this.shader_ = Shader[Shader.mode.BACKGROUND].getOrCreate(this.gl_);
    },
    /** Free gl memory */
    release: function () {
      if (this.backgroundLoc_)
        this.gl_.deleteTexture(this.backgroundLoc_);
      this.getVertexBuffer().release();
      this.getTexCoordBuffer().release();
    },
    /** Return the configuration of the shader */
    getConfig: function () {
      return Shader[Shader.mode.BACKGROUND];
    },
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffer: function () {
      var vertCoords = [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0];
      this.getVertexBuffer().update(new Float32Array(vertCoords));

      var texCoords = [0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0];
      this.getTexCoordBuffer().update(new Float32Array(texCoords));
    },
    /** Load background texture */
    loadBackgroundTexture: function (tex) {
      var gl = this.gl_;
      if (this.backgroundLoc_)
        gl.deleteTexture(this.backgroundLoc_);
      this.backgroundLoc_ = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.backgroundLoc_);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    /** Render the background */
    render: function () {
      this.shader_.draw(this);
    }
  };

  return Background;
});