define([
  'lib/glMatrix',
  'render/Buffer',
  'render/Attribute',
  'render/Shader',
  'misc/Utils'
], function (glm, Buffer, Attribute, Shader, Utils) {

  'use strict';

  var mat4 = glm.mat4;

  var Grid = function (gl) {
    this._gl = gl; // webgl context

    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // vertices buffer
    this.vertCoords = null;

    this._matrix = mat4.create();
    this._cacheMVP = mat4.create();

    this._shader = null; // the shader
    this._bbox = new Float32Array(6);
    this.init();
  };

  Grid.prototype = {
    /** Return webgl context */
    getGL: function () {
      return this._gl;
    },
    /** Return vertex buffer */
    getVertexBuffer: function () {
      return this._vertexBuffer;
    },
    /** Return model view projection */
    getMVP: function () {
      return this._cacheMVP;
    },
    /** Compute mvp matrix */
    computeMatrices: (function () {
      var tmp = mat4.create();
      return function (camera) {
        mat4.mul(tmp, camera._view, this._matrix);
        mat4.mul(this._cacheMVP, camera._proj, tmp);
      };
    })(),
    /** Initialize Vertex Buffer Object (VBO) */
    init: function () {
      mat4.translate(this._matrix, this._matrix, [0.0, -20.0, 0.0]);
      this.vertCoords = this.getGridVertices();
      this.initBuffer();
      this._shader = Shader[Shader.mode.GRID].getOrCreate(this._gl);
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
      this._shader.draw(this);
    },
    getBound: function () {
      return this._bbox;
    },
    getGridVertices: function () {
      var scale = Utils.SCALE;
      var sdiv2 = scale * 0.5;
      var cx = -sdiv2;
      var cy = 0.0;
      var cz = -sdiv2;

      this._bbox[0] = this._bbox[2] = -sdiv2;
      this._bbox[1] = -1e-5;
      this._bbox[3] = this._bbox[5] = sdiv2;
      this._bbox[4] = 1e-5;

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