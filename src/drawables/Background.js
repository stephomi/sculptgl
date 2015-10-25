define(function (require, exports, module) {

  'use strict';

  var Buffer = require('render/Buffer');
  var Shader = require('render/ShaderLib');

  var Background = function (gl, main) {
    this._main = main;
    this._gl = gl; // webgl context

    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this._texCoordBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // tex coord buffer
    this._fill = true; // if the canvas should be fille by the background

    this._monoTex = null;
    this._texture = null; // texture background
    this._texWidth = 1;
    this._texHeight = 1;

    this.init();
  };

  Background.prototype = {
    init: function () {
      this.getTexCoordBuffer().update(new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]));
      this._monoTex = this.createOnePixelTexture(50, 50, 50, 255);
      document.getElementById('backgroundopen').addEventListener('change', this.loadBackground.bind(this), false);
    },
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
    release: function () {
      this.deleteTexture();
      this.getVertexBuffer().release();
      this.getTexCoordBuffer().release();
    },
    onResize: function (width, height) {
      var ratio = (width / height) / (this._texWidth / this._texHeight);
      var comp = this._fill ? 1.0 / ratio : ratio;
      var x = comp < 1.0 ? 1.0 : 1.0 / ratio;
      var y = comp < 1.0 ? ratio : 1.0;
      this.getVertexBuffer().update(new Float32Array([-x, -y, x, -y, -x, y, x, y]));
    },
    getTexture: function () {
      return this._texture ? this._texture : this._monoTex;
    },
    createOnePixelTexture: function (r, g, b, a) {
      var gl = this._gl;
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, a]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    },
    loadBackgroundTexture: function (tex) {
      var gl = this._gl;
      this.deleteTexture();

      this._texWidth = tex.width;
      this._texHeight = tex.height;
      this._texture = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    deleteTexture: function () {
      if (this._texture) {
        this._texWidth = this._texHeight = 1;
        this._gl.deleteTexture(this._texture);
        this._texture = null;
      }
    },
    render: function () {
      Shader.BACKGROUND.getOrCreate(this._gl).draw(this);
    }
  };

  module.exports = Background;
});