define(function (require, exports, module) {

  'use strict';

  var Buffer = require('render/Buffer');
  var Shader = require('render/Shader');

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

      var self = this;
      var reader = new FileReader();
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;

        bg.onload = function () {

          var canvas = self._main.getCanvas();
          self.loadBackgroundTexture(bg);
          self.onResize(canvas.width, canvas.height);
          self._main.render();
        };
      };

      document.getElementById('backgroundopen').value = '';
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
      this._shader = Shader.BACKGROUND.getOrCreate(this._gl);
      document.getElementById('backgroundopen').addEventListener('change', this.loadBackground.bind(this), false);
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

  module.exports = Background;
});