define([
  'render/Buffer',
  'render/Shader'
], function (Buffer, Shader) {

  'use strict';

  function Background(gl, main) {
    this.main_ = main;
    this.gl_ = gl; // webgl context

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this.texCoordBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // tex coord buffer
    this.backgroundLoc_ = null; // texture background
    this.tex_ = null; // the texture
    this.fill_ = true; // if the canvas should be fille by the background

    this.vertCoords = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    this.texCoords = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);

    this.shader_ = null; // the shader
    this.init();
  }

  Background.prototype = {
    loadBackground: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      var reader = new FileReader();
      var canvas = this.main_.getCanvas();
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;
        this.loadBackgroundTexture(bg);
        this.onResize(canvas.width, canvas.height);
        this.main_.render();
        document.getElementById('backgroundopen').value = '';
      }.bind(this);
      reader.readAsDataURL(file);
    },
    getGL: function () {
      return this.gl_;
    },
    getVertexBuffer: function () {
      return this.vertexBuffer_;
    },
    getTexCoordBuffer: function () {
      return this.texCoordBuffer_;
    },
    init: function () {
      this.initBuffer();
      this.shader_ = Shader[Shader.mode.BACKGROUND].getOrCreate(this.gl_);

      var cbLoadBackground = this.loadBackground.bind(this);
      document.getElementById('backgroundopen').addEventListener('change', cbLoadBackground, false);
      this.removeCallback = function () {
        document.getElementById('backgroundopen').removeEventListener('change', cbLoadBackground, false);
      };
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    release: function () {
      if (this.backgroundLoc_)
        this.gl_.deleteTexture(this.backgroundLoc_);
      this.getVertexBuffer().release();
      this.getTexCoordBuffer().release();
    },
    initBuffer: function () {
      this.getVertexBuffer().update(this.vertCoords);
      this.getTexCoordBuffer().update(this.texCoords);
    },
    onResize: function (width, height) {
      if (!this.tex_) return;
      var ratio = (width / height) / (this.tex_.width / this.tex_.height);
      var comp = this.fill_ ? 1.0 / ratio : ratio;
      var x = comp < 1.0 ? 1.0 : 1.0 / ratio;
      var y = comp < 1.0 ? ratio : 1.0;
      this.vertCoords.set([-x, -y, x, -y, -x, y, x, y]);
      this.getVertexBuffer().update(this.vertCoords);
    },
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
    render: function () {
      if (!this.tex_) return;
      this.shader_.draw(this);
    }
  };

  return Background;
});