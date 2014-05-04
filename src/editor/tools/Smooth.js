define([
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (Utils, Tablet, SculptBase) {

  'use strict';

  function Smooth(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.tangent_ = false; // tangent smoothing
  }

  Smooth.prototype = {
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      if (this.tangent_)
        this.smoothTangent(iVertsInRadius, intensity);
      else
        this.smooth(iVertsInRadius, intensity);

      this.mesh_.updateMesh(this.mesh_.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Smooth a group of vertices. New position is given by simple averaging */
    smooth: function (iVerts, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
      var intComp = 1.0 - intensity;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var i3 = i * 3;
        vAr[ind] = vAr[ind] * intComp + smoothVerts[i3] * intensity;
        vAr[ind + 1] = vAr[ind + 1] * intComp + smoothVerts[i3 + 1] * intensity;
        vAr[ind + 2] = vAr[ind + 2] * intComp + smoothVerts[i3 + 2] * intensity;
      }
    },
    /** Smooth a group of vertices. Reproject the position on each vertex normals plane */
    smoothTangent: function (iVerts, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
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
        var len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx *= len;
        ny *= len;
        nz *= len;
        var i3 = i * 3;
        var smx = smoothVerts[i3];
        var smy = smoothVerts[i3 + 1];
        var smz = smoothVerts[i3 + 2];
        var dot = nx * (smx - vx) + ny * (smy - vy) + nz * (smz - vz);
        vAr[ind] = vx + (smx - nx * dot - vx) * intensity;
        vAr[ind + 1] = vy + (smy - ny * dot - vy) * intensity;
        vAr[ind + 2] = vz + (smz - nz * dot - vz) * intensity;
      }
    },
    /** Smooth a group of vertices along their normals */
    smoothAlongNormals: function (iVerts, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
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
        dot *= len * intensity;
        vAr[ind] = vx + nx * dot;
        vAr[ind + 1] = vy + ny * dot;
        vAr[ind + 2] = vz + nz * dot;
      }
    },
    /** Laplacian smooth. Special rule for vertex on the edge of the mesh. */
    laplacianSmooth: function (iVerts, smoothVerts) {
      var mesh = this.mesh_;
      var vrrStartCount = mesh.getVerticesRingVertStartCount();
      var vertRingVert = mesh.getVerticesRingVert();
      var vertOnEdge = mesh.getVerticesOnEdge();
      var vAr = mesh.getVertices();
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var i3 = i * 3;
        var id = iVerts[i];
        var start = vrrStartCount[id * 2];
        var count = vrrStartCount[id * 2 + 1];
        var avx = 0.0;
        var avy = 0.0;
        var avz = 0.0;
        var j = 0;
        var ind = 0;
        if (vertOnEdge[id] === 1) {
          var nbVertEdge = 0;
          for (j = 0; j < count; ++j) {
            ind = vertRingVert[start + j];
            // we average only with vertices that are also on the edge
            if (vertOnEdge[ind] === 1) {
              ind *= 3;
              avx += vAr[ind];
              avy += vAr[ind + 1];
              avz += vAr[ind + 2];
              ++nbVertEdge;
            }
          }
          count = nbVertEdge;
        } else {
          for (j = 0; j < count; ++j) {
            ind = vertRingVert[start + j] * 3;
            avx += vAr[ind];
            avy += vAr[ind + 1];
            avz += vAr[ind + 2];
          }
        }
        smoothVerts[i3] = avx / count;
        smoothVerts[i3 + 1] = avy / count;
        smoothVerts[i3 + 2] = avz / count;
      }
    }
  };

  Utils.makeProxy(SculptBase, Smooth);

  return Smooth;
});