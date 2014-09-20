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
    this.tex_ = null; // the texture
    this.fill_ = true; // if the canvas should be fille by the background

    this.vertCoords = new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0]);
    this.texCoords = new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0]);

    this.shader_ = null; // the shader
    this.init();
  }

  Background.prototype = {
    /** Return webgl context */
    getGL: function () {
      return this.gl_;
    },
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
      this.getVertexBuffer().update(this.vertCoords);
      this.getTexCoordBuffer().update(this.texCoords);
    },
    /** On resize */
    onResize: function (width, height) {
      if (!this.tex_) return;
      var ratio = (width / height) / (this.tex_.width / this.tex_.height);
      var comp = this.fill_ ? 1.0 / ratio : ratio;
      var x = comp < 1.0 ? 1.0 : 1.0 / ratio;
      var y = comp < 1.0 ? ratio : 1.0;
      this.vertCoords.set([-x, -y, -x, y, x, -y, -x, y, x, y, x, -y]);
      this.getVertexBuffer().update(this.vertCoords);
    },
    /** Load background texture */
    loadBackgroundTexture: function (tex) {
      var gl = this.gl_;
      if (this.backgroundLoc_)
        gl.deleteTexture(this.backgroundLoc_);
      this.tex_ = tex;
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
      if (!this.tex_) return;
      this.shader_.draw(this);
    }
  };

  return Background;
});