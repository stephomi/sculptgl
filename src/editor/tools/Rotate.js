define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  var Rotate = function (main) {
    SculptBase.call(this, main);
    this._lastNormalizedMouseXY = [0.0, 0.0];
    this._matrixInv = mat4.create();
    this._preTranslate = mat4.create();
    this._postTranslate = mat4.create();
    this._dir = [0.0, 0.0, 0.0];
    this._negative = false;
    this._isNegative = false;
    this._refMX = 0.0;
    this._refMY = 0.0;
    this._appliedRot = mat4.create();
    this._editRot = mat4.create();
  };

  Rotate.prototype = {
    end: SculptBase.prototype.endTransform,
    applyEditMatrix: function (iVerts) {
      var mesh = this._mesh;
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
      var qu = [0.0, 0.0, 0.0, 1.0];
      return function () {
        var main = this._main;
        var camera = main.getCamera();
        this._lastNormalizedMouseXY = Geometry.normalizedMouse(main._mouseX, main._mouseY, camera._width, camera._height);

        var matrix = this._mesh.getMatrix();
        mat4.invert(this._matrixInv, matrix);
        vec3.transformMat4(tmp, this._mesh.getCenter(), matrix);
        mat4.translate(this._preTranslate, mat4.identity(this._preTranslate), tmp);
        mat4.translate(this._postTranslate, mat4.identity(this._postTranslate), vec3.negate(tmp, tmp));

        var near = camera.unproject(camera._width * 0.5, camera._height * 0.5, 0.0);
        var far = camera.unproject(camera._width * 0.5, camera._height * 0.5, 0.1);
        quat.invert(qu, camera._quatRot);
        vec3.transformQuat(near, near, qu);
        vec3.transformQuat(far, far, qu);
        vec3.normalize(this._dir, vec3.sub(this._dir, far, near));
        this._refMX = main._mouseX;
        this._refMY = main._mouseY;
        mat4.identity(this._appliedRot);
        this._isNegative = this._negative;
      };
    })(),
    /** Update sculpting operation */
    update: (function () {
      var qu = [0.0, 0.0, 0.0, 1.0];
      var axis = [0.0, 0.0, 0.0];
      return function () {
        var main = this._main;
        var mesh = this._mesh;
        var camera = main.getCamera();

        if (this._isNegative !== this._negative)
          mat4.copy(this._appliedRot, this._editRot);

        if (this._negative) {
          var angle = (main._mouseX - this._refMX + main._mouseY - this._refMY) / 100.0;
          vec3.transformQuat(axis, this._dir, camera._quatRot);
          mat4.fromQuat(this._editRot, quat.setAxisAngle(qu, axis, angle));

          this._isNegative = true;
          this._lastNormalizedMouseXY = Geometry.normalizedMouse(main._mouseX, main._mouseY, camera._width, camera._height);
        } else {
          var lastNormalized = this._lastNormalizedMouseXY;
          var normalizedMouseXY = Geometry.normalizedMouse(main._mouseX, main._mouseY, camera._width, camera._height);
          var length = vec2.dist(lastNormalized, normalizedMouseXY);
          vec3.set(axis, lastNormalized[1] - normalizedMouseXY[1], normalizedMouseXY[0] - lastNormalized[0], 0.0);
          vec3.normalize(axis, axis);

          vec3.transformQuat(axis, axis, quat.invert(qu, camera._quatRot));
          mat4.fromQuat(this._editRot, quat.setAxisAngle(qu, axis, length * 2.0));

          this._refMX = main._mouseX;
          this._refMY = main._mouseY;
          this._isNegative = false;
        }

        mat4.mul(this._editRot, this._editRot, this._appliedRot);

        var mEdit = mesh.getEditMatrix();
        mat4.mul(mEdit, this._preTranslate, this._editRot);
        mat4.mul(mEdit, mEdit, this._postTranslate);

        mat4.mul(mEdit, this._matrixInv, mEdit);
        mat4.mul(mEdit, mEdit, mesh.getMatrix());

        main.render();
        main.getCanvas().style.cursor = 'default';
      };
    })()
  };

  Utils.makeProxy(SculptBase, Rotate);

  return Rotate;
});