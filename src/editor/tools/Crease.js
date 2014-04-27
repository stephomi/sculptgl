define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Crease(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Crease.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      var iVertsFront = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());
      if (this.culling_)
        iVertsInRadius = iVertsFront;

      var aNormal = this.areaNormal(iVertsFront);
      if (aNormal === null)
        return;
      this.crease(iVertsInRadius, aNormal, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateMesh(this.mesh_.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch+brush-like sculpt */
    crease: function (iVertsInRadius, aNormal, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      var deformIntensity = intensity * 0.05;
      var brushFactor = deformIntensity * radius;
      if (this.negative_)
        brushFactor = -brushFactor;
      for (var i = 0; i < nbVerts; ++i) {
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
        var brushModifier = Math.pow(2.0 - fallOff, -5) * brushFactor;
        fallOff = fallOff * deformIntensity;
        vAr[ind] += dx * fallOff + anx * brushModifier;
        vAr[ind + 1] += dy * fallOff + any * brushModifier;
        vAr[ind + 2] += dz * fallOff + anz * brushModifier;
      }
    }
  };

  Utils.makeProxy(SculptBase, Crease);

  return Crease;
});