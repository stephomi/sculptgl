define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  var Crease = function (states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.negative_ = true; // opposition deformation
    this.culling_ = false; // if we backface cull the vertices
    this.idAlpha_ = 0;
    this.lockPosition_ = false;
  };

  Crease.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      this.updateProxy(iVertsInRadius);
      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      var iVertsFront = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());
      if (this.culling_)
        iVertsInRadius = iVertsFront;

      picking.updateAlpha(this.lockPosition_);
      picking.setIdAlpha(this.idAlpha_);
      this.crease(iVertsInRadius, picking.getPickedNormal(), picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, picking);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch+brush-like sculpt */
    crease: function (iVertsInRadius, aNormal, center, radiusSquared, intensity, picking) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var vProxy = mesh.getVerticesProxy();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      var deformIntensity = intensity * 0.07;
      var brushFactor = deformIntensity * radius;
      if (this.negative_)
        brushFactor = -brushFactor;
      for (var i = 0, l = iVertsInRadius.length; i < l; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var dx = cx - vProxy[ind];
        var dy = cy - vProxy[ind + 1];
        var dz = cz - vProxy[ind + 2];
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        if (dist >= 1.0)
          continue;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        var brushModifier = Math.pow(fallOff, 5) * brushFactor;
        fallOff *= deformIntensity;
        vAr[ind] = vx + dx * fallOff + anx * brushModifier;
        vAr[ind + 1] = vy + dy * fallOff + any * brushModifier;
        vAr[ind + 2] = vz + dz * fallOff + anz * brushModifier;
      }
    }
  };

  Utils.makeProxy(SculptBase, Crease);

  return Crease;
});