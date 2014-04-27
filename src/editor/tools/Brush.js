define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase',
  'editor/tools/Flatten'
], function (Utils, Tablet, SculptBase, Flatten) {

  'use strict';

  function Brush(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.clay_ = true; //clay sculpting (modifier for brush tool)
    this.culling_ = false; //if we backface cull the vertices
  }

  Brush.prototype = {
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
      this.brush(iVertsInRadius, aNormal, picking.interPoint_, picking.rLocalSqr_, intensity);
      if (this.clay_) {
        var aCenter = this.areaCenter(iVertsFront);
        Flatten.prototype.flatten.call(this, iVertsInRadius, aNormal, aCenter, picking.interPoint_, picking.rLocalSqr_, intensity);
      }

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Brush stroke, move vertices along a direction computed by their averaging normals */
    brush: function (iVertsInRadius, aNormal, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var deformIntensityBrush = intensity * radius * 0.1;
      if (this.negative_)
        deformIntensityBrush = -deformIntensityBrush;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deformIntensityBrush;
        vAr[ind] += anx * fallOff;
        vAr[ind + 1] += any * fallOff;
        vAr[ind + 2] += anz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Brush);

  return Brush;
});