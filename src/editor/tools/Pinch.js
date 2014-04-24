define([
  'misc/Tablet',
  'editor/tools/SculptUtils',
  'states/StateGeometry'
], function (Tablet, SculptUtils, StateGeometry) {

  'use strict';

  function Pinch(states) {
    this.states_ = states; //for undo-redo
    this.multimesh_ = null; //the current edited mesh
    this.intensity_ = 0.75; //deformation intensity
    this.negative_ = false; //opposition deformation
    this.culling_ = false; //if we backface cull the vertices
  }

  Pinch.prototype = {
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

      this.pinch(mesh, iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.multimesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Pinch, vertices gather around intersection point */
    pinch: function (mesh, iVertsInRadius, center, radiusSquared, intensity) {
      var vAr = mesh.verticesXYZ_;
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

  return Pinch;
});