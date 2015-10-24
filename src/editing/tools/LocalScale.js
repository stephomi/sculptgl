define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var SculptBase = require('editing/tools/SculptBase');

  var LocalScale = function (main) {
    SculptBase.call(this, main);
    this._radius = 50;
    this._culling = false;
    this._idAlpha = 0;
  };

  LocalScale.prototype = {
    /** Start a sculpt sculpt stroke */
    startSculpt: function () {
      var main = this._main;
      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        pickingSym.intersectionMouseMesh();
        pickingSym.setLocalRadius2(main.getPicking().getLocalRadius2());
      }
    },
    /** Make a brush scale stroke */
    sculptStroke: function () {
      var main = this._main;
      var delta = main._mouseX - main._lastMouseX;
      var picking = main.getPicking();
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, delta);

      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        if (pickingSym.getMesh()) {
          pickingSym.pickVerticesInSphere(rLocal2);
          this.stroke(pickingSym, delta);
        }
      }
      this.updateRender();
    },
    /** On stroke */
    stroke: function (picking, delta) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this._culling)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      picking.updateAlpha(false);
      picking.setIdAlpha(this._idAlpha);
      this.scale(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), delta, picking);

      var mesh = this.getMesh();
      mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Scale the vertices around the mouse point intersection */
    scale: function (iVerts, center, radiusSquared, intensity, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var deltaScale = intensity * 0.01;
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deltaScale * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        vAr[ind] = vx + dx * fallOff;
        vAr[ind + 1] = vy + dy * fallOff;
        vAr[ind + 2] = vz + dz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, LocalScale);

  module.exports = LocalScale;
});