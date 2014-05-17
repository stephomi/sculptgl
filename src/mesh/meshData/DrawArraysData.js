define([], function () {

  'use strict';

  function DrawArraysData(mesh) {
    this.mesh_ = mesh; // the mesh

    this.verticesXYZ_ = null; // vertices (Float32Array)
    this.normalsXYZ_ = null; // normals (Float32Array)
    this.colorsRGB_ = null; // color vertices (Float32Array)
  }

  DrawArraysData.prototype = {
    /** Updates the arrays that are going to used by webgl */
    updateDrawArrays: function (flat, iFaces) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var nAr = mesh.getNormals();
      var cAr = mesh.getColors();
      var fAr = mesh.getFaces();
      var faceNormals = mesh.getFaceNormals();
      var nbTriangles = mesh.getNbTriangles();
      var facesToTris = mesh.getFacesToTriangles();

      var full = iFaces === undefined;
      var cdv = this.verticesXYZ_;
      var cdn = this.normalsXYZ_;
      var cdc = this.colorsRGB_;

      if (full) {
        this.verticesXYZ_ = new Float32Array(nbTriangles * 9);
        cdv = this.verticesXYZ_;

        this.normalsXYZ_ = new Float32Array(nbTriangles * 9);
        cdn = this.normalsXYZ_;

        this.colorsRGB_ = new Float32Array(nbTriangles * 9);
        cdc = this.colorsRGB_;
      }

      var nbFaces = full ? mesh.getNbFaces() : iFaces.length;
      for (var i = 0; i < nbFaces; ++i) {
        var idFace = full ? i : iFaces[i];
        var idTri = idFace * 3;
        var vId = facesToTris[idFace] * 9;

        idFace *= 4;
        var id1 = fAr[idFace] * 3;
        var id2 = fAr[idFace + 1] * 3;
        var id3 = fAr[idFace + 2] * 3;
        var id4 = fAr[idFace + 3] * 3;

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
          cdn[vId] = cdn[vId + 3] = cdn[vId + 6] = faceNormals[idTri];
          cdn[vId + 1] = cdn[vId + 4] = cdn[vId + 7] = faceNormals[idTri + 1];
          cdn[vId + 2] = cdn[vId + 5] = cdn[vId + 8] = faceNormals[idTri + 2];
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
        if (id4 >= 0) {
          vId += 9;
          cdv[vId] = vAr[id1];
          cdv[vId + 1] = vAr[id1 + 1];
          cdv[vId + 2] = vAr[id1 + 2];
          cdv[vId + 3] = vAr[id3];
          cdv[vId + 4] = vAr[id3 + 1];
          cdv[vId + 5] = vAr[id3 + 2];
          cdv[vId + 6] = vAr[id4];
          cdv[vId + 7] = vAr[id4 + 1];
          cdv[vId + 8] = vAr[id4 + 2];

          cdc[vId] = cAr[id1];
          cdc[vId + 1] = cAr[id1 + 1];
          cdc[vId + 2] = cAr[id1 + 2];
          cdc[vId + 3] = cAr[id3];
          cdc[vId + 4] = cAr[id3 + 1];
          cdc[vId + 5] = cAr[id3 + 2];
          cdc[vId + 6] = cAr[id4];
          cdc[vId + 7] = cAr[id4 + 1];
          cdc[vId + 8] = cAr[id4 + 2];

          if (flat) {
            cdn[vId] = cdn[vId + 3] = cdn[vId + 6] = faceNormals[idTri];
            cdn[vId + 1] = cdn[vId + 4] = cdn[vId + 7] = faceNormals[idTri + 1];
            cdn[vId + 2] = cdn[vId + 5] = cdn[vId + 8] = faceNormals[idTri + 2];
          } else {
            cdn[vId] = nAr[id1];
            cdn[vId + 1] = nAr[id1 + 1];
            cdn[vId + 2] = nAr[id1 + 2];
            cdn[vId + 3] = nAr[id3];
            cdn[vId + 4] = nAr[id3 + 1];
            cdn[vId + 5] = nAr[id3 + 2];
            cdn[vId + 6] = nAr[id4];
            cdn[vId + 7] = nAr[id4 + 1];
            cdn[vId + 8] = nAr[id4 + 2];
          }
        }
      }
    }
  };

  return DrawArraysData;
});