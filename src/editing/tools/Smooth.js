define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Tablet = require('misc/Tablet');
  var SculptBase = require('editing/tools/SculptBase');

  var Smooth = function (main) {
    SculptBase.call(this, main);
    this._radius = 50;
    this._intensity = 0.75;
    this._culling = false;
    this._tangent = false;
    this._idAlpha = 0;
    this._lockPosition = false;
  };

  Smooth.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this._intensity * Tablet.getPressureIntensity();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);

      if (this._culling)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      picking.updateAlpha(this._lockPosition);
      picking.setIdAlpha(this._idAlpha);
      if (this._tangent) this.smoothTangent(iVertsInRadius, intensity, picking);
      else this.smooth(iVertsInRadius, intensity, picking);

      var mesh = this.getMesh();
      mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Smooth a group of vertices. New position is given by simple averaging */
    smooth: function (iVerts, intensity, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var i3 = i * 3;
        var mIntensity = intensity * mAr[ind + 2];
        if (picking)
          mIntensity *= picking.getAlpha(vx, vy, vz);
        var intComp = 1.0 - mIntensity;
        vAr[ind] = vx * intComp + smoothVerts[i3] * mIntensity;
        vAr[ind + 1] = vy * intComp + smoothVerts[i3 + 1] * mIntensity;
        vAr[ind + 2] = vz * intComp + smoothVerts[i3 + 2] * mIntensity;
      }
    },
    /** Smooth a group of vertices. Reproject the position on each vertex normals plane */
    smoothTangent: function (iVerts, intensity, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var nAr = mesh.getNormals();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var nx = nAr[ind];
        var ny = nAr[ind + 1];
        var nz = nAr[ind + 2];
        var len = nx * nx + ny * ny + nz * nz;
        if (len === 0.0)
          continue;
        len = 1.0 / Math.sqrt(len);
        nx *= len;
        ny *= len;
        nz *= len;
        var i3 = i * 3;
        var smx = smoothVerts[i3];
        var smy = smoothVerts[i3 + 1];
        var smz = smoothVerts[i3 + 2];
        var dot = nx * (smx - vx) + ny * (smy - vy) + nz * (smz - vz);
        var mIntensity = intensity * mAr[ind + 2];
        if (picking)
          mIntensity *= picking.getAlpha(vx, vy, vz);
        vAr[ind] = vx + (smx - nx * dot - vx) * mIntensity;
        vAr[ind + 1] = vy + (smy - ny * dot - vy) * mIntensity;
        vAr[ind + 2] = vz + (smz - nz * dot - vz) * mIntensity;
      }
    },
    /** Smooth a group of vertices along their normals */
    smoothAlongNormals: function (iVerts, intensity, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var nAr = mesh.getNormals();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var nx = nAr[ind];
        var ny = nAr[ind + 1];
        var nz = nAr[ind + 2];
        var i3 = i * 3;
        var len = 1.0 / ((nx * nx + ny * ny + nz * nz));
        var dot = nx * (smoothVerts[i3] - vx) + ny * (smoothVerts[i3 + 1] - vy) + nz * (smoothVerts[i3 + 2] - vz);
        dot *= len * intensity * mAr[ind + 2];
        if (picking)
          dot *= picking.getAlpha(vx, vy, vz);
        vAr[ind] = vx + nx * dot;
        vAr[ind + 1] = vy + ny * dot;
        vAr[ind + 2] = vz + nz * dot;
      }
    },
  };

  Utils.makeProxy(SculptBase, Smooth);

  module.exports = Smooth;
});