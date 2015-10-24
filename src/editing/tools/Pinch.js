define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Tablet = require('misc/Tablet');
  var SculptBase = require('editing/tools/SculptBase');

  var Pinch = function (main) {
    SculptBase.call(this, main);
    this._radius = 50;
    this._intensity = 0.75;
    this._negative = false;
    this._culling = false;
    this._idAlpha = 0;
    this._lockPosition = false;
  };

  Pinch.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this._intensity * Tablet.getPressureIntensity();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this._culling)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      picking.updateAlpha(this._lockPosition);
      picking.setIdAlpha(this._idAlpha);
      this.pinch(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, picking);

      var mesh = this.getMesh();
      mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch, vertices gather around intersection point */
    pinch: function (iVertsInRadius, center, radiusSquared, intensity, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var deformIntensity = intensity * 0.05;
      if (this._negative)
        deformIntensity = -deformIntensity;
      for (var i = 0, l = iVertsInRadius.length; i < l; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = cx - vx;
        var dy = cy - vy;
        var dz = cz - vz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deformIntensity * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        vAr[ind] = vx + dx * fallOff;
        vAr[ind + 1] = vy + dy * fallOff;
        vAr[ind + 2] = vz + dz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Pinch);

  module.exports = Pinch;
});