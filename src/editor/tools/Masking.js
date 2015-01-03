define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase',
  'editor/tools/Paint'
], function (Utils, Tablet, SculptBase, Paint) {

  'use strict';

  function Masking(states) {
    SculptBase.call(this, states);
    this.hardness_ = 0.25;
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
    paint: function (iVerts, center, radiusSquared, intensity, hardness) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var softness = 2 * (1 - hardness);
      var maskIntensity = this.negative_ ? -intensity : intensity;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = Math.pow(1 - dist, softness);
        fallOff *= maskIntensity;
        mAr[ind + 2] = Math.min(Math.max(mAr[ind + 2] + fallOff, 0.0), 1.0);
      }
    },
    updateAndRenderMask: function (main) {
      this.mesh_.updateDuplicateColorsAndMaterials();
      this.mesh_.updateFlatShading();
      this.updateRender(main);
    },
    getMaskedVertices: function () {
      var nbVertices = this.mesh_.getNbVertices();
      var cleaned = new Uint32Array(Utils.getMemory(4 * nbVertices), 0, nbVertices);
      var mAr = this.mesh_.getMaterials();
      var acc = 0;
      for (var i = 0; i < nbVertices; ++i) {
        if (mAr[i * 3 + 2] !== 1.0)
          cleaned[acc++] = i;
      }
      if (acc === 0) return;
      return new Uint32Array(cleaned.subarray(0, acc));
    },
    blur: function (mesh, main) {
      this.mesh_ = mesh;
      var iVerts = this.getMaskedVertices();
      if (!iVerts) return;
      iVerts = mesh.expandsVertices(iVerts, 1);

      this.pushState();
      this.states_.pushVertices(iVerts);

      var mAr = mesh.getMaterials();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts, mAr);
      for (var i = 0; i < nbVerts; ++i)
        mAr[iVerts[i] * 3 + 2] = smoothVerts[i * 3 + 2];
      this.updateAndRenderMask(main);
    },
    sharpen: function (mesh, main) {
      this.mesh_ = mesh;
      var iVerts = this.getMaskedVertices();
      if (!iVerts) return;

      this.pushState();
      this.states_.pushVertices(iVerts);

      var mAr = mesh.getMaterials();
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var idm = iVerts[i] * 3 + 2;
        var val = mAr[idm];
        mAr[idm] = val > 0.5 ? Math.min(val + 0.1, 1.0) : Math.max(val - 1.0, 0.0);
      }
      this.updateAndRenderMask(main);
    },
    clear: function (mesh, main) {
      this.mesh_ = mesh;
      var iVerts = this.getMaskedVertices();
      if (!iVerts) return;

      this.pushState();
      this.states_.pushVertices(iVerts);

      var mAr = mesh.getMaterials();
      for (var i = 0, nb = iVerts.length; i < nb; ++i)
        mAr[iVerts[i] * 3 + 2] = 1.0;

      this.updateAndRenderMask(main);
    },
    invert: function (mesh, main, isState) {
      this.mesh_ = mesh;
      if (!isState)
        this.states_.pushStateCustom(this.invert.bind(this, mesh, main, true));

      var mAr = mesh.getMaterials();
      for (var i = 0, nb = mesh.getNbVertices(); i < nb; ++i)
        mAr[i * 3 + 2] = 1.0 - mAr[i * 3 + 2];

      this.updateAndRenderMask(main);
    }
  };

  Utils.makeProxy(SculptBase, Masking);

  return Masking;
});