define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function IndexData(mesh) {
    this.mesh_ = mesh; // the mesh

    this.facesABCD_ = null; // faces (Int32Array)

    this.faceEdges_ = null; // faces to edges (Int32Array)
    this.faceNormalsXYZ_ = null; // faces normals (Float32Array)
    this.faceBoxes_ = null; // faces bbox (Float32Array)
    this.faceCentersXYZ_ = null; // faces center (Float32Array)

    this.facesToTriangles_ = null; // faces to triangles (Uint32Array)
    this.UVtrianglesABC_ = null; // triangles tex coords (Uint32Array)
    this.trianglesABC_ = null; // triangles (Uint32Array)

    this.facesTagFlags_ = null; // triangles tag (<= Utils.TAG_FLAG) (Int32Array)
  }

  IndexData.prototype = {
    setFaces: function (fAr) {
      this.facesABCD_ = fAr;
    },
    getFaces: function () {
      return this.facesABCD_;
    },
    hasOnlyTriangles: function () {
      return this.mesh_.getNbTriangles() === this.mesh_.getNbFaces();
    },
    hasOnlyQuads: function () {
      return this.mesh_.getNbTriangles() === this.mesh_.getNbFaces() * 2;
    },
    getNbQuads: function () {
      return this.mesh_.getNbTriangles() - this.mesh_.getNbFaces();
    },
    getFaceNormals: function () {
      return this.faceNormalsXYZ_;
    },
    getFaceBoxes: function () {
      return this.faceBoxes_;
    },
    getFaceCenters: function () {
      return this.faceCentersXYZ_;
    },
    getFacesTagFlags: function () {
      return this.facesTagFlags_;
    },
    getFaceEdges: function () {
      return this.faceEdges_;
    },
    getFacesToTriangles: function () {
      return this.facesToTriangles_;
    },
    getNbFaces: function () {
      return this.facesABCD_.length / 4;
    },
    getTrianglesTexCoord: function () {
      return this.UVtrianglesABC_;
    },
    getTriangles: function () {
      return this.trianglesABC_;
    },
    getNbTriangles: function () {
      return this.trianglesABC_.length / 3;
    },
    allocateArrays: function () {
      var nbFaces = this.mesh_.getNbFaces();

      this.faceEdges_ = new Int32Array(nbFaces * 4);
      this.facesToTriangles_ = new Uint32Array(nbFaces);

      this.faceBoxes_ = new Float32Array(nbFaces * 6);
      this.faceNormalsXYZ_ = new Float32Array(nbFaces * 3);
      this.faceCentersXYZ_ = new Float32Array(nbFaces * 3);

      this.facesTagFlags_ = new Int32Array(nbFaces);
    },
    /** ONLY FOR DYNAMIC MESH */
    reAllocateArrays: function (nbAddElements) {
      var mesh = this.mesh_;
      var nbDyna = this.facesABCD_.length / 4;
      var nbTriangles = mesh.getNbTriangles();
      var len = nbTriangles + nbAddElements;
      if (nbDyna < len || nbDyna > len * 4) {
        this.facesABCD_ = mesh.resizeArray(this.facesABCD_, len * 4);
        this.trianglesABC_ = mesh.resizeArray(this.trianglesABC_, len * 3);
        // this.faceEdges_ = mesh.resizeArray(this.faceEdges_, len * 4); // TODO used ?
        // this.facesToTriangles_ = mesh.resizeArray(this.facesToTriangles_, len); // TODO used ?

        this.faceBoxes_ = mesh.resizeArray(this.faceBoxes_, len * 6);
        this.faceNormalsXYZ_ = mesh.resizeArray(this.faceNormalsXYZ_, len * 3);
        this.faceCentersXYZ_ = mesh.resizeArray(this.faceCentersXYZ_, len * 3);

        this.facesTagFlags_ = mesh.resizeArray(this.facesTagFlags_, len);
      }
    },
    /** Update a group of faces normal and aabb */
    updateFacesAabbAndNormal: function (iFaces) {
      var mesh = this.mesh_;
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
      var mesh = this.mesh_;
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
      var mesh = this.mesh_;
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
      var mesh = this.mesh_;
      if (mesh.hasUV())
        this.UVtrianglesABC_ = this.computeTrianglesFromFaces(mesh.getFacesTexCoord());
      this.trianglesABC_ = this.computeTrianglesFromFaces(mesh.getFaces());
    },
    /** Computes triangles from faces */
    computeTrianglesFromFaces: function (faces) {
      var nbFaces = this.mesh_.getNbFaces();
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

  return IndexData;
});