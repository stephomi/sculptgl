define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase',
  'editor/tools/Paint'
], function (Utils, Tablet, SculptBase, Paint) {

  'use strict';

  function Masking(states) {
    SculptBase.call(this, states);
    this.intensity_ = 1.0; // deformation intensity
    this.negative_ = true; // opposition deformation
    this.culling_ = false; // if we backface cull the vertices
  }

  Masking.prototype = {
    pushState: function () {
      // too lazy to add a pushStateMaterial
      this.states_.pushStateColorAndMaterial(this.mesh_);
    },
    updateMeshBuffers: function () {
      if (this.mesh_.getDynamicTopology)
        this.mesh_.updateBuffers();
      else
        this.mesh_.updateMaterialBuffer();
    },
    stroke: function (picking) {
      Paint.prototype.stroke.call(this, picking);
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var maskIntensity = this.negative_ ? -intensity : intensity;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= maskIntensity;
        mAr[ind + 2] = Math.min(Math.max(mAr[ind + 2] + fallOff, 0.0), 1.0);
      }
    }
  };

  Utils.makeProxy(SculptBase, Masking);

  return Masking;
});