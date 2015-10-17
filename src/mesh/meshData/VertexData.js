define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');

  var VertexData = function (mesh) {
    this._mesh = mesh; // the mesh

    // attributes vertex ( no duplicates )
    this._verticesXYZ = null; // vertices (Float32Array)
    this._colorsRGB = null; // color vertices (Float32Array)
    // it doesn't really make sense to put the masking data here but I am too lazy to manage
    // a separate buffer (it would imply changes on : subdivision/reversion/renderBuffer/dynamicMesh)
    this._materialsPBR = null; // pbr vertex data (Float32Array) roughness/metallic/masking
    this._normalsXYZ = null; // normals (Float32Array)

    // topology stuffs
    this._vertOnEdge = null; // vertices on edge (Uint8Array) (1 => on edge)
    this._vrfStartCount = null; // array of neighborhood faces (start/count) (Uint32Array)
    this._vertRingFace = null; // array of neighborhood faces (Uint32Array)
    this._vrvStartCount = null; // array of neighborhood vertices (start/count) (Uint32Array)
    this._vertRingVert = null; // array neighborhood vertices (Uint32Array)

    // flag for general purposes stuff
    this._vertTagFlags = null; // tag flags (<= Utils.TAG_FLAG) (Int32Array)
    // flag for editing (tag vertices on each start of a sculpting session)
    this._vertSculptFlags = null; // sculpt flags (<= Utils.SCULPT_FLAG) (Int32Array)
    // flag for history (tag vertices on each start of a sculpting session)
    this._vertStateFlags = null; // state flags (<= Utils.STATE_FLAG) (Int32Array)

    this._vertProxy = null; // vertex proxy (Float32Array)
  };

  VertexData.prototype = {
    setVertices: function (vAr) {
      this._verticesXYZ = vAr;
    },
    setNormals: function (nAr) {
      this._normalsXYZ = nAr;
    },
    setColors: function (cAr) {
      this._colorsRGB = cAr;
    },
    setMaterials: function (mAr) {
      this._materialsPBR = mAr;
    },
    getVertices: function () {
      return this._verticesXYZ;
    },
    getColors: function () {
      return this._colorsRGB;
    },
    getNormals: function () {
      return this._normalsXYZ;
    },
    getMaterials: function () {
      return this._materialsPBR;
    },
    getVerticesTagFlags: function () {
      return this._vertTagFlags;
    },
    getVerticesSculptFlags: function () {
      return this._vertSculptFlags;
    },
    getVerticesStateFlags: function () {
      return this._vertStateFlags;
    },
    getVerticesRingVertStartCount: function () {
      return this._vrvStartCount;
    },
    getVerticesRingVert: function () {
      return this._vertRingVert;
    },
    getVerticesRingFaceStartCount: function () {
      return this._vrfStartCount;
    },
    getVerticesRingFace: function () {
      return this._vertRingFace;
    },
    getVerticesOnEdge: function () {
      return this._vertOnEdge;
    },
    getVerticesProxy: function () {
      return this._vertProxy;
    },
    getNbVertices: function () {
      return this._verticesXYZ.length / 3;
    },
    allocateArrays: function () {
      var nbVertices = this._mesh.getNbVertices();

      this._normalsXYZ = new Float32Array(nbVertices * 3);
      this._colorsRGB = this._colorsRGB ? this._colorsRGB : new Float32Array(nbVertices * 3);
      this._materialsPBR = this._materialsPBR ? this._materialsPBR : new Float32Array(nbVertices * 3);

      this._vertOnEdge = new Uint8Array(nbVertices);

      this._vrvStartCount = new Uint32Array(nbVertices * 2);
      this._vrfStartCount = new Uint32Array(nbVertices * 2);

      this._vertTagFlags = new Int32Array(nbVertices);
      this._vertSculptFlags = new Int32Array(nbVertices);
      this._vertStateFlags = new Int32Array(nbVertices);

      this._vertProxy = new Float32Array(nbVertices * 3);
    },
    /** ONLY FOR DYNAMIC MESH */
    reAllocateArrays: function (nbAddElements) {
      var mesh = this._mesh;
      var nbDyna = this._verticesXYZ.length / 3;
      var nbVertices = mesh.getNbVertices();
      var len = nbVertices + nbAddElements;
      if (nbDyna < len || nbDyna > len * 4) {
        this._verticesXYZ = mesh.resizeArray(this._verticesXYZ, len * 3);
        this._normalsXYZ = mesh.resizeArray(this._normalsXYZ, len * 3);
        this._colorsRGB = mesh.resizeArray(this._colorsRGB, len * 3);
        this._materialsPBR = mesh.resizeArray(this._materialsPBR, len * 3);

        this._vertOnEdge = mesh.resizeArray(this._vertOnEdge, len);

        this._vertTagFlags = mesh.resizeArray(this._vertTagFlags, len);
        this._vertSculptFlags = mesh.resizeArray(this._vertSculptFlags, len);
        this._vertStateFlags = mesh.resizeArray(this._vertStateFlags, len);

        // this._vertProxy = mesh.resizeArray(this._vertProxy, len * 3);
      }
    },
    /** Init color and material array */
    initColorsAndMaterials: function () {
      var nbVertices = this._mesh.getNbVertices();
      var i = 0;
      var len = nbVertices * 3;
      if (!this._colorsRGB || this._colorsRGB.length !== len) {
        var cAr = this._colorsRGB = new Float32Array(len);
        for (i = 0; i < len; ++i)
          cAr[i] = 1.0;
      }
      if (!this._materialsPBR || this._materialsPBR.length !== len) {
        var mAr = this._materialsPBR = new Float32Array(len);
        for (i = 0; i < len; ++i) {
          var j = i * 3;
          mAr[j] = 0.18;
          mAr[j + 1] = 0.08;
          mAr[j + 2] = 1.0;
        }
      }
    },
    /** Computes faces ring around vertices */
    initFaceRings: function () {
      var mesh = this._mesh;
      var fAr = mesh.getFaces();
      var nbVertices = mesh.getNbVertices();
      var nbFaces = mesh.getNbFaces();
      var i = 0;
      var id = 0;
      var countRing = new Uint32Array(mesh.getNbVertices());
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
      this._vertRingFace = new Uint32Array(vrf.subarray(0, nbFaces * 3 + acc));
    },
    /** Update a group of vertices' normal */
    updateVerticesNormal: function (iVerts) {
      var mesh = this._mesh;
      var vrfStartCount = this.getVerticesRingFaceStartCount();
      var vertRingFace = this.getVerticesRingFace();
      var ringFaces = vertRingFace instanceof Array ? vertRingFace : null;
      var nAr = this.getNormals();
      var faceNormals = mesh.getFaceNormals();

      var full = iVerts === undefined;
      var nbVerts = full ? mesh.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = full ? i : iVerts[i];
        var start, end;
        if (ringFaces) {
          vertRingFace = ringFaces[ind];
          start = 0;
          end = vertRingFace.length;
        } else {
          start = vrfStartCount[ind * 2];
          end = start + vrfStartCount[ind * 2 + 1];
        }
        var nx = 0.0;
        var ny = 0.0;
        var nz = 0.0;
        for (var j = start; j < end; ++j) {
          var id = vertRingFace[j] * 3;
          nx += faceNormals[id];
          ny += faceNormals[id + 1];
          nz += faceNormals[id + 2];
        }
        var len = 1.0 / (end - start);
        ind *= 3;
        nAr[ind] = nx * len;
        nAr[ind + 1] = ny * len;
        nAr[ind + 2] = nz * len;
      }
    },
    /** Computes vertex ring around vertices */
    initVertexRings: function () {
      var mesh = this._mesh;
      var vrvStartCount = this.getVerticesRingVertStartCount();
      var vertRingVert = this._vertRingVert = new Uint32Array(mesh.getNbEdges() * 2);
      var vrfStartCount = this.getVerticesRingFaceStartCount();
      var vertRingFace = this.getVerticesRingFace();
      var vertTagFlags = this.getVerticesTagFlags();
      var vertOnEdge = this.getVerticesOnEdge();
      var fAr = mesh.getFaces();
      var vrvStart = 0;
      for (var i = 0, l = mesh.getNbVertices(); i < l; ++i) {
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
      var vrvStartCount = this.getVerticesRingVertStartCount();
      var vertRingVert = this.getVerticesRingVert();
      var ringVerts = vertRingVert instanceof Array ? vertRingVert : null;
      var vertTagFlags = this.getVerticesTagFlags();
      var acc = nbVerts;
      var nbVertices = this._mesh.getNbVertices();
      var iVertsExpanded = new Uint32Array(Utils.getMemory(4 * nbVertices), 0, nbVertices);
      iVertsExpanded.set(iVerts);
      var i = 0;
      for (i = 0; i < nbVerts; ++i)
        vertTagFlags[iVertsExpanded[i]] = tagFlag;
      var iBegin = 0;
      while (nRing) {
        --nRing;
        for (i = iBegin; i < nbVerts; ++i) {
          var idVert = iVertsExpanded[i];
          var start, end;
          if (ringVerts) {
            vertRingVert = ringVerts[idVert];
            start = 0;
            end = vertRingVert.length;
          } else {
            start = vrvStartCount[idVert * 2];
            end = start + vrvStartCount[idVert * 2 + 1];
          }
          for (var j = start; j < end; ++j) {
            var id = vertRingVert[j];
            if (vertTagFlags[id] === tagFlag)
              continue;
            vertTagFlags[id] = tagFlag;
            iVertsExpanded[acc++] = id;
          }
        }
        iBegin = nbVerts;
        nbVerts = acc;
      }
      return new Uint32Array(iVertsExpanded.subarray(0, acc));
    },
    /** Return all the vertices linked to a group of faces */
    getVerticesFromFaces: function (iFaces) {
      var mesh = this._mesh;
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

  module.exports = VertexData;
});