define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Buffer = require('render/Buffer');
  var Shader = require('render/ShaderLib');

  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var vec3 = glm.vec3;

  var Selection = function (gl) {
    this._gl = gl;

    this._circleBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this._dotBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this._cacheDotMVP = mat4.create();
    this._cacheDotSymMVP = mat4.create();
    this._cacheCircleMVP = mat4.create();
    this._color = new Float32Array([0.8, 0.0, 0.0]);

    this._offsetX = 0.0; // horizontal offset (when editing the radius)

    this.init();
  };

  var DOT_RADIUS = 50.0; // in pixels

  Selection.prototype = {
    getGL: function () {
      return this._gl;
    },
    getCircleBuffer: function () {
      return this._circleBuffer;
    },
    getDotBuffer: function () {
      return this._dotBuffer;
    },
    getCircleMVP: function () {
      return this._cacheCircleMVP;
    },
    getDotMVP: function () {
      return this._cacheDotMVP;
    },
    getDotSymmetryMVP: function () {
      return this._cacheDotSymMVP;
    },
    getColor: function () {
      return this._color;
    },
    setOffsetX: function (offset) {
      this._offsetX = offset;
    },
    getOffsetX: function () {
      return this._offsetX;
    },
    init: function () {
      this.getCircleBuffer().update(this._getCircleVertices(1.0));
      this.getDotBuffer().update(this._getDotVertices(0.05, 10));
    },
    release: function () {
      this.getCircleBuffer().release();
      this.getDotBuffer().release();
    },
    _getCircleVertices: function (r, nb, full) {
      var nbVertices = nb || 50;
      var radius = r || 1.0;
      var arc = Math.PI * 2;

      var start = full ? 1 : 0;
      var end = full ? nbVertices + 2 : nbVertices;
      var vertices = new Float32Array(end * 3);
      for (var i = start; i < end; ++i) {
        var j = i * 3;
        var segment = (arc * i) / nbVertices;
        vertices[j] = Math.cos(segment) * radius;
        vertices[j + 1] = Math.sin(segment) * radius;
      }
      return vertices;
    },
    _getDotVertices: function (r, nb) {
      return this._getCircleVertices(r, nb, true);
    },
    _updateMatricesBackground: (function () {

      var matPV = mat4.create();
      var tmpMat = mat4.create();
      var tra = [0.0, 0.0, 0.0];

      return function (camera, main) {

        var screenRadius = main.getSculpt().getCurrentTool().getScreenRadius();

        var w = camera._width * 0.5;
        var h = camera._height * 0.5;
        // no need to recompute the ortho proj each time though
        mat4.ortho(matPV, -w, w, -h, h, -10.0, 10.0);

        mat4.identity(tmpMat);
        mat4.translate(tmpMat, tmpMat, vec3.set(tra, -w + main._mouseX + this._offsetX, h - main._mouseY, 0.0));
        // circle mvp
        mat4.scale(this._cacheCircleMVP, tmpMat, vec3.set(tra, screenRadius, screenRadius, screenRadius));
        mat4.mul(this._cacheCircleMVP, matPV, this._cacheCircleMVP);
        // dot mvp
        mat4.scale(this._cacheDotMVP, tmpMat, vec3.set(tra, DOT_RADIUS, DOT_RADIUS, DOT_RADIUS));
        mat4.mul(this._cacheDotMVP, matPV, this._cacheDotMVP);
        // symmetry mvp
        mat4.scale(this._cacheDotSymMVP, this._cacheDotSymMVP, [0.0, 0.0, 0.0]);
      };

    })(),
    _updateMatricesMesh: (function () {

      var matPV = mat4.create();
      var tmpMat = mat4.create();
      var base = [0.0, 0.0, 1.0];
      var axis = [0.0, 0.0, 0.0];
      var tra = [0.0, 0.0, 0.0];

      return function (camera, main) {

        var picking = main.getPicking();
        var pickingSym = main.getPickingSymmetry();
        var worldRadius = Math.sqrt(picking.computeWorldRadius2(true));
        var screenRadius = main.getSculpt().getCurrentTool().getScreenRadius();

        var mesh = picking.getMesh();
        var constRadius = DOT_RADIUS * (worldRadius / screenRadius);

        picking.polyLerp(mesh.getNormals(), axis);
        vec3.transformMat3(axis, axis, mat3.normalFromMat4(tmpMat, mesh.getMatrix()));
        vec3.normalize(axis, axis);
        var rad = Math.acos(vec3.dot(base, axis));
        vec3.cross(axis, base, axis);

        mat4.identity(tmpMat);
        mat4.translate(tmpMat, tmpMat, vec3.transformMat4(tra, picking.getIntersectionPoint(), mesh.getMatrix()));
        mat4.rotate(tmpMat, tmpMat, rad, axis);

        mat4.mul(matPV, camera.getProjection(), camera.getView());

        // circle mvp
        mat4.scale(this._cacheCircleMVP, tmpMat, vec3.set(tra, worldRadius, worldRadius, worldRadius));
        mat4.mul(this._cacheCircleMVP, matPV, this._cacheCircleMVP);
        // dot mvp
        mat4.scale(this._cacheDotMVP, tmpMat, vec3.set(tra, constRadius, constRadius, constRadius));
        mat4.mul(this._cacheDotMVP, matPV, this._cacheDotMVP);
        // symmetry mvp
        vec3.transformMat4(tra, pickingSym.getIntersectionPoint(), mesh.getMatrix());
        mat4.identity(tmpMat);
        mat4.translate(tmpMat, tmpMat, tra);
        mat4.rotate(tmpMat, tmpMat, rad, axis);

        mat4.scale(tmpMat, tmpMat, vec3.set(tra, constRadius, constRadius, constRadius));
        mat4.mul(this._cacheDotSymMVP, matPV, tmpMat);
      };
    })(),
    render: function (main) {
      if (main.getSculpt().getToolName() === 'TRANSFORM')
        return;

      // if there's an offset then it means we are editing the tool radius
      var pickedMesh = main.getPicking().getMesh() && this._offsetX === 0.0;
      if (pickedMesh) this._updateMatricesMesh(main.getCamera(), main);
      else this._updateMatricesBackground(main.getCamera(), main);

      var drawCircle = main._action === 'NOTHING';
      vec3.set(this._color, 0.8, drawCircle && pickedMesh ? 0.0 : 0.4, 0.0);
      Shader.SELECTION.getOrCreate(this._gl).draw(this, drawCircle, main.getSculpt().getSymmetry());
    }
  };

  module.exports = Selection;
});