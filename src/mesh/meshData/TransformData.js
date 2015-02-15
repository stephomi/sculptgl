define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  var TransformData = function (mesh) {
    this.mesh_ = mesh; // the mesh

    this.center_ = vec3.create(); // center of the mesh (local space, before transformation)
    this.matrix_ = mat4.create(); // transformation matrix of the mesh
    this.editMatrix_ = mat4.create(); // edit matrix

    this.symmetryNormal_ = [1.0, 0.0, 0.0]; // symmetry normal

    // the model-view and model-view-projection and normal matrices 
    // are computed at the beginning of each frame (after camera update)
    this.cacheMV_ = mat4.create(); // MV matrix
    this.cacheMVP_ = mat4.create(); // MVP matrix
    this.cacheN_ = mat3.create(); // N matrix
    this.cacheEN_ = mat3.create(); // Editmatrix N matrix
    this.cacheDepth_ = 0.0; // depth of center
  };

  TransformData.prototype = {
    getCenter: function () {
      return this.center_;
    },
    getMV: function () {
      return this.cacheMV_;
    },
    getMVP: function () {
      return this.cacheMVP_;
    },
    getN: function () {
      return this.cacheN_;
    },
    getEN: function () {
      return this.cacheEN_;
    },
    getDepth: function () {
      return this.cacheDepth_;
    },
    getMatrix: function () {
      return this.matrix_;
    },
    getEditMatrix: function () {
      return this.editMatrix_;
    },
    getScale: function () {
      var m = this.matrix_;
      return Math.sqrt(m[0] * m[0] + m[4] * m[4] + m[8] * m[8]);
    },
    getSymmetryOrigin: function () {
      return this.center_;
    },
    getSymmetryNormal: function () {
      return this.symmetryNormal_;
    },
    /** Compute center of mesh */
    computeCenter: function () {
      var box = this.mesh_.getBound();
      vec3.set(this.center_, (box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5);
    },
    /** Pre compute mv and mvp matrices as well as the depth center */
    computeMatrices: function (camera) {
      mat3.normalFromMat4(this.cacheEN_, this.editMatrix_);
      mat4.mul(this.cacheMV_, camera.view_, this.matrix_);
      mat3.normalFromMat4(this.cacheN_, this.cacheMV_);
      mat4.mul(this.cacheMVP_, camera.proj_, this.cacheMV_);
      var cen = this.center_;
      var m = this.cacheMVP_;
      this.cacheDepth_ = m[2] * cen[0] + m[6] * cen[1] + m[10] * cen[2] + m[14];
    },
    /** Scale and center the mesh */
    scaleAndCenter: function () {
      this.computeCenter();
      var box = this.mesh_.getBound();
      var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
      var scale = Utils.SCALE / diag;
      // f32 cast for sgl exporter consistency
      scale = new Float32Array([scale])[0];
      mat4.scale(this.matrix_, this.matrix_, [scale, scale, scale]);
    },
    translate: function (trans) {
      mat4.translate(this.matrix_, this.matrix_, trans);
    },
    /** Move the mesh center to a certain point */
    moveTo: (function () {
      var dummy = [0.0, 0.0, 0.0];
      return function (destination) {
        mat4.translate(this.matrix_, this.matrix_, vec3.sub(dummy, destination, this.center_));
      };
    })()
  };

  return TransformData;
});