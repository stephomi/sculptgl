define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Flatten(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Flatten.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      var iVertsFront = this.getFrontVertices(iVertsInRadius, picking.eyeDir_);
      if (this.culling_)
        iVertsInRadius = iVertsFront;

      var aNormal = this.areaNormal(iVertsFront);
      if (aNormal === null)
        return;
      var aCenter = this.areaCenter(iVertsFront);
      this.flatten(iVertsInRadius, aNormal, aCenter, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Flatten, projection of the sculpting vertex onto a plane defined by the barycenter and normals of all the sculpting vertices */
    flatten: function (iVertsInRadius, aNormal, aCenter, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var ax = aCenter[0];
      var ay = aCenter[1];
      var az = aCenter[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      var comp = this.negative_ ? -1.0 : 1.0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
        if (distToPlane * comp < 0.0)
          continue;
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= distToPlane * intensity;
        vAr[ind] -= anx * fallOff;
        vAr[ind + 1] -= any * fallOff;
        vAr[ind + 2] -= anz * fallOff;
      }
    },
  };

  Utils.makeProxy(SculptBase, Flatten);

  return Flatten;
});