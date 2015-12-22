define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');
  var Gizmo = require('editing/Gizmo');
  var SculptBase = require('editing/tools/SculptBase');

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Transform = function (main) {
    SculptBase.call(this, main);
    this._gizmo = new Gizmo(main);
  };

  Transform.prototype = {
    isIdentity: function (m) {
      if (m[0] !== 1.0 || m[5] !== 1.0 || m[10] !== 1.0 || m[15] !== 1.0) return false;
      if (m[1] !== 0.0 || m[2] !== 0.0 || m[3] !== 0.0 || m[4] !== 0.0) return false;
      if (m[6] !== 0.0 || m[7] !== 0.0 || m[8] !== 0.0 || m[9] !== 0.0) return false;
      if (m[11] !== 0.0 || m[12] !== 0.0 || m[13] !== 0.0 || m[14] !== 0.0) return false;
      return true;
    },
    preUpdate: function () {
      var picking = this._main.getPicking();

      var mesh = picking.getMesh();
      this._gizmo.onMouseOver();
      picking._mesh = mesh;

      this._main.setCanvasCursor('default');
    },
    start: function (ctrl) {
      var main = this._main;
      var mesh = this.getMesh();
      var picking = main.getPicking();

      if (mesh && this._gizmo.onMouseDown()) {
        this.pushState();
        picking._mesh = mesh;
        return true;
      }

      if (!picking.intersectionMouseMeshes(main.getMeshes(), main._mouseX, main._mouseY))
        return false;

      if (!main.setOrUnsetMesh(picking.getMesh(), ctrl))
        return false;

      this._lastMouseX = main._mouseX;
      this._lastMouseY = main._mouseY;
      return false;
    },
    end: function () {
      this._gizmo.onMouseUp();

      var mesh = this.getMesh();
      if (!mesh)
        return;

      if (this.isIdentity(mesh.getEditMatrix()))
        return;

      var iVerts = this.getUnmaskedVertices();
      this._states.pushVertices(iVerts);

      this.applyEditMatrix(iVerts);
      if (iVerts.length === 0) return;
      this.updateMeshBuffers();
    },
    applyEditMatrix: function (iVerts) {
      var mesh = this.getMesh();
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
      vec3.transformMat4(mesh.getCenter(), mesh.getCenter(), em);
      mat4.identity(em);
      if (iVerts.length === mesh.getNbVertices()) mesh.updateGeometry();
      else mesh.updateGeometry(mesh.getFacesFromVertices(iVerts), iVerts);
    },
    update: function () {},
    postRender: function () {
      if (this.getMesh())
        this._gizmo.render();
    },
    addSculptToScene: function (scene) {
      if (this.getMesh())
        this._gizmo.addGizmoToScene(scene);
    }
  };

  Utils.makeProxy(SculptBase, Transform);

  module.exports = Transform;
});