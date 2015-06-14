define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

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
    getScale: function () {
      var m = this._matrix;
      return Math.sqrt(m[0] * m[0] + m[4] * m[4] + m[8] * m[8]);
    },
    getSymmetryOrigin: function () {
      return this._center;
    },
    getSymmetryNormal: function () {
      return this._symmetryNormal;
    },
    updateCenter: function () {
      var box = this._mesh.getBound();
      vec3.set(this._center, (box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5);
    },
    /** Pre compute mv and mvp matrices as well as the depth center */
    computeMatrices: function (camera) {
      mat3.normalFromMat4(this._cacheEN, this._editMatrix);
      mat4.mul(this._cacheMV, camera._view, this._matrix);
      mat3.normalFromMat4(this._cacheN, this._cacheMV);
      mat4.mul(this._cacheMVP, camera._proj, this._cacheMV);
      var cen = this._center;
      var m = this._cacheMVP;
      this._cacheDepth = m[2] * cen[0] + m[6] * cen[1] + m[10] * cen[2] + m[14];
    },
    scaleAndCenter: function () {
      var box = this._mesh.getBound();
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
    })()
  };

  return TransformData;
});