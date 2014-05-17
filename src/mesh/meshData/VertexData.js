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
    this.vrfStartCount_ = null; // array of neighborhood faces (start/count) (Uint32Array)
    this.vertRingFace_ = null; // array of neighborhood faces (Uint32Array)
    this.vrvStartCount_ = null; // array of neighborhood vertices (start/count) (Uint32Array)
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
      return this.vrvStartCount_;
    },
    getVerticesRingVert: function () {
      return this.vertRingVert_;
    },
    getVerticesRingFaceStartCount: function () {
      return this.vrfStartCount_;
    },
    getVerticesRingFace: function () {
      return this.vertRingFace_;
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

      this.normalsXYZ_ = new Float32Array(nbVertices * 3);
      this.colorsRGB_ = this.colorsRGB_ === null ? new Float32Array(nbVertices * 3) : this.colorsRGB_;

      this.vertOnEdge_ = new Uint8Array(nbVertices);

      this.vrvStartCount_ = new Uint32Array(nbVertices * 2);
      this.vrfStartCount_ = new Uint32Array(nbVertices * 2);

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
    /** Computes faces ring around vertices */
    initFaceRings: function () {
      var mesh = this.mesh_;
      var fAr = mesh.getFaces();
      var nbVertices = this.getNbVertices();
      var nbFaces = mesh.getNbFaces();
      var i = 0;
      var id = 0;
      var countRing = new Uint32Array(this.getNbVertices());
      for (i = 0; i < nbFaces; ++i) {
        id = i * 4;
        countRing[fAr[id]]++;
        countRing[fAr[id + 1]]++;
        countRing[fAr[id + 2]]++;
        var i4 = fAr[id + 3];
        if (i4 >= 0)
          countRing[i4]++;
      }
      var ringFace = this.getVerticesRingFaceStartCount();
      var acc = 0;
      for (i = 0; i < nbVertices; ++i) {
        var count = countRing[i];
        ringFace[i * 2] = acc;
        ringFace[i * 2 + 1] = count;
        acc += count;
      }
      var vrf = new Uint32Array(Utils.getMemory(4 * nbFaces * 6), 0, nbFaces * 6);
      acc = 0;
      for (i = 0; i < nbFaces; ++i) {
        id = i * 4;
        var iv1 = fAr[id];
        var iv2 = fAr[id + 1];
        var iv3 = fAr[id + 2];
        var iv4 = fAr[id + 3];
        vrf[ringFace[iv1 * 2] + (--countRing[iv1])] = i;
        vrf[ringFace[iv2 * 2] + (--countRing[iv2])] = i;
        vrf[ringFace[iv3 * 2] + (--countRing[iv3])] = i;
        if (iv4 >= 0) {
          vrf[ringFace[iv4 * 2] + (--countRing[iv4])] = i;
          ++acc;
        }
      }
      this.vertRingFace_ = new Uint32Array(vrf.subarray(0, nbFaces * 3 + acc));
    },
    /** Update a group of vertices' normal */
    updateVerticesNormal: function (iVerts) {
      var mesh = this.mesh_;
      var vrfStartCount = this.getVerticesRingFaceStartCount();
      var vertRingFace = this.getVerticesRingFace();
      var nAr = this.getNormals();
      var faceNormals = mesh.getFaceNormals();

      var full = iVerts === undefined;
      var nbFaces = full ? this.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbFaces; ++i) {
        var ind = full ? i : iVerts[i];
        var start = vrfStartCount[ind * 2];
        var end = start + vrfStartCount[ind * 2 + 1];
        var nx = 0.0;
        var ny = 0.0;
        var nz = 0.0;
        for (var j = start; j < end; ++j) {
          var id = vertRingFace[j] * 3;
          nx += faceNormals[id];
          ny += faceNormals[id + 1];
          nz += faceNormals[id + 2];
        }
        var len = 1.0 / nbFaces;
        ind *= 3;
        nAr[ind] = nx * len;
        nAr[ind + 1] = ny * len;
        nAr[ind + 2] = nz * len;
      }
    },
    /** Computes vertex ring around vertices */
    initVertexRings: function () {
      var mesh = this.mesh_;
      var vrvStartCount = this.getVerticesRingVertStartCount();
      var vertRingVert = this.vertRingVert_ = new Uint32Array(mesh.getNbEdges() * 2);
      var vrfStartCount = this.getVerticesRingFaceStartCount();
      var vertRingFace = this.getVerticesRingFace();
      var vertTagFlags = this.getVerticesTagFlags();
      var fAr = mesh.getFaces();
      var vertOnEdge = this.getVerticesOnEdge();
      var vrvStart = 0;
      for (var i = 0, l = this.getNbVertices(); i < l; ++i) {
        var tagFlag = ++Utils.TAG_FLAG;
        var vrfStart = vrfStartCount[i * 2];
        var vrfEnd = vrfStart + vrfStartCount[i * 2 + 1];
        var vrvCount = 0;
        for (var j = vrfStart; j < vrfEnd; ++j) {
          var ind = vertRingFace[j] * 4;
          var iVer1 = fAr[ind];
          var iVer2 = fAr[ind + 1];
          var iVer3 = fAr[ind + 2];
          var iVer4 = fAr[ind + 3];
          if (iVer1 === i)
            iVer1 = iVer4 >= 0 ? iVer4 : iVer3;
          else if (iVer2 === i || iVer4 === i)
            iVer2 = iVer3;
          else if (iVer3 === i && iVer4 >= 0)
            iVer1 = iVer4;
          if (vertTagFlags[iVer1] !== tagFlag) {
            vertRingVert[vrvStart + (vrvCount++)] = iVer1;
            vertTagFlags[iVer1] = tagFlag;
          }
          if (vertTagFlags[iVer2] !== tagFlag) {
            vertRingVert[vrvStart + (vrvCount++)] = iVer2;
            vertTagFlags[iVer2] = tagFlag;
          }
        }
        vrvStartCount[i * 2] = vrvStart;
        vrvStartCount[i * 2 + 1] = vrvCount;
        vrvStart += vrvCount;
        if ((vrfEnd - vrfStart) !== vrvCount)
          vertOnEdge[i] = 1;
      }
    },
    /** Get more vertices (n-ring) */
    expandsVertices: function (iVerts, nRing) {
      var tagFlag = ++Utils.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrvStartCount = this.getVerticesRingTriStartCount();
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
          var start = vrvStartCount[idVert];
          var end = start + vrvStartCount[idVert + 1];
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
    /** Return all the faces linked to a group of vertices */
    getVerticesFromFaces: function (iFaces) {
      var mesh = this.mesh_;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbFaces = iFaces.length;
      var vertTagFlags = this.getVerticesTagFlags();
      var fAr = mesh.getFaces();
      var acc = 0;
      var verts = new Uint32Array(Utils.getMemory(4 * iFaces.length * 4), 0, iFaces.length * 4);
      for (var i = 0; i < nbFaces; ++i) {
        var ind = iFaces[i] * 4;
        var iVer1 = fAr[ind];
        var iVer2 = fAr[ind + 1];
        var iVer3 = fAr[ind + 2];
        var iVer4 = fAr[ind + 3];
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
        if (iVer4 >= 0 && vertTagFlags[iVer4] !== tagFlag) {
          vertTagFlags[iVer4] = tagFlag;
          verts[acc++] = iVer4;
        }
      }
      return new Uint32Array(verts.subarray(0, acc));
    }
  };

  return VertexData;
});