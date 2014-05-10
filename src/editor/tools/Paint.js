define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Paint(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.color_ = [168.0, 66.0, 66.0]; // color painting
  }

  Paint.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      SculptBase.prototype.start.call(this, sculptgl, true);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      this.sculptStroke(sculptgl, true);
    },
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateFlatShading(this.mesh_.getTrianglesFromVertices(iVertsInRadius));
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var color = this.color_;
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0] / 255.0;
      var cg = color[1] / 255.0;
      var cb = color[2] / 255.0;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
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

  Utils.makeProxy(SculptBase, Paint);

  return Paint;
});