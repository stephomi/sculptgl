define([
  'lib/glMatrix',
  'render/Buffer',
  'render/Attribute',
  'render/Shader',
  'misc/Utils'
], function (glm, Buffer, Attribute, Shader, Utils) {

  'use strict';

  var mat4 = glm.mat4;

  function Grid(gl) {
    this.gl_ = gl; // webgl context

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this.vertCoords = null;

    this.matrix_ = mat4.create();
    this.cacheMVP_ = mat4.create();

    this.shader_ = null; // the shader
    this.init();
  }

  Grid.prototype = {
    /** Return webgl context */
    getGL: function () {
      return this.gl_;
    },
    /** Return vertex buffer */
    getVertexBuffer: function () {
      return this.vertexBuffer_;
    },
    /** Return model view projection */
    getMVP: function () {
      return this.cacheMVP_;
    },
    /** Compute mvp matrix */
    computeMatrices: (function () {
      var tmp = mat4.create();
      return function (camera) {
        mat4.mul(tmp, camera.view_, this.matrix_);
        mat4.mul(this.cacheMVP_, camera.proj_, tmp);
      };
    })(),
    /** Initialize Vertex Buffer Object (VBO) */
    init: function () {
      mat4.translate(this.matrix_, this.matrix_, [0.0, -20.0, 0.0]);
      this.vertCoords = this.getGridVertices();
      this.initBuffer();
      this.shader_ = Shader[Shader.mode.GRID].getOrCreate(this.gl_);
    },
    /** Free gl memory */
    release: function () {
      this.getVertexBuffer().release();
    },
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffer: function () {
      this.getVertexBuffer().update(this.vertCoords);
    },
    /** Render the background */
    render: function () {
      this.shader_.draw(this);
    },
    getGridVertices: function () {
      var scale = Utils.SCALE;
      var cx = -scale * 0.5;
      var cy = 0.0;
      var cz = -scale * 0.5;

      var wx = scale;
      var wy = 0.0;
      var wz = 0.0;

      var hx = 0.0;
      var hy = 0.0;
      var hz = scale;

      var res1 = 20;
      var res2 = res1;

      var vertices = new Float32Array((res1 + res2) * 2 * 3);
      var i = 0;
      var j = 0;
      var sx = wx / (res1 - 1);
      var sy = wy / (res1 - 1);
      var sz = wz / (res1 - 1);
      var ux = cx + wx + hx;
      var uy = cy + wy + hy;
      var uz = cz + wz + hz;
      for (i = 0; i < res1; ++i) {
        j = i * 6;
        vertices[j] = cx + sx * i;
        vertices[j + 1] = cy + sy * i;
        vertices[j + 2] = cz + sz * i;
        vertices[j + 3] = ux - sx * (res1 - i - 1);
        vertices[j + 4] = uy - sy * (res1 - i - 1);
        vertices[j + 5] = uz - sz * (res1 - i - 1);
      }
      sx = hx / (res2 - 1);
      sy = hy / (res2 - 1);
      sz = hz / (res2 - 1);
      for (i = 0; i < res2; ++i) {
        j = (res1 + i) * 6;
        vertices[j] = cx + sx * i;
        vertices[j + 1] = cy + sy * i;
        vertices[j + 2] = cz + sz * i;
        vertices[j + 3] = ux - sx * (res2 - i - 1);
        vertices[j + 4] = uy - sy * (res2 - i - 1);
        vertices[j + 5] = uz - sz * (res2 - i - 1);
      }
      return vertices;
    }
  };

  return Grid;
});