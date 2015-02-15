define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Translate = function (states) {
    SculptBase.call(this, states);
    this.origin_ = [0.0, 0.0, 0.0]; // plane origin
    this.normal_ = [0.0, 0.0, 0.0]; // plane normal
    this.matrixInv_ = mat4.create(); // origin matrix inverse
  };

  Translate.prototype = {
    end: function () {
      SculptBase.prototype.endTransform.apply(this, arguments);
    },
    applyEditMatrix: function (iVerts) {
      var mesh = this.mesh_;
      var em = mesh.getEditMatrix();
      var mAr = mesh.getMaterials();
      var vAr = mesh.getVertices();
      var tx = em[12];
      var ty = em[13];
      var tz = em[14];
      for (var i = 0, nb = iVerts.length; i < nb; ++i) {
        var j = iVerts[i] * 3;
        var mask = mAr[j + 2];
        vAr[j] += tx * mask;
        vAr[j + 1] += ty * mask;
        vAr[j + 2] += tz * mask;
      }
      mat4.identity(em);
      if (iVerts.length === mesh.getNbVertices()) mesh.updateGeometry();
      else mesh.updateGeometry(mesh.getFacesFromVertices(iVerts), iVerts);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      var picking = main.getPicking();
      var camera = main.getCamera();
      var matrixInv = this.matrixInv_;

      vec3.copy(this.origin_, picking.getIntersectionPoint());

      var near = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 0.0);
      var far = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 1.0);
      mat4.invert(matrixInv, this.mesh_.getMatrix());
      vec3.transformMat4(near, near, matrixInv);
      vec3.transformMat4(far, far, matrixInv);
      vec3.sub(this.normal_, far, near);
    },
    /** Update sculpting operation */
    update: (function () {
      var tra = [0.0, 0.0, 0.0];
      return function (main) {
        var mouseX = main.mouseX_;
        var mouseY = main.mouseY_;
        var camera = main.getCamera();
        var vNear = camera.unproject(mouseX, mouseY, 0.0);
        var vFar = camera.unproject(mouseX, mouseY, 1.0);

        vec3.transformMat4(vNear, vNear, this.matrixInv_);
        vec3.transformMat4(vFar, vFar, this.matrixInv_);
        Geometry.intersectLinePlane(vNear, vFar, this.origin_, this.normal_, tra);
        vec3.sub(tra, tra, this.origin_);

        var m = this.mesh_.getEditMatrix();
        m[12] = tra[0];
        m[13] = tra[1];
        m[14] = tra[2];
        main.render();
      };
    })()
  };

  Utils.makeProxy(SculptBase, Translate);

  return Translate;
});