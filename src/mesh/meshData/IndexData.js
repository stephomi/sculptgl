define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function IndexData(mesh) {
    this.mesh_ = mesh; //the mesh

    this.triEdges_ = null; //triangles to edges (Uint32Array)
    this.triNormalsXYZ_ = null; //triangle normals (Float32Array)
    this.triBoxes_ = null; //triangle bbox (Float32Array)
    this.triCentersXYZ_ = null; //triangle center (Float32Array)
    this.indicesABC_ = null; //triangles (Uint16Array or Uint32Array)

    this.triTagFlags_ = null; //triangles tag (<= Utils.TAG_FLAG) (Uint32Array)
  }

  IndexData.prototype = {
    setIndices: function (iAr) {
      this.indicesABC_ = iAr;
    },
    getIndices: function () {
      return this.indicesABC_;
    },
    getTriNormals: function () {
      return this.triNormalsXYZ_;
    },
    getTriBoxes: function () {
      return this.triBoxes_;
    },
    getTriCenters: function () {
      return this.triCentersXYZ_;
    },
    getTriTagFlags: function () {
      return this.triTagFlags_;
    },
    getTriEdges: function () {
      return this.triEdges_;
    },
    getNbTriangles: function () {
      return this.indicesABC_.length / 3;
    },
    allocateArrays: function () {
      var nbTriangles = this.getNbTriangles();

      this.triEdges_ = new Uint32Array(nbTriangles * 3);
      this.triBoxes_ = new Float32Array(nbTriangles * 6);
      this.triNormalsXYZ_ = new Float32Array(nbTriangles * 3);
      this.triCentersXYZ_ = new Float32Array(nbTriangles * 3);

      this.triTagFlags_ = new Uint32Array(nbTriangles);
    },
    /** Update a group of triangles' normal and aabb */
    updateTrianglesAabbAndNormal: function (iTris) {
      var mesh = this.mesh_;
      var triNormals = this.getTriNormals();
      var triBoxes = this.getTriBoxes();
      var triCenters = this.getTriCenters();
      var vAr = mesh.getVertices();
      var iAr = this.getIndices();

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
    /** Get more triangles (n-ring) */
    expandsTriangles: function (iTris, nRing) {
      var mesh = this.mesh_;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbTris = iTris.length;
      var vrtStartCount = mesh.getVerticesRingTriStartCount();
      var vertRingTri = mesh.getVerticesRingTri();
      var triTagFlags = this.getTriTagFlags();
      var iAr = this.getIndices();
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
    /** Return all the triangles linked to a group of vertices */
    getTrianglesFromVertices: function (iVerts) {
      var mesh = this.mesh_;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrtStartCount = mesh.getVerticesRingTriStartCount();
      var vertRingTri = mesh.getVerticesRingTri();
      var triTagFlags = this.getTriTagFlags();
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
    }
  };

  return IndexData;
});