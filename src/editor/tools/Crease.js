define([
  'misc/Tablet',
  'editor/tools/SculptUtils',
  'states/StateGeometry'
], function (Tablet, SculptUtils, StateGeometry) {

  'use strict';

  function Crease(states) {
    this.states_ = states; //for undo-redo
    this.mesh_ = null; //the current edited mesh
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Crease.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      var mesh = sculptgl.mesh_;
      picking.intersectionMouseMesh(mesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.mesh_ === null)
        return;
      this.states_.pushState(new StateGeometry(mesh));
      this.mesh_ = mesh;
      this.update(sculptgl);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      SculptUtils.sculptStroke(sculptgl, this.mesh_, this.stroke.bind(this));
    },
    /** On stroke */
    stroke: function (picking) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      var iVertsFront = SculptUtils.getFrontVertices(mesh, iVertsInRadius, picking.eyeDir_);
      if (this.culling_)
        iVertsInRadius = iVertsFront;

      var aNormal = SculptUtils.areaNormal(mesh, iVertsFront);
      if (aNormal === null)
        return;
      this.crease(mesh, iVertsInRadius, aNormal, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch+brush-like sculpt */
    crease: function (mesh, iVertsInRadius, aNormal, center, radiusSquared, intensity) {
      var vAr = mesh.getVertices();
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

  return Crease;
});