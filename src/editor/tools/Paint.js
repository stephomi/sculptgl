define([
  'misc/Tablet',
  'editor/tools/SculptUtils',
  'states/StateColor'
], function (Tablet, SculptUtils, StateColor) {

  'use strict';

  function Paint(states) {
    this.states_ = states; //for undo-redo
    this.multimesh_ = null; //the current edited mesh
    this.intensity_ = 0.75; //deformation intensity
    this.culling_ = false; //if we backface cull the vertices
    this.color_ = [168.0, 66.0, 66.0]; //color painting
  }

  Paint.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      var multimesh = sculptgl.multimesh_;
      picking.intersectionMouseMesh(multimesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.multimesh_ === null)
        return;
      this.states_.pushState(new StateColor(multimesh));
      this.multimesh_ = multimesh;
      this.update(sculptgl);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      SculptUtils.sculptStroke(sculptgl, this.multimesh_, this.stroke.bind(this), true);
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

      this.paint(mesh, iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, intensity);

      this.multimesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Paint color vertices */
    paint: function (mesh, iVerts, center, radiusSquared, intensity) {
      var vAr = mesh.verticesXYZ_;
      var cAr = mesh.colorsRGB_;
      var color = this.color_;
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0] / 255.0;
      var cg = color[1] / 255.0;
      var cb = color[2] / 255.0;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= intensity;
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
      }
    }
  };

  return Paint;
});