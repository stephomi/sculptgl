define([
  'render/Buffer',
  'render/Shader'
], function (Buffer, Shader) {

  'use strict';

  var Background = function (gl, main) {
    this._main = main;
    this._gl = gl; // webgl context

    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this._texCoordBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // tex coord buffer
    this._backgroundLoc = null; // texture background
    this._tex = null; // the texture
    this._fill = true; // if the canvas should be fille by the background

    this._shader = null; // the shader
    this.init();
  };

  Background.prototype = {
    loadBackground: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      var reader = new FileReader();
      var canvas = this._main.getCanvas();
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;
        this.loadBackgroundTexture(bg);
        this.onResize(canvas.width, canvas.height);
        this._main.render();
        document.getElementById('backgroundopen').value = '';
      }.bind(this);
      reader.readAsDataURL(file);
    },
    getGL: function () {
      return this._gl;
    },
    getVertexBuffer: function () {
      return this._vertexBuffer;
    },
    getTexCoordBuffer: function () {
      return this._texCoordBuffer;
    },
    init: function () {
      this.getTexCoordBuffer().update(new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]));
      this._shader = Shader[Shader.mode.BACKGROUND].getOrCreate(this._gl);

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
      if (this._backgroundLoc)
        this._gl.deleteTexture(this._backgroundLoc);
      this.getVertexBuffer().release();
      this.getTexCoordBuffer().release();
    },
    onResize: function (width, height) {
      if (!this._tex) return;
      var ratio = (width / height) / (this._tex.width / this._tex.height);
      var comp = this._fill ? 1.0 / ratio : ratio;
      var x = comp < 1.0 ? 1.0 : 1.0 / ratio;
      var y = comp < 1.0 ? ratio : 1.0;
      this.getVertexBuffer().update(new Float32Array([-x, -y, x, -y, -x, y, x, y]));
    },
    loadBackgroundTexture: function (tex) {
      var gl = this._gl;
      if (this._backgroundLoc)
        gl.deleteTexture(this._backgroundLoc);
      this._tex = tex;
      this._backgroundLoc = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this._backgroundLoc);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    render: function () {
      if (!this._tex) return;
      this._shader.draw(this);
    }
  };

  return Background;
});