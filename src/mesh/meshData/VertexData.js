define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function VertexData(mesh) {
    this.mesh_ = mesh; // the mesh

    this.verticesXYZ_ = null; // vertices (Float32Array)
    this.colorsRGB_ = null; // color vertices (Float32Array)
    this.normalsXYZ_ = null; // normals (Float32Array)

    this.vertOnEdge_ = null; // vertices on edge (Uint8Array) (1 => on edge)
    this.vrtStartCount_ = null; // array of neighborhood triangles (start/count) (Uint32Array)
    this.vertRingTri_ = null; // array of neighborhood triangles (Uint32Array)
    this.vrrStartCount_ = null; // array of neighborhood vertices (start/count) (Uint32Array)
    this.vertRingVert_ = null; // array neighborhood vertices (Uint32Array)

    this.vertTagFlags_ = null; // tag flags (<= Utils.TAG_FLAG) (Uint32Array)
    // flag for editing
    this.vertSculptFlags_ = null; // sculpt flags (<= Utils.SCULPT_FLAG) (Uint32Array)
    // flag for history
    this.vertStateFlags_ = null; // state flags (<= Utils.STATE_FLAG) (Uint32Array)

    this.vertProxy_ = null; // vertex proxy (Float32Array)
  }

  VertexData.prototype = {
    setVertices: function (vAr) {
      this.verticesXYZ_ = vAr;
    },
    setNormals: function (nAr) {
      this.normalsXYZ_ = nAr;
    },
    setColors: function (cAr) {
      this.colorsRGB_ = cAr;
    },
    getVertices: function () {
      return this.verticesXYZ_;
    },
    getColors: function () {
      return this.colorsRGB_;
    },
    getNormals: function () {
      return this.normalsXYZ_;
    },
    getVerticesTagFlags: function () {
      return this.vertTagFlags_;
    },
    getVerticesSculptFlags: function () {
      return this.vertSculptFlags_;
    },
    getVerticesStateFlags: function () {
      return this.vertStateFlags_;
    },
    getVerticesRingVertStartCount: function () {
      return this.vrrStartCount_;
    },
    getVerticesRingVert: function () {
      return this.vertRingVert_;
    },
    getVerticesRingTriStartCount: function () {
      return this.vrtStartCount_;
    },
    getVerticesRingTri: function () {
      return this.vertRingTri_;
    },
    getVerticesOnEdge: function () {
      return this.vertOnEdge_;
    },
    getVerticesProxy: function () {
      return this.vertProxy_;
    },
    getNbVertices: function () {
      return this.verticesXYZ_.length / 3;
    },
    allocateArrays: function () {
      var nbVertices = this.getNbVertices();
      var nbTriangles = this.mesh_.getNbTriangles();

      this.normalsXYZ_ = new Float32Array(nbVertices * 3);
      this.colorsRGB_ = this.colorsRGB_ === null ? new Float32Array(nbVertices * 3) : this.colorsRGB_;

      this.vertOnEdge_ = new Uint8Array(nbVertices);

      this.vrrStartCount_ = new Uint32Array(nbVertices * 2);
      this.vrtStartCount_ = new Uint32Array(nbVertices * 2);
      this.vertRingTri_ = new Uint32Array(nbTriangles * 3);

      this.vertTagFlags_ = new Uint32Array(nbVertices);
      this.vertSculptFlags_ = new Uint32Array(nbVertices);
      this.vertStateFlags_ = new Uint32Array(nbVertices);

      this.vertProxy_ = new Float32Array(nbVertices * 3);
    },
    /** Init color array */
    initColors: function () {
      var len = this.getNbVertices() * 3;
      if (this.colorsRGB_ && this.colorsRGB_.length === len)
        return;
      var cAr = this.colorsRGB_ = new Float32Array(len);
      for (var i = 0; i < len; ++i)
        cAr[i] = 1.0;
    },
    /** Computes triangles ring around vertices */
    initTriangleRings: function () {
      var mesh = this.mesh_;
      var iAr = mesh.getIndices();
      var nbVertices = this.getNbVertices();
      var nbTriangles = mesh.getNbTriangles();
      var i = 0;
      var id = 0;
      var countRing = new Uint32Array(this.getNbVertices());
      for (i = 0; i < nbTriangles; ++i) {
        id = i * 3;
        ++countRing[iAr[id]];
        ++countRing[iAr[id + 1]];
        ++countRing[iAr[id + 2]];
      }
      var ringTri = this.getVerticesRingTriStartCount();
      var acc = 0;
      for (i = 0; i < nbVertices; ++i) {
        var count = countRing[i];
        ringTri[i * 2] = acc;
        ringTri[i * 2 + 1] = count;
        acc += count;
      }
      var vertRingTri = this.getVerticesRingTri();
      for (i = 0; i < nbTriangles; ++i) {
        id = i * 3;
        var iv1 = iAr[id];
        var iv2 = iAr[id + 1];
        var iv3 = iAr[id + 2];
        vertRingTri[ringTri[iv1 * 2] + (--countRing[iv1])] = i;
        vertRingTri[ringTri[iv2 * 2] + (--countRing[iv2])] = i;
        vertRingTri[ringTri[iv3 * 2] + (--countRing[iv3])] = i;
      }
    },
    /** Update a group of vertices' normal */
    updateVerticesNormal: function (iVerts) {
      var mesh = this.mesh_;
      var vrtStartCount = this.getVerticesRingTriStartCount();
      var vertRingTri = this.getVerticesRingTri();
      var nAr = this.getNormals();
      var triNormals = mesh.getTriNormals();

      var full = iVerts === undefined;
      var nbTris = full ? this.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbTris; ++i) {
        var ind = full ? i : iVerts[i];
        var start = vrtStartCount[ind * 2];
        var end = start + vrtStartCount[ind * 2 + 1];
        var nx = 0.0;
        var ny = 0.0;
        var nz = 0.0;
        for (var j = start; j < end; ++j) {
          var id = vertRingTri[j] * 3;
          nx += triNormals[id];
          ny += triNormals[id + 1];
          nz += triNormals[id + 2];
        }
        var len = 1.0 / nbTris;
        ind *= 3;
        nAr[ind] = nx * len;
        nAr[ind + 1] = ny * len;
        nAr[ind + 2] = nz * len;
      }
    },
    /** Computes vertex ring around vertices */
    initVertexRings: function () {
      var mesh = this.mesh_;
      var vrrStartCount = this.getVerticesRingVertStartCount();
      var vertRingVert = this.vertRingVert_ = new Uint32Array(mesh.getNbEdges() * 2);
      var vrtStartCount = this.getVerticesRingTriStartCount();
      var vertRingTri = this.getVerticesRingTri();
      var vertTagFlags = this.getVerticesTagFlags();
      var iAr = mesh.getIndices();
      var vertOnEdge = this.getVerticesOnEdge();
      var vrrStart = 0;
      for (var i = 0, l = this.getNbVertices(); i < l; ++i) {
        var tagFlag = ++Utils.TAG_FLAG;
        var vrtStart = vrtStartCount[i * 2];
        var vrtEnd = vrtStart + vrtStartCount[i * 2 + 1];
        var vrrCount = 0;
        for (var j = vrtStart; j < vrtEnd; ++j) {
          var ind = vertRingTri[j] * 3;
          var iVer1 = iAr[ind];
          var iVer2 = iAr[ind + 1];
          var iVer3 = iAr[ind + 2];
          if (iVer1 !== i && vertTagFlags[iVer1] !== tagFlag) {
            vertRingVert[vrrStart + (vrrCount++)] = iVer1;
            vertTagFlags[iVer1] = tagFlag;
          }
          if (iVer2 !== i && vertTagFlags[iVer2] !== tagFlag) {
            vertRingVert[vrrStart + (vrrCount++)] = iVer2;
            vertTagFlags[iVer2] = tagFlag;
          }
          if (iVer3 !== i && vertTagFlags[iVer3] !== tagFlag) {
            vertRingVert[vrrStart + (vrrCount++)] = iVer3;
            vertTagFlags[iVer3] = tagFlag;
          }
        }
        vrrStartCount[i * 2] = vrrStart;
        vrrStartCount[i * 2 + 1] = vrrCount;
        vrrStart += vrrCount;
        if ((vrtEnd - vrtStart) !== vrrCount)
          vertOnEdge[i] = 1;
      }
    },
    /** Get more vertices (n-ring) */
    expandsVertices: function (iVerts, nRing) {
      var tagFlag = ++Utils.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrrStartCount = this.getVerticesRingTriStartCount();
      var vertRingVert = this.getVerticesRingVert();
      var vertTagFlags = this.getVerticesTagFlags();
      var acc = nbVerts;
      var iVertsExpanded = new Uint32Array(Utils.getMemory(4 * this.getNbVertices()), 0, this.getNbVertices());
      iVertsExpanded.set(iVerts);
      var i = 0;
      for (i = 0; i < nbVerts; ++i)
        vertTagFlags[iVerts[i]] = tagFlag;
      var iBegin = 0;
      while (nRing) {
        --nRing;
        for (i = iBegin; i < nbVerts; ++i) {
          var idVert = iVerts[i] * 2;
          var start = vrrStartCount[idVert];
          var end = start + vrrStartCount[idVert + 1];
          for (var j = start; j < end; ++j) {
            var id = vertRingVert[j];
            if (vertTagFlags[id] !== tagFlag) {
              vertTagFlags[id] = tagFlag;
              iVertsExpanded[acc++] = id;
            }
          }
        }
        iBegin = nbVerts;
        nbVerts = iVerts.length;
      }
      return new Uint32Array(iVertsExpanded.subarray(0, acc));
    },
    /** Return all the triangles linked to a group of vertices */
    getVerticesFromTriangles: function (iTris) {
      var mesh = this.mesh_;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbTris = iTris.length;
      var vertTagFlags = this.getVerticesTagFlags();
      var iAr = mesh.getIndices();
      var acc = 0;
      var verts = new Uint32Array(Utils.getMemory(4 * iTris.length * 3), 0, iTris.length * 3);
      for (var i = 0; i < nbTris; ++i) {
        var ind = iTris[i] * 3;
        var iVer1 = iAr[ind];
        var iVer2 = iAr[ind + 1];
        var iVer3 = iAr[ind + 2];
        if (vertTagFlags[iVer1] !== tagFlag) {
          vertTagFlags[iVer1] = tagFlag;
          verts[acc++] = iVer1;
        }
        if (vertTagFlags[iVer2] !== tagFlag) {
          vertTagFlags[iVer2] = tagFlag;
          verts[acc++] = iVer2;
        }
        if (vertTagFlags[iVer3] !== tagFlag) {
          vertTagFlags[iVer3] = tagFlag;
          verts[acc++] = iVer3;
        }
      }
      return new Uint32Array(verts.subarray(0, acc));
    }
  };

  return VertexData;
});