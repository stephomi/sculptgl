define([], function () {

  'use strict';

  function DrawArraysData(mesh) {
    this.mesh_ = mesh; //the mesh
    this.verticesXYZ_ = null; //vertices (Float32Array)
    this.normalsXYZ_ = null; //normals (Float32Array)
    this.colorsRGB_ = null; //color vertices (Float32Array)
  }

  DrawArraysData.prototype = {
    /** Updates the arrays that are going to used by webgl */
    updateDrawArrays: function (flat, iTris) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var nAr = mesh.getNormals();
      var cAr = mesh.getColors();
      var iAr = mesh.getIndices();
      var triNormals = mesh.getTriNormals();
      var nbTriangles = mesh.getNbTriangles();

      var full = iTris === undefined;
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
    }
  };

  return DrawArraysData;
});