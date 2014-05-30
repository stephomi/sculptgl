define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'states/StateTransform',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, StateTransform, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Translate(states) {
    SculptBase.call(this, states);
    this.origin_ = [0.0, 0.0, 0.0]; // plane origin
    this.normal_ = [0.0, 0.0, 0.0]; // plane normal
    this.matrix_ = mat4.create(); // origin matrix
    this.matrixInv_ = mat4.create(); // origin matrix inverse
  }

  Translate.prototype = {
    /** Push undo operation */
    pushState: function () {
      this.states_.pushState(new StateTransform(this.mesh_));
    },
    /** Start sculpting operation */
    startSculpt: function (sculptgl) {
      var picking = sculptgl.scene_.getPicking();
      var camera = sculptgl.scene_.getCamera();
      var matrix = this.matrix_;
      var matrixInv = this.matrixInv_;

      mat4.copy(matrix, this.mesh_.getMatrix());
      vec3.copy(this.origin_, picking.getIntersectionPoint());

      var near = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 0.0);
      var far = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 1.0);
      mat4.invert(matrixInv, matrix);
      vec3.transformMat4(near, near, matrixInv);
      vec3.transformMat4(far, far, matrixInv);
      vec3.sub(this.normal_, far, near);

    },
    /** Update sculpting operation */
    update: (function () {
      var inter = [0.0, 0.0, 0.0];
      return function (sculptgl) {
        var mesh = this.mesh_;
        var mouseX = sculptgl.mouseX_;
        var mouseY = sculptgl.mouseY_;
        var camera = sculptgl.scene_.getCamera();
        var vNear = camera.unproject(mouseX, mouseY, 0.0);
        var vFar = camera.unproject(mouseX, mouseY, 1.0);

        vec3.transformMat4(vNear, vNear, this.matrixInv_);
        vec3.transformMat4(vFar, vFar, this.matrixInv_);
        Geometry.intersectLinePlane(vNear, vFar, this.origin_, this.normal_, inter);

        mat4.translate(mesh.getMatrix(), this.matrix_, vec3.sub(inter, inter, this.origin_));
      };
    })()
  };

  Utils.makeProxy(SculptBase, Translate);

  return Translate;
});