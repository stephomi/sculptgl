define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'states/StateTransform',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, StateTransform, SculptBase) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  function Rotate(states) {
    SculptBase.call(this, states);
    this.lastNormalizedMouseXY_ = [0.0, 0.0]; // last mouse position ( 0..1 )
    this.preTranslate_ = mat4.create(); // pre translate matrix
    this.postTranslate_ = mat4.create(); // post translate matrix
  }

  Rotate.prototype = {
    /** Push undo operation */
    pushState: function () {
      this.states_.pushState(new StateTransform(this.mesh_));
    },
    /** Start sculpting operation */
    startSculpt: (function () {
      var tmp = [0.0, 0.0, 0.0];
      var rot = mat3.create();
      var qu = [0.0, 0.0, 0.0, 1.0];
      return function (sculptgl) {
        var camera = sculptgl.scene_.getCamera();
        this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(sculptgl.mouseX_, sculptgl.mouseY_, camera.width_, camera.height_);

        var matrix = this.mesh_.getMatrix();
        vec3.transformMat3(tmp, this.mesh_.getCenter(), mat3.fromMat4(rot, matrix));
        vec3.set(tmp, tmp[0] + matrix[12], tmp[1] + matrix[13], tmp[2] + matrix[14]);
        mat4.fromRotationTranslation(this.preTranslate_, qu, tmp);
        mat4.fromRotationTranslation(this.postTranslate_, qu, vec3.negate(tmp, tmp));
      };
    })(),
    /** Update sculpting operation */
    update: (function () {
      var qu = [0.0, 0.0, 0.0, 1.0];
      var axis = [0.0, 0.0, 0.0];
      var matRot = mat4.create();
      return function (sculptgl) {
        var mesh = this.mesh_;
        var camera = sculptgl.scene_.getCamera();
        var lastNormalized = this.lastNormalizedMouseXY_;

        var normalizedMouseXY = Geometry.normalizedMouse(sculptgl.mouseX_, sculptgl.mouseY_, camera.width_, camera.height_);
        var length = vec2.dist(this.lastNormalizedMouseXY_, normalizedMouseXY);
        vec3.set(axis, lastNormalized[1] - normalizedMouseXY[1], normalizedMouseXY[0] - this.lastNormalizedMouseXY_[0], 0.0);
        vec3.normalize(axis, axis);
        this.lastNormalizedMouseXY_ = normalizedMouseXY;

        vec3.transformQuat(axis, axis, quat.invert(qu, camera.quatRot_));
        mat4.fromQuat(matRot, quat.setAxisAngle(qu, axis, length * 2.0));

        var matrix = mesh.getMatrix();
        mat4.mul(matRot, this.preTranslate_, matRot);
        mat4.mul(matRot, matRot, this.postTranslate_);

        mat4.mul(matrix, matRot, matrix);
      };
    })()
  };

  Utils.makeProxy(SculptBase, Rotate);

  return Rotate;
});