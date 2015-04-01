define([
  'lib/glMatrix',
  'render/Buffer',
  'render/Attribute',
  'render/Shader'
], function (glm, Buffer, Attribute, Shader) {

  'use strict';

  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var vec3 = glm.vec3;

  var Selection = function (gl) {
    this.gl_ = gl;

    this.circleBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this.dotBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this.cacheDotMVP_ = mat4.create();
    this.cacheDotSymMVP_ = mat4.create();
    this.cacheCircleMVP_ = mat4.create();
    this.color_ = new Float32Array([0.8, 0.0, 0.0]);

    this.shader_ = null;
    this.init();
  };

  Selection.prototype = {
    getGL: function () {
      return this.gl_;
    },
    getCircleBuffer: function () {
      return this.circleBuffer_;
    },
    getDotBuffer: function () {
      return this.dotBuffer_;
    },
    getCircleMVP: function () {
      return this.cacheCircleMVP_;
    },
    getDotMVP: function () {
      return this.cacheDotMVP_;
    },
    getDotSymmetryMVP: function () {
      return this.cacheDotSymMVP_;
    },
    getColor: function () {
      return this.color_;
    },
    init: function () {
      this.getCircleBuffer().update(this.getCircleVertices(1.0));
      this.getDotBuffer().update(this.getDotVertices(0.05, 10));
      this.shader_ = Shader[Shader.mode.SELECTION].getOrCreate(this.gl_);
    },
    computeMatrices: (function () {
      var tmp = mat4.create();
      var nMat = mat3.create();
      var base = [0.0, 0.0, 1.0];
      var axis = [0.0, 0.0, 0.0];
      var tra = [0.0, 0.0, 0.0];
      return function (main) {
        var picking = main.getPicking();
        var mesh = picking.getMesh();
        if (!mesh)
          return;
        var camera = main.getCamera();
        var pickingSym = main.getPickingSymmetry();

        var worldRadius = picking.getWorldRadius();
        var screenRadius = main.getSculpt().getCurrentTool().radius_ || 1;
        var constRadius = 50.0 * (worldRadius / screenRadius);
        vec3.transformMat4(tra, picking.getIntersectionPoint(), mesh.getMatrix());

        picking.polyLerp(mesh.getNormals(), axis);
        vec3.transformMat3(axis, axis, mat3.normalFromMat4(nMat, mesh.getMatrix()));
        vec3.normalize(axis, axis);
        var rad = Math.acos(vec3.dot(base, axis));
        vec3.cross(axis, base, axis);

        mat4.identity(tmp);
        mat4.translate(tmp, tmp, tra);
        mat4.rotate(tmp, tmp, rad, axis);

        // circle mvp
        mat4.scale(this.cacheCircleMVP_, tmp, [worldRadius, worldRadius, worldRadius]);
        mat4.mul(this.cacheCircleMVP_, camera.proj_, mat4.mul(this.cacheCircleMVP_, camera.view_, this.cacheCircleMVP_));

        // dot mvp
        mat4.scale(this.cacheDotMVP_, tmp, [constRadius, constRadius, constRadius]);
        mat4.mul(this.cacheDotMVP_, camera.proj_, mat4.mul(this.cacheDotMVP_, camera.view_, this.cacheDotMVP_));

        // symmetry mvp
        vec3.transformMat4(tra, pickingSym.getIntersectionPoint(), mesh.getMatrix());
        mat4.identity(tmp);
        mat4.translate(tmp, tmp, tra);
        mat4.rotate(tmp, tmp, rad, axis);

        mat4.scale(tmp, tmp, [constRadius, constRadius, constRadius]);
        mat4.mul(this.cacheDotSymMVP_, camera.proj_, mat4.mul(tmp, camera.view_, tmp));
      };
    })(),
    release: function () {
      this.getCircleBuffer().release();
      this.getDotBuffer().release();
    },
    render: function (main) {
      if (!main.getPicking().getMesh())
        return;
      var isSculpting = main.mouseButton_ === 0;
      if (isSculpting)
        vec3.set(this.color_, 0.8, 0.0, 0.0);
      else
        vec3.set(this.color_, 0.8, 0.2, 0.0);
      this.shader_.draw(this, isSculpting, main.getSculpt().getSymmetry());
    },
    getCircleVertices: function (r, nb, full) {
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
    getDotVertices: function (r, nb) {
      return this.getCircleVertices(r, nb, true);
    }
  };

  return Selection;
});