define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');

  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  var TransformData = function (mesh) {
    this._mesh = mesh; // the mesh

    this._center = vec3.create(); // center of the mesh (local space, before transformation)
    this._matrix = mat4.create(); // transformation matrix of the mesh
    this._editMatrix = mat4.create(); // edit matrix

    this._symmetryNormal = [1.0, 0.0, 0.0]; // symmetry normal

    // the model-view and model-view-projection and normal matrices 
    // are computed at the beginning of each frame (after camera update)
    this._cacheMV = mat4.create(); // MV matrix
    this._cacheMVP = mat4.create(); // MVP matrix
    this._cacheN = mat3.create(); // N matrix
    this._cacheEN = mat3.create(); // Editmatrix N matrix
    this._cacheDepth = 0.0; // depth of center

    this._worldBound = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  };

  TransformData.prototype = {
    getCenter: function () {
      return this._center;
    },
    getMV: function () {
      return this._cacheMV;
    },
    getMVP: function () {
      return this._cacheMVP;
    },
    getN: function () {
      return this._cacheN;
    },
    getEN: function () {
      return this._cacheEN;
    },
    getDepth: function () {
      return this._cacheDepth;
    },
    getMatrix: function () {
      return this._matrix;
    },
    getEditMatrix: function () {
      return this._editMatrix;
    },
    getScale2: function () {
      var m = this._matrix;
      return m[0] * m[0] + m[4] * m[4] + m[8] * m[8];
    },
    getScale: function () {
      return Math.sqrt(this.getScale2());
    },
    getSymmetryOrigin: function () {
      return this._center;
    },
    getSymmetryNormal: function () {
      return this._symmetryNormal;
    },
    updateCenter: function () {
      var box = this._mesh.getLocalBound();
      vec3.set(this._center, (box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5);
    },
    /** Pre compute mv and mvp matrices as well as the depth center */
    updateMatrices: function (camera) {
      mat3.normalFromMat4(this._cacheEN, this._editMatrix);
      mat4.mul(this._cacheMV, camera.getView(), this._matrix);
      mat3.normalFromMat4(this._cacheN, this._cacheMV);
      mat4.mul(this._cacheMVP, camera.getProjection(), this._cacheMV);
      var cen = this._center;
      var m = this._cacheMVP;
      this._cacheDepth = m[2] * cen[0] + m[6] * cen[1] + m[10] * cen[2] + m[14];
    },
    normalizeSize: function () {
      var box = this._mesh.getLocalBound();
      var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
      var scale = Utils.SCALE / diag;
      mat4.scale(this._matrix, this._matrix, [scale, scale, scale]);
    },
    translate: function (trans) {
      mat4.translate(this._matrix, this._matrix, trans);
    },
    moveTo: (function () {
      var dummy = [0.0, 0.0, 0.0];
      return function (destination) {
        mat4.translate(this._matrix, this._matrix, vec3.sub(dummy, destination, this._center));
      };
    })(),
    getWorldBound: function () {
      var worldb = this._worldBound;
      var localb = this._mesh.getLocalBound();
      var mat = this._mesh.getMatrix();

      // trans
      worldb[0] = worldb[3] = mat[12];
      worldb[1] = worldb[4] = mat[13];
      worldb[2] = worldb[5] = mat[14];

      // rotate per component
      for (var i = 0; i < 3; ++i) {
        var i4 = i * 4;
        var mini = localb[i];
        var maxi = localb[i + 3];
        for (var j = 0; j < 3; ++j) {
          var cm = mat[i4 + j];
          var a = cm * maxi;
          var b = cm * mini;
          if (a < b) {
            worldb[j] += a;
            worldb[j + 3] += b;
          } else {
            worldb[j] += b;
            worldb[j + 3] += a;
          }
        }
      }

      return worldb;
    }
  };

  module.exports = TransformData;
});