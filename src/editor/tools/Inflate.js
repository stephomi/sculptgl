define([
  'misc/Tablet',
  'editor/tools/SculptUtils',
  'states/StateGeometry'
], function (Tablet, SculptUtils, StateGeometry) {

  'use strict';

  function Inflate(states) {
    this.states_ = states; //for undo-redo
    this.multimesh_ = null; //the current edited mesh
    this.intensity_ = 0.3; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Inflate.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      var multimesh = sculptgl.multimesh_;
      picking.intersectionMouseMesh(multimesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.multimesh_ === null)
        return;
      this.states_.pushState(new StateGeometry(multimesh));
      this.multimesh_ = multimesh;
      this.update(sculptgl);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      SculptUtils.sculptStroke(sculptgl, this.multimesh_, this.stroke.bind(this));
    },
    /** On stroke */
    stroke: function (picking) {
      var mesh = this.multimesh_.getCurrent();
      var iVertsInRadius = picking.pickedVertices_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = SculptUtils.getFrontVertices(mesh, iVertsInRadius, picking.eyeDir_);

      this.inflate(mesh, iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.multimesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Inflate a group of vertices */
    inflate: function (mesh, iVerts, center, radiusSquared, intensity) {
      var vAr = mesh.verticesXYZ_;
      var nAr = mesh.normalsXYZ_;
      var nbVerts = iVerts.length;
      var radius = Math.sqrt(radiusSquared);
      var deformIntensity = intensity * radius * 0.1;
      if (this.negative_)
        deformIntensity = -deformIntensity;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
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

  return Inflate;
});