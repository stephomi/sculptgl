define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');

  var FaceData = function (mesh) {
    this._mesh = mesh; // the mesh

    this._facesABCD = null; // faces (Int32Array)

    this._faceEdges = null; // faces to edges (Int32Array)
    this._faceNormalsXYZ = null; // faces normals (Float32Array)
    this._faceBoxes = null; // faces bbox (Float32Array)
    this._faceCentersXYZ = null; // faces center (Float32Array)

    this._facesToTriangles = null; // faces to triangles (Uint32Array)
    this._UVtrianglesABC = null; // triangles tex coords (Uint32Array)
    this._trianglesABC = null; // triangles (Uint32Array)

    this._facesTagFlags = null; // triangles tag (<= Utils.TAG_FLAG) (Int32Array)
  };

  FaceData.prototype = {
    setFaces: function (fAr) {
      this._facesABCD = fAr;
    },
    getFaces: function () {
      return this._facesABCD;
    },
    hasOnlyTriangles: function () {
      return this._mesh.getNbTriangles() === this._mesh.getNbFaces();
    },
    hasOnlyQuads: function () {
      return this._mesh.getNbTriangles() === this._mesh.getNbFaces() * 2;
    },
    getNbQuads: function () {
      return this._mesh.getNbTriangles() - this._mesh.getNbFaces();
    },
    getFaceNormals: function () {
      return this._faceNormalsXYZ;
    },
    getFaceBoxes: function () {
      return this._faceBoxes;
    },
    getFaceCenters: function () {
      return this._faceCentersXYZ;
    },
    getFacesTagFlags: function () {
      return this._facesTagFlags;
    },
    getFaceEdges: function () {
      return this._faceEdges;
    },
    getFacesToTriangles: function () {
      return this._facesToTriangles;
    },
    getNbFaces: function () {
      return this._facesABCD ? this._facesABCD.length / 4 : 0;
    },
    getTrianglesTexCoord: function () {
      return this._UVtrianglesABC;
    },
    getTriangles: function () {
      return this._trianglesABC;
    },
    getNbTriangles: function () {
      return this._trianglesABC.length / 3;
    },
    allocateArrays: function () {
      var nbFaces = this._mesh.getNbFaces();

      this._faceEdges = new Int32Array(nbFaces * 4);
      this._facesToTriangles = new Uint32Array(nbFaces);

      this._faceBoxes = new Float32Array(nbFaces * 6);
      this._faceNormalsXYZ = new Float32Array(nbFaces * 3);
      this._faceCentersXYZ = new Float32Array(nbFaces * 3);

      this._facesTagFlags = new Int32Array(nbFaces);
    },
    /** ONLY FOR DYNAMIC MESH */
    reAllocateArrays: function (nbAddElements) {
      var mesh = this._mesh;
      var nbDyna = this._facesABCD.length / 4;
      var nbTriangles = mesh.getNbTriangles();
      var len = nbTriangles + nbAddElements;
      if (nbDyna < len || nbDyna > len * 4) {
        this._facesABCD = mesh.resizeArray(this._facesABCD, len * 4);
        this._trianglesABC = mesh.resizeArray(this._trianglesABC, len * 3);
        // this._faceEdges = mesh.resizeArray(this._faceEdges, len * 4); // TODO used ?
        // this._facesToTriangles = mesh.resizeArray(this._facesToTriangles, len); // TODO used ?

        this._faceBoxes = mesh.resizeArray(this._faceBoxes, len * 6);
        this._faceNormalsXYZ = mesh.resizeArray(this._faceNormalsXYZ, len * 3);
        this._faceCentersXYZ = mesh.resizeArray(this._faceCentersXYZ, len * 3);

        this._facesTagFlags = mesh.resizeArray(this._facesTagFlags, len);
      }
    },
    /** Update a group of faces normal and aabb */
    updateFacesAabbAndNormal: function (iFaces) {
      var mesh = this._mesh;
      var faceNormals = this.getFaceNormals();
      var faceBoxes = this.getFaceBoxes();
      var faceCenters = this.getFaceCenters();
      var vAr = mesh.getVertices();
      var fAr = this.getFaces();

      var full = iFaces === undefined;
      var nbFaces = full ? mesh.getNbFaces() : iFaces.length;
      for (var i = 0; i < nbFaces; ++i) {
        var ind = full ? i : iFaces[i];
        var idTri = ind * 3;
        var idFace = ind * 4;
        var idBox = ind * 6;
        var ind1 = fAr[idFace] * 3;
        var ind2 = fAr[idFace + 1] * 3;
        var ind3 = fAr[idFace + 2] * 3;
        var ind4 = fAr[idFace + 3] * 3;
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
        var crx = ay * bz - az * by;
        var cry = az * bx - ax * bz;
        var crz = ax * by - ay * bx;
        // compute boxes
        // for code readability of course
        var xmin = v1x < v2x ? v1x < v3x ? v1x : v3x : v2x < v3x ? v2x : v3x;
        var xmax = v1x > v2x ? v1x > v3x ? v1x : v3x : v2x > v3x ? v2x : v3x;
        var ymin = v1y < v2y ? v1y < v3y ? v1y : v3y : v2y < v3y ? v2y : v3y;
        var ymax = v1y > v2y ? v1y > v3y ? v1y : v3y : v2y > v3y ? v2y : v3y;
        var zmin = v1z < v2z ? v1z < v3z ? v1z : v3z : v2z < v3z ? v2z : v3z;
        var zmax = v1z > v2z ? v1z > v3z ? v1z : v3z : v2z > v3z ? v2z : v3z;
        if (ind4 >= 0) {
          var v4x = vAr[ind4];
          var v4y = vAr[ind4 + 1];
          var v4z = vAr[ind4 + 2];
          if (v4x < xmin) xmin = v4x;
          if (v4x > xmax) xmax = v4x;
          if (v4y < ymin) ymin = v4y;
          if (v4y > ymax) ymax = v4y;
          if (v4z < zmin) zmin = v4z;
          if (v4z > zmax) zmax = v4z;
          ax = v3x - v4x;
          ay = v3y - v4y;
          az = v3z - v4z;
          crx += ay * bz - az * by;
          cry += az * bx - ax * bz;
          crz += ax * by - ay * bx;
        }
        // normals
        faceNormals[idTri] = crx;
        faceNormals[idTri + 1] = cry;
        faceNormals[idTri + 2] = crz;
        // boxes
        faceBoxes[idBox] = xmin;
        faceBoxes[idBox + 1] = ymin;
        faceBoxes[idBox + 2] = zmin;
        faceBoxes[idBox + 3] = xmax;
        faceBoxes[idBox + 4] = ymax;
        faceBoxes[idBox + 5] = zmax;
        // compute centers
        faceCenters[idTri] = (xmin + xmax) * 0.5;
        faceCenters[idTri + 1] = (ymin + ymax) * 0.5;
        faceCenters[idTri + 2] = (zmin + zmax) * 0.5;
      }
    },
    /** Get more faces (n-ring) */
    expandsFaces: function (iFaces, nRing) {
      var mesh = this._mesh;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbFaces = iFaces.length;
      var vrfStartCount = mesh.getVerticesRingFaceStartCount();
      var vertRingFace = mesh.getVerticesRingFace();
      var ringFaces = vertRingFace instanceof Array ? vertRingFace : null;
      var ftf = this.getFacesTagFlags();
      var fAr = this.getFaces();
      var acc = nbFaces;
      var iFacesExpanded = new Uint32Array(Utils.getMemory(4 * mesh.getNbFaces()), 0, mesh.getNbFaces());
      iFacesExpanded.set(iFaces);
      var i = 0;
      for (i = 0; i < nbFaces; ++i)
        ftf[iFacesExpanded[i]] = tagFlag;
      var iBegin = 0;
      while (nRing) {
        --nRing;
        for (i = iBegin; i < nbFaces; ++i) {
          var ind = iFacesExpanded[i] * 4;

          for (var j = 0; j < 4; ++j) {
            var idv = fAr[ind + j];
            if (idv < 0)
              break;
            var start, end;
            if (ringFaces) {
              vertRingFace = ringFaces[idv];
              start = 0;
              end = vertRingFace.length;
            } else {
              start = vrfStartCount[idv * 2];
              end = start + vrfStartCount[idv * 2 + 1];
            }
            for (var k = start; k < end; ++k) {
              var id = vertRingFace[k];
              if (ftf[id] === tagFlag)
                continue;
              ftf[id] = tagFlag;
              iFacesExpanded[acc++] = id;
            }
          }
        }
        iBegin = nbFaces;
        nbFaces = acc;
      }
      return new Uint32Array(iFacesExpanded.subarray(0, acc));
    },
    /** Return all the faces linked to a group of vertices */
    getFacesFromVertices: function (iVerts) {
      var mesh = this._mesh;
      var tagFlag = ++Utils.TAG_FLAG;
      var nbVerts = iVerts.length;
      var vrfStartCount = mesh.getVerticesRingFaceStartCount();
      var vertRingFace = mesh.getVerticesRingFace();
      var ringFaces = vertRingFace instanceof Array ? vertRingFace : null;
      var ftf = this.getFacesTagFlags();
      var acc = 0;
      var iFaces = new Uint32Array(Utils.getMemory(4 * mesh.getNbFaces()), 0, mesh.getNbFaces());
      for (var i = 0; i < nbVerts; ++i) {
        var idVert = iVerts[i];
        var start, end;
        if (ringFaces) {
          vertRingFace = ringFaces[idVert];
          start = 0;
          end = vertRingFace.length;
        } else {
          start = vrfStartCount[idVert * 2];
          end = start + vrfStartCount[idVert * 2 + 1];
        }
        for (var j = start; j < end; ++j) {
          var iFace = vertRingFace[j];
          if (ftf[iFace] !== tagFlag) {
            ftf[iFace] = tagFlag;
            iFaces[acc++] = iFace;
          }
        }
      }
      return new Uint32Array(iFaces.subarray(0, acc));
    },
    /** Computes triangles */
    initRenderTriangles: function () {
      var mesh = this._mesh;
      if (mesh.hasUV())
        this._UVtrianglesABC = this.computeTrianglesFromFaces(mesh.getFacesTexCoord());
      this._trianglesABC = this.computeTrianglesFromFaces(mesh.getFaces());
    },
    /** Computes triangles from faces */
    computeTrianglesFromFaces: function (faces) {
      var nbFaces = this._mesh.getNbFaces();
      var facesToTris = this.getFacesToTriangles();
      var iAr = new Uint32Array(Utils.getMemory(4 * nbFaces * 6), 0, nbFaces * 6);
      var acc = 0;
      for (var i = 0; i < nbFaces; ++i) {
        facesToTris[i] = acc;
        var iFace = i * 4;
        var iv1 = faces[iFace];
        var iv2 = faces[iFace + 1];
        var iv3 = faces[iFace + 2];
        var iv4 = faces[iFace + 3];
        var iTri = acc * 3;
        iAr[iTri] = iv1;
        iAr[iTri + 1] = iv2;
        iAr[iTri + 2] = iv3;
        ++acc;
        if (iv4 >= 0) {
          iTri = acc * 3;
          iAr[iTri] = iv1;
          iAr[iTri + 1] = iv3;
          iAr[iTri + 2] = iv4;
          ++acc;
        }
      }
      return new Uint32Array(iAr.subarray(0, acc * 3));
    }
  };

  module.exports = FaceData;
});