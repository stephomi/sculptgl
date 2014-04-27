define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Pinch(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Pinch.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = SculptBase.getFrontVertices(iVertsInRadius, picking.eyeDir_);

      this.pinch(iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch, vertices gather around intersection point */
    pinch: function (iVertsInRadius, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var deformIntensity = intensity * 0.05;
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
        fallOff = deformIntensity * fallOff;
        vAr[ind] += dx * fallOff;
        vAr[ind + 1] += dy * fallOff;
        vAr[ind + 2] += dz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Pinch);

  return Pinch;
});