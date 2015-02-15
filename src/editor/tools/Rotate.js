define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  var Rotate = function (states) {
    SculptBase.call(this, states);
    this.lastNormalizedMouseXY_ = [0.0, 0.0]; // last mouse position ( 0..1 )
    this.matrixInv_ = mat4.create(); // origin matrix inverse
    this.preTranslate_ = mat4.create(); // pre translate matrix
    this.postTranslate_ = mat4.create(); // post translate matrix
    this.dir_ = [0.0, 0.0, 0.0];
    this.negative_ = false;
    this.isNegative_ = false;
    this.refMX_ = 0.0;
    this.refMY_ = 0.0;
    this.appliedRot_ = mat4.create();
    this.editRot_ = mat4.create();
  };

  Rotate.prototype = {
    end: function () {
      SculptBase.prototype.endTransform.apply(this, arguments);
    },
    applyEditMatrix: function (iVerts) {
      var mesh = this.mesh_;
      var em = mesh.getEditMatrix();
      var mAr = mesh.getMaterials();
      var vAr = mesh.getVertices();
      var vTemp = [0.0, 0.0, 0.0];
      for (var i = 0, nb = iVerts.length; i < nb; ++i) {
        var j = iVerts[i] * 3;
        var mask = mAr[j + 2];
        var x = vTemp[0] = vAr[j];
        var y = vTemp[1] = vAr[j + 1];
        var z = vTemp[2] = vAr[j + 2];
        vec3.transformMat4(vTemp, vTemp, em);
        var iMask = 1.0 - mask;
        vAr[j] = x * iMask + vTemp[0] * mask;
        vAr[j + 1] = y * iMask + vTemp[1] * mask;
        vAr[j + 2] = z * iMask + vTemp[2] * mask;
      }
      mat4.identity(em);
      if (iVerts.length === mesh.getNbVertices()) mesh.updateGeometry();
      else mesh.updateGeometry(mesh.getFacesFromVertices(iVerts), iVerts);
    },
    /** Start sculpting operation */
    startSculpt: (function () {
      var tmp = [0.0, 0.0, 0.0];
      var rot = mat3.create();
      var qu = [0.0, 0.0, 0.0, 1.0];
      return function (main) {
        var camera = main.getCamera();
        this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(main.mouseX_, main.mouseY_, camera.width_, camera.height_);

        var matrix = this.mesh_.getMatrix();
        mat4.invert(this.matrixInv_, matrix);
        vec3.transformMat3(tmp, this.mesh_.getCenter(), mat3.fromMat4(rot, matrix));
        vec3.set(tmp, tmp[0] + matrix[12], tmp[1] + matrix[13], tmp[2] + matrix[14]);
        quat.identity(qu);
        mat4.fromRotationTranslation(this.preTranslate_, qu, tmp);
        mat4.fromRotationTranslation(this.postTranslate_, qu, vec3.negate(tmp, tmp));

        var near = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 0.0);
        var far = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 1.0);
        quat.invert(qu, camera.quatRot_);
        vec3.transformQuat(near, near, qu);
        vec3.transformQuat(far, far, qu);
        vec3.normalize(this.dir_, vec3.sub(this.dir_, far, near));
        this.refMX_ = main.mouseX_;
        this.refMY_ = main.mouseY_;
        mat4.identity(this.appliedRot_);
        this.isNegative_ = this.negative_;
      };
    })(),
    /** Update sculpting operation */
    update: (function () {
      var qu = [0.0, 0.0, 0.0, 1.0];
      var axis = [0.0, 0.0, 0.0];
      var matRot = mat4.create();
      return function (main) {
        var mesh = this.mesh_;
        var camera = main.getCamera();

        if (this.isNegative_ !== this.negative_)
          mat4.copy(this.appliedRot_, this.editRot_);

        if (this.negative_) {
          var angle = (main.mouseX_ - this.refMX_ + main.mouseY_ - this.refMY_) / 100.0;
          vec3.transformQuat(axis, this.dir_, camera.quatRot_);
          mat4.fromQuat(this.editRot_, quat.setAxisAngle(qu, axis, angle));

          this.isNegative_ = true;
          this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(main.mouseX_, main.mouseY_, camera.width_, camera.height_);
        } else {
          var lastNormalized = this.lastNormalizedMouseXY_;
          var normalizedMouseXY = Geometry.normalizedMouse(main.mouseX_, main.mouseY_, camera.width_, camera.height_);
          var length = vec2.dist(lastNormalized, normalizedMouseXY);
          vec3.set(axis, lastNormalized[1] - normalizedMouseXY[1], normalizedMouseXY[0] - lastNormalized[0], 0.0);
          vec3.normalize(axis, axis);

          vec3.transformQuat(axis, axis, quat.invert(qu, camera.quatRot_));
          mat4.fromQuat(this.editRot_, quat.setAxisAngle(qu, axis, length * 2.0));

          this.refMX_ = main.mouseX_;
          this.refMY_ = main.mouseY_;
          this.isNegative_ = false;
        }

        mat4.mul(this.editRot_, this.editRot_, this.appliedRot_);

        mat4.mul(matRot, this.preTranslate_, this.editRot_);
        mat4.mul(matRot, matRot, this.postTranslate_);

        var matrix = mesh.getEditMatrix();
        mat4.mul(matrix, this.matrixInv_, matRot);
        mat4.mul(matrix, matrix, mesh.getMatrix());

        main.render();
        main.getCanvas().style.cursor = 'default';
      };
    })()
  };

  Utils.makeProxy(SculptBase, Rotate);

  return Rotate;
});