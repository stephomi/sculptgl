define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Pinch(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.negative_ = false; // opposition deformation
    this.culling_ = false; // if we backface cull the vertices
  }

  Pinch.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.pinch(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch, vertices gather around intersection point */
    pinch: function (iVertsInRadius, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var mAr = this.mesh_.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var deformIntensity = intensity * 0.05;
      if (this.negative_)
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
        fallOff *= deformIntensity;
        fallOff *= mAr[ind + 2];
        vAr[ind] = vx + dx * fallOff;
        vAr[ind + 1] = vy + dy * fallOff;
        vAr[ind + 2] = vz + dz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Pinch);

  return Pinch;
});