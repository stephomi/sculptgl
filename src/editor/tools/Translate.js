define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Translate = function (main) {
    SculptBase.call(this, main);
    this._origin = [0.0, 0.0, 0.0]; // plane origin
    this._normal = [0.0, 0.0, 0.0]; // plane normal
    this._matrixInv = mat4.create();
    this._negative = false;
    this._isNegative = false;
    this._refMX = 0.0;
    this._refMY = 0.0;
    this._appliedTrans = [0.0, 0.0, 0.0]; // delta to save when switching mode
    this._editTrans = [0.0, 0.0, 0.0]; // edited delta
  };

  Translate.prototype = {
    end: SculptBase.prototype.endTransform,
    applyEditMatrix: function (iVerts) {
      var mesh = this._mesh;
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
    startSculpt: function () {
      var main = this._main;
      var picking = main.getPicking();
      var camera = main.getCamera();
      var matrixInv = this._matrixInv;

      vec3.copy(this._origin, picking.getIntersectionPoint());

      var near = camera.unproject(camera._width * 0.5, camera._height * 0.5, 0.0);
      var far = camera.unproject(camera._width * 0.5, camera._height * 0.5, 0.1);
      mat4.invert(matrixInv, this._mesh.getMatrix());
      vec3.transformMat4(near, near, matrixInv);
      vec3.transformMat4(far, far, matrixInv);
      vec3.normalize(this._normal, vec3.sub(this._normal, far, near));

      this._refMX = main._mouseX;
      this._refMY = main._mouseY;
      this._isNegative = this._negative;
      vec3.set(this._appliedTrans, 0.0, 0.0, 0.0);
      vec3.set(this._editTrans, 0.0, 0.0, 0.0);
    },
    /** Update sculpting operation */
    update: function () {
      var main = this._main;
      var appTrans = this._appliedTrans;
      var eTrans = this._editTrans;
      var m = this._mesh.getEditMatrix();

      var mouseX = main._mouseX;
      var mouseY = main._mouseY;
      var camera = main.getCamera();
      var vNear = camera.unproject(mouseX, mouseY, 0.0);
      var vFar = camera.unproject(mouseX, mouseY, 0.1);

      vec3.transformMat4(vNear, vNear, this._matrixInv);
      vec3.transformMat4(vFar, vFar, this._matrixInv);

      if (this._isNegative !== this._negative) {
        appTrans[0] = m[12];
        appTrans[1] = m[13];
        appTrans[2] = m[14];
      }

      if (this._negative) {
        var zoom = mouseX - this._refMX + mouseY - this._refMY;
        vec3.scale(eTrans, this._normal, -zoom * 0.5);
        this._isNegative = true;
      } else {
        Geometry.intersectLinePlane(vNear, vFar, this._origin, this._normal, eTrans);
        vec3.sub(eTrans, eTrans, this._origin);
        if (this._isNegative)
          vec3.sub(appTrans, appTrans, eTrans);
        this._isNegative = false;
        this._refMX = mouseX;
        this._refMY = mouseY;
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