define([
  'object/Octree',
  'misc/Utils'
], function (Octree, Utils) {

  'use strict';

  function Mesh() {
    // edges
    this.edges_ = null; //edges (Uint8Array) (1 => outer edge, 0 or 2 => inner edge)

    // triangles stuffs
    this.triEdges_ = null; //triangles to edges (Uint32Array)
    this.triNormalsXYZ_ = null; //triangle normals (Float32Array)
    this.triBoxes_ = null; //triangle bbox (Float32Array)
    this.triCentersXYZ_ = null; //triangle center (Float32Array)
    this.triPosInLeaf_ = null; //position index in the leaf (Uint32Array)
    this.triLeaf_ = []; // octree leaf
    this.indicesABC_ = null; //triangles (Uint16Array or Uint32Array)

    // vertices stuffs
    this.vertOnEdge_ = null; //vertices on edge (Uint8Array) (1 => on edge)
    this.vrtStartCount_ = null; //array of neighborhood triangles (start/count) (Uint32Array)
    this.vertRingTri_ = null; //array of neighborhood triangles (Uint32Array)
    this.vrrStartCount_ = null; //array of neighborhood vertices (start/count) (Uint32Array)
    this.vertRingVert_ = null; //array neighborhood vertices (Uint32Array)
    this.verticesXYZ_ = null; //vertices (Float32Array)
    this.colorsRGB_ = null; //color vertices (Float32Array)
    this.normalsXYZ_ = null; //normals (Float32Array)

    // flag for general purposes
    this.vertTagFlags_ = null; //tag flags (<= Mesh.TAG_FLAG) (Uint32Array)
    this.triTagFlags_ = null; //triangles tag (<= Mesh.TAG_FLAG) (Uint32Array)
    // flag for editing
    this.vertSculptFlags_ = null; //sculpt flags (<= Mesh.SCULPT_FLAG) (Uint32Array)
    // flag for history
    this.vertStateFlags_ = null; //state flags (<= Mesh.STATE_FLAG) (Uint32Array)

    // for multiresolution sculpting
    this.detailsXYZ_ = null; //details vectors (Float32Array)
    this.detailsRGB_ = null; //details vectors (Float32Array)

    // for extra rendering stuffs
    this.cacheDrawArraysV_ = null; //cache array for vertices
    this.cacheDrawArraysN_ = null; //cache array for normals
    this.cacheDrawArraysC_ = null; //cache array for colors
    this.cacheDrawArraysWireframe_ = null; //cache array for the wireframe (lines)
    this.cacheDrawElementsWireframe_ = null; //cache array for the wireframe (lines)

    this.octree_ = new Octree(); //octree
    this.leavesUpdate_ = []; //leaves of the octree to check
  }

  Mesh.TAG_FLAG = 1; //flag value for comparison (always >= tags values)
  Mesh.SCULPT_FLAG = 1; //flag value for sculpt (always >= tags values)
  Mesh.STATE_FLAG = 1; //flag value for sculpt (always >= tags values)

  Mesh.prototype = {
    /** Getters */
    setVertices: function (vAr) {
      this.verticesXYZ_ = vAr;
    },
    setIndices: function (iAr) {
      this.indicesABC_ = iAr;
    },
    setNormals: function (nAr) {
      this.normalsXYZ_ = nAr;
    },
    setColors: function (cAr) {
      this.colorsRGB_ = cAr;
    },
    setDetailsVertices: function (dAr) {
      this.detailsXYZ_ = dAr;
    },
    setDetailsColors: function (dcAr) {
      this.detailsRGB_ = dcAr;
    },
    getIndices: function () {
      return this.indicesABC_;
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
    getTriNormals: function () {
      return this.triNormalsXYZ_;
    },
    getEdges: function () {
      return this.edges_;
    },
    getCacheDrawElementsWireframe: function () {
      return this.cacheDrawElementsWireframe_;
    },
    getCacheDrawArraysWireframe: function () {
      return this.cacheDrawArraysWireframe_;
    },
    getCacheDrawArraysV: function () {
      return this.cacheDrawArraysV_;
    },
    getCacheDrawArraysN: function () {
      return this.cacheDrawArraysN_;
    },
    getCacheDrawArraysC: function () {
      return this.cacheDrawArraysC_;
    },
    getDetailsVertices: function () {
      return this.detailsXYZ_;
    },
    getDetailsColors: function () {
      return this.detailsRGB_;
    },
    getOctree: function () {
      return this.octree_;
    },
    getVerticesSculptFlags: function () {
      return this.vertSculptFlags_;
    },
    getVerticesStateFlags: function () {
      return this.vertStateFlags_;
    },
    getVertRingVertStartCount: function () {
      return this.vrrStartCount_;
    },
    getVertRingVert: function () {
      return this.vertRingVert_;
    },
    getVerticesOnEdge: function () {
      return this.vertOnEdge_;
    },
    getVertRingTriStartCount: function () {
      return this.vrtStartCount_;
    },
    getVertRingTri: function () {
      return this.vertRingTri_;
    },
    getLeavesUpdate: function () {
      return this.leavesUpdate_;
    },
    getNbTriangles: function () {
      return this.indicesABC_.length / 3;
    },
    getNbVertices: function () {
      return this.verticesXYZ_.length / 3;
    },
    getNbEdges: function () {
      return this.edges_.length;
    },
    /** Initialize stuffs for the mesh */
    init: function () {
      this.initColors();
      this.allocateArrays();
      this.initTopology();
      this.updateGeometry();
    },
    /** Init topoloy stuffs */
    initTopology: function () {
      this.initTriangleRings();
      this.initEdges();
      this.initVertexRings();
    },
    /** Updates the mesh Geometry */
    updateGeometry: function (iTris, iVerts) {
      this.updateTrianglesAabbAndNormal(iTris);
      this.updateVerticesNormal(iVerts);
      this.updateOctree(iTris);
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
    /** Return all the triangles linked to a group of vertices */
    getTrianglesFromVertices: function (iVerts) {
      var tagFlag = ++Mesh.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrtStartCount = this.vrtStartCount_;
      var vertRingTri = this.vertRingTri_;
      var triTagFlags = this.triTagFlags_;
      var acc = 0;
      var iTris = new Uint32Array(Utils.getMemory(4 * this.getNbTriangles()), 0, this.getNbTriangles());
      for (var i = 0; i < nbVerts; ++i) {
        var idVert = iVerts[i] * 2;
        var start = vrtStartCount[idVert];
        var count = vrtStartCount[idVert + 1];
        for (var j = 0; j < count; ++j) {
          var iTri = vertRingTri[start + j];
          if (triTagFlags[iTri] !== tagFlag) {
            triTagFlags[iTri] = tagFlag;
            iTris[acc++] = iTri;
          }
        }
      }
      return new Uint32Array(iTris.subarray(0, acc));
    },
    /** Return all the triangles linked to a group of vertices */
    getVerticesFromTriangles: function (iTris) {
      var tagFlag = ++Mesh.TAG_FLAG;
      var nbTris = iTris.length;
      var vertTagFlags = this.vertTagFlags_;
      var iAr = this.indicesABC_;
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
    },
    /** Get more triangles (n-ring) */
    expandsTriangles: function (iTris, nRing) {
      var tagFlag = ++Mesh.TAG_FLAG;
      var nbTris = iTris.length;
      var vrtStartCount = this.vrtStartCount_;
      var vertRingTri = this.vertRingTri_;
      var triTagFlags = this.triTagFlags_;
      var iAr = this.indicesABC_;
      var acc = nbTris;
      var iTrisExpanded = new Uint32Array(Utils.getMemory(4 * iTris.length * 3), 0, iTris.length * 3);
      iTrisExpanded.set(iTris);
      var i = 0;
      for (i = 0; i < nbTris; ++i)
        triTagFlags[iTris[i]] = tagFlag;
      var iBegin = 0;
      while (nRing) {
        --nRing;
        for (i = iBegin; i < nbTris; ++i) {
          var ind = iTris[i] * 3;
          var idv1 = iAr[ind] * 2;
          var idv2 = iAr[ind + 1] * 2;
          var idv3 = iAr[ind + 2] * 2;

          var start = vrtStartCount[idv1];
          var count = vrtStartCount[idv1 + 1];

          var j = 0;
          var id = 0;
          for (j = 0; j < count; ++j) {
            id = vertRingTri[start + j];
            if (triTagFlags[id] !== tagFlag) {
              triTagFlags[id] = tagFlag;
              iTrisExpanded[acc++] = id;
            }
          }

          start = vrtStartCount[idv2];
          count = vrtStartCount[idv2 + 1];
          for (j = 0; j < count; ++j) {
            id = vertRingTri[start + j];
            if (triTagFlags[id] !== tagFlag) {
              triTagFlags[id] = tagFlag;
              iTrisExpanded[acc++] = id;
            }
          }

          start = vrtStartCount[idv3];
          count = vrtStartCount[idv3 + 1];
          for (j = 0; j < count; ++j) {
            id = vertRingTri[start + j];
            if (triTagFlags[id] !== tagFlag) {
              triTagFlags[id] = tagFlag;
              iTrisExpanded[acc++] = id;
            }
          }
        }
        iBegin = nbTris;
        nbTris = iTris.length;
      }
      return new Uint32Array(iTrisExpanded.subarray(0, acc));
    },
    /** Get more vertices (n-ring) */
    expandsVertices: function (iVerts, nRing) {
      var tagFlag = ++Mesh.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrrStartCount = this.vrrStartCount_;
      var vertRingVert = this.vertRingVert_;
      var vertTagFlags = this.vertTagFlags_;
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
          var count = vrrStartCount[idVert + 1];
          for (var j = 0; j < count; ++j) {
            var id = vertRingVert[start + j];
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
    /** Compute Aabb */
    computeAabb: function () {
      var nbVertices = this.getNbVertices();
      var vAr = this.verticesXYZ_;
      var xmin = Infinity;
      var ymin = Infinity;
      var zmin = Infinity;
      var xmax = -Infinity;
      var ymax = -Infinity;
      var zmax = -Infinity;
      for (var i = 0; i < nbVertices; ++i) {
        var j = i * 3;
        var vx = vAr[j];
        var vy = vAr[j + 1];
        var vz = vAr[j + 2];
        if (vx < xmin) xmin = vx;
        if (vx > xmax) xmax = vx;
        if (vy < ymin) ymin = vy;
        if (vy > ymax) ymax = vy;
        if (vz < zmin) zmin = vz;
        if (vz > zmax) zmax = vz;
      }
      return [xmin, ymin, zmin, xmax, ymax, zmax];
    },
    /** Allocate arrays, except for :
     *    - vertices coords (verticesXYZ_)
     *    - indices of primitives (indicesABC_)
     *    - edges (edges_)
     *    - details vector (multires)
     *    - cache draw arrays
     */
    allocateArrays: function () {
      var nbTriangles = this.getNbTriangles();
      var nbVertices = this.getNbVertices();

      // init triangles stuffs
      this.triEdges_ = new Uint32Array(nbTriangles * 3);
      this.triBoxes_ = new Float32Array(nbTriangles * 6);
      this.triNormalsXYZ_ = new Float32Array(nbTriangles * 3);
      this.triCentersXYZ_ = new Float32Array(nbTriangles * 3);
      this.triPosInLeaf_ = new Uint32Array(nbTriangles);
      this.triLeaf_.length = nbTriangles;

      // init tags stuffs
      this.triTagFlags_ = new Uint32Array(nbTriangles);
      this.vertTagFlags_ = new Uint32Array(nbVertices);
      this.vertSculptFlags_ = new Uint32Array(nbVertices);
      this.vertStateFlags_ = new Uint32Array(nbVertices);

      // init vertices stuffs
      this.vertOnEdge_ = new Uint8Array(nbVertices);
      this.colorsRGB_ = this.colorsRGB_ === null ? new Float32Array(nbVertices * 3) : this.colorsRGB_;
      this.normalsXYZ_ = new Float32Array(nbVertices * 3);

      this.vrrStartCount_ = new Uint32Array(nbVertices * 2);
      this.vrtStartCount_ = new Uint32Array(nbVertices * 2);
      this.vertRingTri_ = new Uint32Array(nbTriangles * 3);
    },
    /** Computes the edges */
    initEdges: function () {
      var iAr = this.indicesABC_;
      var teAr = this.triEdges_;
      var nbEdges = 0;
      var vertEdgeTemp = new Uint32Array(this.getNbVertices());
      var t = 0;
      var idEdge = 0;
      var vrtStartCount = this.vrtStartCount_;
      var vertRingTri = this.vertRingTri_;
      for (var i = 0, nbVerts = this.getNbVertices(); i < nbVerts; ++i) {
        var start = vrtStartCount[i * 2];
        var count = vrtStartCount[i * 2 + 1];
        var compTest = nbEdges;
        for (var j = 0; j < count; ++j) {
          var id = vertRingTri[start + j] * 3;
          var iv1 = iAr[id];
          var iv2 = iAr[id + 1];
          var iv3 = iAr[id + 2];
          if (i > iv1) {
            t = vertEdgeTemp[iv1];
            idEdge = id + (i === iv2 ? 0 : 2);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv1] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
          if (i > iv2) {
            t = vertEdgeTemp[iv2];
            idEdge = id + (i === iv1 ? 0 : 1);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv2] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
          if (i > iv3) {
            t = vertEdgeTemp[iv3];
            idEdge = id + (i === iv1 ? 2 : 1);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv3] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
        }
      }
      var eAr = this.edges_ = new Uint8Array(nbEdges);
      for (var k = 0, nbTrisEdges = teAr.length; k < nbTrisEdges; ++k) {
        eAr[teAr[k]]++;
      }
    },
    /** Computes triangles ring around vertices */
    initTriangleRings: function () {
      var iAr = this.indicesABC_;
      var nbVertices = this.getNbVertices();
      var nbTriangles = this.getNbTriangles();
      var i = 0;
      var id = 0;
      var countRing = new Uint32Array(this.getNbVertices());
      for (i = 0; i < nbTriangles; ++i) {
        id = i * 3;
        ++countRing[iAr[id]];
        ++countRing[iAr[id + 1]];
        ++countRing[iAr[id + 2]];
      }
      var ringTri = this.vrtStartCount_;
      var acc = 0;
      for (i = 0; i < nbVertices; ++i) {
        var count = countRing[i];
        ringTri[i * 2] = acc;
        ringTri[i * 2 + 1] = count;
        acc += count;
      }
      var vertRingTri = this.vertRingTri_;
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
    /** Computes vertex ring around vertices */
    initVertexRings: function () {
      var vrrStartCount = this.vrrStartCount_;
      var vertRingVert = this.vertRingVert_ = new Uint32Array(this.getNbEdges() * 2);
      var vrtStartCount = this.vrtStartCount_;
      var vertRingTri = this.vertRingTri_;
      var vertTagFlags = this.vertTagFlags_;
      var iAr = this.indicesABC_;
      var vertOnEdge = this.vertOnEdge_;
      var vrrStart = 0;
      for (var i = 0, l = this.getNbVertices(); i < l; ++i) {
        var tagFlag = ++Mesh.TAG_FLAG;
        var vrtStart = vrtStartCount[i * 2];
        var vrtCount = vrtStartCount[i * 2 + 1];
        var vrrCount = 0;
        for (var j = 0; j < vrtCount; ++j) {
          var ind = vertRingTri[vrtStart + j] * 3;
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
        if (vrtCount !== vrrCount)
          vertOnEdge[i] = 1;
      }
    },
    /** Update a group of triangles' normal and aabb */
    updateTrianglesAabbAndNormal: function (iTris) {
      var triNormals = this.triNormalsXYZ_;
      var triBoxes = this.triBoxes_;
      var triCenters = this.triCentersXYZ_;
      var vAr = this.verticesXYZ_;
      var iAr = this.indicesABC_;

      var full = iTris === undefined;
      var nbTris = full ? this.getNbTriangles() : iTris.length;
      for (var i = 0; i < nbTris; ++i) {
        var ind = full ? i : iTris[i];
        var idTri = ind * 3;
        var idBox = ind * 6;
        var ind1 = iAr[idTri] * 3;
        var ind2 = iAr[idTri + 1] * 3;
        var ind3 = iAr[idTri + 2] * 3;
        var v1x = vAr[ind1];
        var v1y = vAr[ind1 + 1];
        var v1z = vAr[ind1 + 2];
        var v2x = vAr[ind2];
        var v2y = vAr[ind2 + 1];
        var v2z = vAr[ind2 + 2];
        var v3x = vAr[ind3];
        var v3y = vAr[ind3 + 1];
        var v3z = vAr[ind3 + 2];
        // compute normals
        var ax = v2x - v1x;
        var ay = v2y - v1y;
        var az = v2z - v1z;
        var bx = v3x - v1x;
        var by = v3y - v1y;
        var bz = v3z - v1z;
        triNormals[idTri] = ay * bz - az * by;
        triNormals[idTri + 1] = az * bx - ax * bz;
        triNormals[idTri + 2] = ax * by - ay * bx;
        // compute boxes
        // for code readability of course
        var xmin = v1x < v2x ? v1x < v3x ? v1x : v3x : v2x < v3x ? v2x : v3x;
        var xmax = v1x > v2x ? v1x > v3x ? v1x : v3x : v2x > v3x ? v2x : v3x;
        var ymin = v1y < v2y ? v1y < v3y ? v1y : v3y : v2y < v3y ? v2y : v3y;
        var ymax = v1y > v2y ? v1y > v3y ? v1y : v3y : v2y > v3y ? v2y : v3y;
        var zmin = v1z < v2z ? v1z < v3z ? v1z : v3z : v2z < v3z ? v2z : v3z;
        var zmax = v1z > v2z ? v1z > v3z ? v1z : v3z : v2z > v3z ? v2z : v3z;
        triBoxes[idBox] = xmin;
        triBoxes[idBox + 1] = ymin;
        triBoxes[idBox + 2] = zmin;
        triBoxes[idBox + 3] = xmax;
        triBoxes[idBox + 4] = ymax;
        triBoxes[idBox + 5] = zmax;
        // compute centers
        triCenters[idTri] = (xmin + xmax) * 0.5;
        triCenters[idTri + 1] = (ymin + ymax) * 0.5;
        triCenters[idTri + 2] = (zmin + zmax) * 0.5;
      }
    },
    /** Update a group of vertices' normal */
    updateVerticesNormal: function (iVerts) {
      var vrtStartCount = this.vrtStartCount_;
      var vertRingTri = this.vertRingTri_;
      var nAr = this.normalsXYZ_;
      var triNormals = this.triNormalsXYZ_;

      var full = iVerts === undefined;
      var nbTris = full ? this.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbTris; ++i) {
        var ind = full ? i : iVerts[i];
        var start = vrtStartCount[ind * 2];
        var count = vrtStartCount[ind * 2 + 1];
        var nx = 0.0;
        var ny = 0.0;
        var nz = 0.0;
        for (var j = 0; j < count; ++j) {
          var id = vertRingTri[start + j] * 3;
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
    /** Compute the mesh octree */
    computeOctree: function (abRoot, factor) {
      if (abRoot === undefined)
        abRoot = this.computeAabb();
      var xmin = abRoot[0];
      var ymin = abRoot[1];
      var zmin = abRoot[2];
      var xmax = abRoot[3];
      var ymax = abRoot[4];
      var zmax = abRoot[5];
      var dx = xmax - xmin;
      var dy = ymax - ymin;
      var dz = zmax - zmin;
      //root octree bigger than minimum aabb...
      if (factor !== undefined && factor !== 0.0) {
        var dfx = dx * factor;
        var dfy = dy * factor;
        var dfz = dz * factor;
        xmin -= dfx;
        xmax += dfx;
        ymin -= dfy;
        ymax += dfy;
        zmin -= dfz;
        zmax += dfz;
      }
      var offset = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.2;
      xmin = xmin === xmax ? xmin - offset : xmin;
      xmax = xmin === xmax ? xmax + offset : xmax;
      ymin = ymin === ymax ? ymin - offset : ymin;
      ymax = ymin === ymax ? ymin + offset : ymax;
      zmin = zmin === zmax ? zmin - offset : zmin;
      zmax = zmin === zmax ? zmin + offset : zmax;

      //octree construction
      var nbTriangles = this.getNbTriangles();
      var trianglesAll = [];
      for (var i = 0; i < nbTriangles; ++i)
        trianglesAll.push(i);
      this.octree_ = new Octree();
      this.octree_.setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax);
      this.octree_.build(this, trianglesAll);
    },
    /**
     * Update Octree
     * For each triangle we check if its position inside the octree has changed
     * if so... we mark this triangle and we remove it from its former cells
     * We push back the marked triangles into the octree
     */
    updateOctree: function (iTris) {
      if (iTris)
        this.updateOctreeAdd(this.updateOctreeRemove(iTris));
      else
        this.computeOctree(undefined, 0.3);
    },
    updateOctreeRemove: function (iTris) {
      var triCenters = this.triCentersXYZ_;
      var triBoxes = this.triBoxes_;
      var triPosInLeaf = this.triPosInLeaf_;
      var triLeaf = this.triLeaf_;
      var nbTris = iTris.length;
      var acc = 0;
      var trisToMove = new Uint32Array(Utils.getMemory(4 * nbTris), 0, nbTris);
      //recompute position inside the octree
      for (var i = 0; i < nbTris; ++i) {
        var idTri = iTris[i];
        var idBox = idTri * 6;
        var idCen = idTri * 3;
        var leaf = triLeaf[idTri];
        var split = leaf.aabbSplit_;

        var vx = triCenters[idCen];
        var vy = triCenters[idCen + 1];
        var vz = triCenters[idCen + 2];
        var hasMoved = false;
        if (vx <= split[0]) hasMoved = true;
        else if (vy <= split[1]) hasMoved = true;
        else if (vz <= split[2]) hasMoved = true;
        else if (vx > split[3]) hasMoved = true;
        else if (vy > split[4]) hasMoved = true;
        else if (vz > split[5]) hasMoved = true;

        if (hasMoved === true) {
          trisToMove[acc++] = iTris[i];
          var trisInLeaf = leaf.iTris_;
          if (trisInLeaf.length > 0) { // remove tris from octree cell
            var iTriLast = trisInLeaf[trisInLeaf.length - 1];
            var iPos = triPosInLeaf[idTri];
            trisInLeaf[iPos] = iTriLast;
            triPosInLeaf[iTriLast] = iPos;
            trisInLeaf.pop();
          }
        } else { // expands cell aabb loose if necessary
          var loose = leaf.aabbLoose_;
          var bxmin = triBoxes[idBox];
          var bymin = triBoxes[idBox + 1];
          var bzmin = triBoxes[idBox + 2];
          var bxmax = triBoxes[idBox + 3];
          var bymax = triBoxes[idBox + 4];
          var bzmax = triBoxes[idBox + 5];
          if (bxmin < loose[0]) loose[0] = bxmin;
          if (bymin < loose[1]) loose[1] = bymin;
          if (bzmin < loose[2]) loose[2] = bzmin;
          if (bxmax > loose[3]) loose[3] = bxmax;
          if (bymax > loose[4]) loose[4] = bymax;
          if (bzmax > loose[5]) loose[5] = bzmax;
        }
      }
      return new Uint32Array(trisToMove.subarray(0, acc));
    },
    updateOctreeAdd: function (trisToMove) {
      var triCenters = this.triCentersXYZ_;
      var triBoxes = this.triBoxes_;
      var triPosInLeaf = this.triPosInLeaf_;
      var triLeaf = this.triLeaf_;
      var nbTrisToMove = trisToMove.length;

      var octree = this.octree_;
      var rootLoose = octree.aabbLoose_;
      var xmin = rootLoose[0];
      var ymin = rootLoose[1];
      var zmin = rootLoose[2];
      var xmax = rootLoose[3];
      var ymax = rootLoose[4];
      var zmax = rootLoose[5];
      for (var i = 0; i < nbTrisToMove; ++i) { //add triangle to the octree
        var idTri = trisToMove[i];
        var idBox = idTri * 6;
        var idCen = idTri * 3;

        var isOutsideRoot = false;
        if (triBoxes[idBox] > xmax || triBoxes[idBox + 3] < xmin) isOutsideRoot = true;
        else if (triBoxes[idBox + 1] > ymax || triBoxes[idBox + 4] < ymin) isOutsideRoot = true;
        else if (triBoxes[idBox + 2] > zmax || triBoxes[idBox + 5] < zmin) isOutsideRoot = true;

        if (isOutsideRoot === true) { //we reconstruct the whole octree, slow... but rare
          this.computeOctree(undefined, 0.3);
          this.leavesUpdate_.length = 0;
          break;
        } else {
          var leaf = triLeaf[idTri];
          var triBox = triBoxes.subarray(idBox, idBox + 6);
          var triCenter = triCenters.subarray(idCen, idCen + 3);
          var newleaf = octree.addTriangle(idTri, triBox, triCenter);
          if (newleaf) {
            triPosInLeaf[idTri] = newleaf.iTris_.length - 1;
            triLeaf[idTri] = newleaf;
          } else { // failed to insert tri in octree, re-insert it back
            var trisLeaf = leaf.iTris_;
            triPosInLeaf[idTri] = trisLeaf.length;
            trisLeaf.push(trisToMove[i]);
          }
        }
      }
    },
    /** End of stroke, update octree (cut empty leaves or go deeper if needed) */
    checkLeavesUpdate: function () {
      Utils.tidy(this.leavesUpdate_);
      var leavesUpdate = this.leavesUpdate_;
      var nbLeaves = leavesUpdate.length;
      var cutLeaves = [];
      var octreeMaxTriangles = Octree.maxTriangles_;
      var octreeMaxDepth = Octree.maxDepth_;
      for (var i = 0; i < nbLeaves; ++i) {
        var leaf = leavesUpdate[i];
        if (leaf === null)
          break;
        if (!leaf.iTris_.length)
          leaf.checkEmptiness(cutLeaves);
        else if (leaf.iTris_.length > octreeMaxTriangles && leaf.depth_ < octreeMaxDepth)
          leaf.constructCells(this);
      }
      this.leavesUpdate_.length = 0;
    },
    /** Updates the arrays that are going to be used for webgl */
    updateCacheDrawArrays: function (flat, iTris) {
      var vAr = this.verticesXYZ_;
      var nAr = this.normalsXYZ_;
      var cAr = this.colorsRGB_;
      var iAr = this.indicesABC_;
      var triNormals = this.triNormalsXYZ_;
      var nbTriangles = this.getNbTriangles();

      var full = iTris === undefined;
      var cdv = this.cacheDrawArraysV_;
      var cdn = this.cacheDrawArraysN_;
      var cdc = this.cacheDrawArraysC_;

      if (full) {
        this.cacheDrawArraysV_ = new Float32Array(nbTriangles * 9);
        cdv = this.cacheDrawArraysV_;

        this.cacheDrawArraysN_ = new Float32Array(nbTriangles * 9);
        cdn = this.cacheDrawArraysN_;

        this.cacheDrawArraysC_ = new Float32Array(nbTriangles * 9);
        cdc = this.cacheDrawArraysC_;
      }

      var nbTris = full ? nbTriangles : iTris.length;
      for (var i = 0; i < nbTris; ++i) {
        var j = full ? i * 3 : iTris[i] * 3;
        var vId = j * 3;

        var id1 = iAr[j] * 3;
        var id2 = iAr[j + 1] * 3;
        var id3 = iAr[j + 2] * 3;

        cdv[vId] = vAr[id1];
        cdv[vId + 1] = vAr[id1 + 1];
        cdv[vId + 2] = vAr[id1 + 2];
        cdv[vId + 3] = vAr[id2];
        cdv[vId + 4] = vAr[id2 + 1];
        cdv[vId + 5] = vAr[id2 + 2];
        cdv[vId + 6] = vAr[id3];
        cdv[vId + 7] = vAr[id3 + 1];
        cdv[vId + 8] = vAr[id3 + 2];

        cdc[vId] = cAr[id1];
        cdc[vId + 1] = cAr[id1 + 1];
        cdc[vId + 2] = cAr[id1 + 2];
        cdc[vId + 3] = cAr[id2];
        cdc[vId + 4] = cAr[id2 + 1];
        cdc[vId + 5] = cAr[id2 + 2];
        cdc[vId + 6] = cAr[id3];
        cdc[vId + 7] = cAr[id3 + 1];
        cdc[vId + 8] = cAr[id3 + 2];

        if (flat) {
          cdn[vId] = cdn[vId + 3] = cdn[vId + 6] = triNormals[j];
          cdn[vId + 1] = cdn[vId + 4] = cdn[vId + 7] = triNormals[j + 1];
          cdn[vId + 2] = cdn[vId + 5] = cdn[vId + 8] = triNormals[j + 2];
        } else {
          cdn[vId] = nAr[id1];
          cdn[vId + 1] = nAr[id1 + 1];
          cdn[vId + 2] = nAr[id1 + 2];
          cdn[vId + 3] = nAr[id2];
          cdn[vId + 4] = nAr[id2 + 1];
          cdn[vId + 5] = nAr[id2 + 2];
          cdn[vId + 6] = nAr[id3];
          cdn[vId + 7] = nAr[id3 + 1];
          cdn[vId + 8] = nAr[id3 + 2];
        }
      }
    },
    /** Updates the arrays that are going to be used for webgl */
    updateCacheWireframe: function (isUsingDrawArray) {
      var nbEdges = this.getNbEdges();
      var cdw;
      if (isUsingDrawArray) {
        if (this.cacheDrawArraysWireframe_ && this.cacheDrawArraysWireframe_.length === nbEdges * 2) {
          return;
        }
        cdw = this.cacheDrawArraysWireframe_ = new Uint32Array(nbEdges * 2);
      } else {
        if (this.cacheDrawElementsWireframe_ && this.cacheDrawElementsWireframe_.length === nbEdges * 2) {
          return;
        }
        cdw = this.cacheDrawElementsWireframe_ = new Uint32Array(nbEdges * 2);
      }

      var iAr = this.indicesABC_;
      var teAr = this.triEdges_;
      var nbTriangles = this.getNbTriangles();

      var nbLines = 0;
      var tagEdges = new Int32Array(nbEdges);

      for (var i = 0; i < nbTriangles; ++i) {
        var id = i * 3;

        var iv1 = isUsingDrawArray ? id : iAr[id];
        var iv2 = isUsingDrawArray ? id + 1 : iAr[id + 1];
        var iv3 = isUsingDrawArray ? id + 2 : iAr[id + 2];

        var ide1 = teAr[id];
        var ide2 = teAr[id + 1];
        var ide3 = teAr[id + 2];

        if (tagEdges[ide1] === 0) {
          tagEdges[ide1] = 1;
          cdw[nbLines * 2] = iv1;
          cdw[nbLines * 2 + 1] = iv2;
          nbLines++;
        }
        if (tagEdges[ide2] === 0) {
          tagEdges[ide2] = 1;
          cdw[nbLines * 2] = iv2;
          cdw[nbLines * 2 + 1] = iv3;
          nbLines++;
        }
        if (tagEdges[ide3] === 0) {
          tagEdges[ide3] = 1;
          cdw[nbLines * 2] = iv3;
          cdw[nbLines * 2 + 1] = iv1;
          nbLines++;
        }
      }
    }
  };

  return Mesh;
});