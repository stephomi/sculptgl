define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Inflate(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.3; // deformation intensity
    this.negative_ = false; // opposition deformation
    this.culling_ = false; // if we backface cull the vertices
  }

  Inflate.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      this.updateProxy(iVertsInRadius);
      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.inflate(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Inflate a group of vertices */
    inflate: function (iVerts, center, radiusSquared, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var vProxy = mesh.getVerticesProxy();
      var nAr = mesh.getNormals();
      var radius = Math.sqrt(radiusSquared);
      var deformIntensity = intensity * radius * 0.1;
      if (this.negative_)
        deformIntensity = -deformIntensity;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vProxy[ind] - cx;
        var dy = vProxy[ind + 1] - cy;
        var dz = vProxy[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        if (dist >= 1.0)
          continue;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff = deformIntensity * fallOff;
        var nx = nAr[ind];
        var ny = nAr[ind + 1];
        var nz = nAr[ind + 2];
        fallOff /= Math.sqrt(nx * nx + ny * ny + nz * nz);
        vAr[ind] += nx * fallOff;
        vAr[ind + 1] += ny * fallOff;
        vAr[ind + 2] += nz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Inflate);

  return Inflate;
});