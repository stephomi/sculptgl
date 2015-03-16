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
    this.negative_ = false;
    this.isNegative_ = false;
    this.refMX_ = 0.0;
    this.refMY_ = 0.0;
    this.appliedTrans_ = [0.0, 0.0, 0.0]; // delta to save when switching mode
    this.editTrans_ = [0.0, 0.0, 0.0]; // edited delta
  };

  Translate.prototype = {
    end: SculptBase.prototype.endTransform,
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
      var cen = mesh.getCenter();
      cen[0] += tx;
      cen[1] += ty;
      cen[2] += tz;
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
      var far = camera.unproject(camera.width_ * 0.5, camera.height_ * 0.5, 0.1);
      mat4.invert(matrixInv, this.mesh_.getMatrix());
      vec3.transformMat4(near, near, matrixInv);
      vec3.transformMat4(far, far, matrixInv);
      vec3.normalize(this.normal_, vec3.sub(this.normal_, far, near));

      this.refMX_ = main.mouseX_;
      this.refMY_ = main.mouseY_;
      this.isNegative_ = this.negative_;
      vec3.set(this.appliedTrans_, 0.0, 0.0, 0.0);
      vec3.set(this.editTrans_, 0.0, 0.0, 0.0);
    },
    /** Update sculpting operation */
    update: function (main) {
      var appTrans = this.appliedTrans_;
      var eTrans = this.editTrans_;
      var m = this.mesh_.getEditMatrix();

      var mouseX = main.mouseX_;
      var mouseY = main.mouseY_;
      var camera = main.getCamera();
      var vNear = camera.unproject(mouseX, mouseY, 0.0);
      var vFar = camera.unproject(mouseX, mouseY, 0.1);

      vec3.transformMat4(vNear, vNear, this.matrixInv_);
      vec3.transformMat4(vFar, vFar, this.matrixInv_);

      if (this.isNegative_ !== this.negative_) {
        appTrans[0] = m[12];
        appTrans[1] = m[13];
        appTrans[2] = m[14];
      }

      if (this.negative_) {
        var zoom = mouseX - this.refMX_ + mouseY - this.refMY_;
        vec3.scale(eTrans, this.normal_, -zoom * 0.5);
        this.isNegative_ = true;
      } else {
        Geometry.intersectLinePlane(vNear, vFar, this.origin_, this.normal_, eTrans);
        vec3.sub(eTrans, eTrans, this.origin_);
        if (this.isNegative_)
          vec3.sub(appTrans, appTrans, eTrans);
        this.isNegative_ = false;
        this.refMX_ = mouseX;
        this.refMY_ = mouseY;
      }

      m[12] = eTrans[0] + appTrans[0];
      m[13] = eTrans[1] + appTrans[1];
      m[14] = eTrans[2] + appTrans[2];
      main.render();
    }
  };

  Utils.makeProxy(SculptBase, Translate);

  return Translate;
});