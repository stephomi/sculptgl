define([], function () {

  'use strict';

  function Background(gl) {
    this.gl_ = gl; //webgl context

    this.vertexBuffer_ = null; //vertices buffer
    this.texBuffer_ = null; //tex coord buffer
    this.backgroundLoc_ = null; //texture background

    this.shaderProgram_ = null; //program shader
    this.fragmentShader_ = null; //fragment shader
    this.vertexShader_ = null; //fragment shader

    this.vertexAttrib_ = null; //vertex attribute location
    this.texAttrib_ = null; //tex coords attribute location
    this.backgroundTexUnif_ = null; //background texture uniform location
  }

  Background.prototype = {
    /** Initialize the shaders on the mesh */
    initShaders: function (shaders) {
      var gl = this.gl_;
      this.loadShaders(shaders.backgroundVertex, shaders.backgroundFragment);

      this.shaderProgram_ = gl.createProgram();
      var shaderProgram = this.shaderProgram_;

      gl.attachShader(shaderProgram, this.vertexShader_);
      gl.attachShader(shaderProgram, this.fragmentShader_);
      gl.linkProgram(shaderProgram);
      gl.useProgram(shaderProgram);

      this.vertexAttrib_ = gl.getAttribLocation(this.shaderProgram_, 'vertex');
      this.texAttrib_ = gl.getAttribLocation(this.shaderProgram_, 'texCoord');
      this.backgroundTexUnif_ = gl.getUniformLocation(shaderProgram, 'backgroundTex');

      gl.detachShader(shaderProgram, this.fragmentShader_);
      gl.deleteShader(this.fragmentShader_);
      gl.detachShader(shaderProgram, this.vertexShader_);
      gl.deleteShader(this.vertexShader_);
    },
    /** Load vertex and fragment shaders */
    loadShaders: function (vertex, fragment) {
      var gl = this.gl_;
      this.vertexShader_ = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(this.vertexShader_, vertex);
      gl.compileShader(this.vertexShader_);
      this.fragmentShader_ = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(this.fragmentShader_, fragment);
      gl.compileShader(this.fragmentShader_);
    },
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffer: function () {
      var gl = this.gl_;

      var vertCoords = [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0];

      this.vertexBuffer_ = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertCoords), gl.DYNAMIC_DRAW);

      var texCoords = [0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0];

      this.texBuffer_ = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.DYNAMIC_DRAW);
    },
    /** Initialize Vertex Buffer Object (VBO) */
    init: function (shaders) {
      this.initBuffer();
      this.initShaders(shaders);
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
      var gl = this.gl_;
      gl.useProgram(this.shaderProgram_);

      gl.enableVertexAttribArray(this.vertexAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.vertexAttribPointer(this.vertexAttrib_, 2, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(this.texAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer_);
      gl.vertexAttribPointer(this.texAttrib_, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.backgroundLoc_);
      gl.uniform1i(this.backgroundTexUnif_, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);

      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
    }
  };

  return Background;
});