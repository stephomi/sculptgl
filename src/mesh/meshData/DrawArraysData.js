define([], function () {

  'use strict';

  function DrawArraysData(mesh) {
    this.mesh_ = mesh; // the mesh

    this.verticesXYZ_ = null; // vertices (Float32Array)
    this.normalsXYZ_ = null; // normals (Float32Array)
    this.colorsRGB_ = null; // color vertices (Float32Array)
    this.materialsPBR_ = null; // material vertices (Float32Array)
    this.texCoordsST_ = null; // texCoords (Float32Array)
  }

  DrawArraysData.prototype = {
    getVerticesDrawArrays: function () {
      if (!this.verticesXYZ_) this.updateDrawArrays(true);
      return this.verticesXYZ_;
    },
    getNormalsDrawArrays: function () {
      return this.normalsXYZ_;
    },
    getColorsDrawArrays: function () {
      return this.colorsRGB_;
    },
    getMaterialsDrawArrays: function () {
      return this.materialsPBR_;
    },
    getTexCoordsDrawArrays: function () {
      return this.texCoordsST_;
    },
    /** ONLY FOR DYNAMIC MESH */
    reAllocateArrays: function (nbAddElements) {
      var mesh = this.mesh_;
      var nbMagic = 10;
      var nbDyna = this.verticesXYZ_.length / 9;
      var nbTriangles = mesh.getNbTriangles();
      var len = nbTriangles + nbAddElements * nbMagic;
      if (nbDyna < len || nbDyna > len * 4) {
        this.verticesXYZ_ = mesh.resizeArray(this.verticesXYZ_, len * 9);
        this.normalsXYZ_ = mesh.resizeArray(this.normalsXYZ_, len * 9);
        this.colorsRGB_ = mesh.resizeArray(this.colorsRGB_, len * 9);
        this.materialsPBR_ = mesh.resizeArray(this.materialsPBR_, len * 9);
      }
    },
    /** Updates the arrays that are going to be used by webgl */
    updateDrawArrays: function (flat, iFaces) {
      var mesh = this.mesh_;

      var vAr = mesh.getVertices();
      var nAr = mesh.getNormals();
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();

      var fAr = mesh.getFaces();

      var faceNormals = mesh.getFaceNormals();
      var nbTriangles = mesh.getNbTriangles();
      var facesToTris = mesh.hasOnlyTriangles() ? null : mesh.getFacesToTriangles();

      var full = iFaces === undefined;
      var cdv = this.verticesXYZ_;
      var cdn = this.normalsXYZ_;
      var cdc = this.colorsRGB_;
      var cdm = this.materialsPBR_;

      if (!cdv || cdv.length < nbTriangles * 9) {
        cdv = this.verticesXYZ_ = new Float32Array(nbTriangles * 9);
        cdn = this.normalsXYZ_ = new Float32Array(nbTriangles * 9);
        cdc = this.colorsRGB_ = new Float32Array(nbTriangles * 9);
        cdm = this.materialsPBR_ = new Float32Array(nbTriangles * 9);
      }

      var nbFaces = full ? mesh.getNbFaces() : iFaces.length;
      for (var i = 0; i < nbFaces; ++i) {
        var idFace = full ? i : iFaces[i];
        var idTri = idFace * 3;
        var ftt = facesToTris ? facesToTris[idFace] : idFace;
        var vId = ftt * 9;

        idFace *= 4;
        var id1 = fAr[idFace] * 3;
        var id2 = fAr[idFace + 1] * 3;
        var id3 = fAr[idFace + 2] * 3;
        var id4 = fAr[idFace + 3] * 3;

        // coordinates
        cdv[vId] = vAr[id1];
        cdv[vId + 1] = vAr[id1 + 1];
        cdv[vId + 2] = vAr[id1 + 2];
        cdv[vId + 3] = vAr[id2];
        cdv[vId + 4] = vAr[id2 + 1];
        cdv[vId + 5] = vAr[id2 + 2];
        cdv[vId + 6] = vAr[id3];
        cdv[vId + 7] = vAr[id3 + 1];
        cdv[vId + 8] = vAr[id3 + 2];

        // color
        cdc[vId] = cAr[id1];
        cdc[vId + 1] = cAr[id1 + 1];
        cdc[vId + 2] = cAr[id1 + 2];
        cdc[vId + 3] = cAr[id2];
        cdc[vId + 4] = cAr[id2 + 1];
        cdc[vId + 5] = cAr[id2 + 2];
        cdc[vId + 6] = cAr[id3];
        cdc[vId + 7] = cAr[id3 + 1];
        cdc[vId + 8] = cAr[id3 + 2];

        // material
        cdm[vId] = mAr[id1];
        cdm[vId + 1] = mAr[id1 + 1];
        cdm[vId + 2] = mAr[id1 + 2];
        cdm[vId + 3] = mAr[id2];
        cdm[vId + 4] = mAr[id2 + 1];
        cdm[vId + 5] = mAr[id2 + 2];
        cdm[vId + 6] = mAr[id3];
        cdm[vId + 7] = mAr[id3 + 1];
        cdm[vId + 8] = mAr[id3 + 2];

        // normals
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

        if (id4 < 0)
          continue;

        vId += 9;
        // coordinates
        cdv[vId] = vAr[id1];
        cdv[vId + 1] = vAr[id1 + 1];
        cdv[vId + 2] = vAr[id1 + 2];
        cdv[vId + 3] = vAr[id3];
        cdv[vId + 4] = vAr[id3 + 1];
        cdv[vId + 5] = vAr[id3 + 2];
        cdv[vId + 6] = vAr[id4];
        cdv[vId + 7] = vAr[id4 + 1];
        cdv[vId + 8] = vAr[id4 + 2];

        // colors
        cdc[vId] = cAr[id1];
        cdc[vId + 1] = cAr[id1 + 1];
        cdc[vId + 2] = cAr[id1 + 2];
        cdc[vId + 3] = cAr[id3];
        cdc[vId + 4] = cAr[id3 + 1];
        cdc[vId + 5] = cAr[id3 + 2];
        cdc[vId + 6] = cAr[id4];
        cdc[vId + 7] = cAr[id4 + 1];
        cdc[vId + 8] = cAr[id4 + 2];

        // materials
        cdm[vId] = mAr[id1];
        cdm[vId + 1] = mAr[id1 + 1];
        cdm[vId + 2] = mAr[id1 + 2];
        cdm[vId + 3] = mAr[id3];
        cdm[vId + 4] = mAr[id3 + 1];
        cdm[vId + 5] = mAr[id3 + 2];
        cdm[vId + 6] = mAr[id4];
        cdm[vId + 7] = mAr[id4 + 1];
        cdm[vId + 8] = mAr[id4 + 2];

        // normals
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
      if (mesh.isUsingTexCoords())
        this.updateDrawArraysTexCoord(iFaces);
    },
    /** Updates the UV array data for drawArrays */
    updateDrawArraysTexCoord: function (iFaces) {
      var mesh = this.mesh_;
      var nbTriangles = mesh.getNbTriangles();
      var facesToTris = mesh.getFacesToTriangles();

      var full = iFaces === undefined;
      var cdt = this.texCoordsST_;
      if (!cdt || cdt.length !== nbTriangles * 6)
        cdt = this.texCoordsST_ = new Float32Array(nbTriangles * 6);

      var tAr = mesh.getTexCoords();
      var fArUV = mesh.getFacesTexCoord();

      var nbFaces = full ? mesh.getNbFaces() : iFaces.length;
      for (var i = 0; i < nbFaces; ++i) {
        var idFace = full ? i : iFaces[i];
        var ftt = facesToTris[idFace];
        var vIduv = ftt * 6;

        idFace *= 4;
        var id1uv = fArUV[idFace] * 2;
        var id2uv = fArUV[idFace + 1] * 2;
        var id3uv = fArUV[idFace + 2] * 2;
        var id4uv = fArUV[idFace + 3] * 2;

        cdt[vIduv] = tAr[id1uv];
        cdt[vIduv + 1] = tAr[id1uv + 1];
        cdt[vIduv + 2] = tAr[id2uv];
        cdt[vIduv + 3] = tAr[id2uv + 1];
        cdt[vIduv + 4] = tAr[id3uv];
        cdt[vIduv + 5] = tAr[id3uv + 1];

        if (id4uv < 0)
          continue;

        vIduv += 6;
        cdt[vIduv] = tAr[id1uv];
        cdt[vIduv + 1] = tAr[id1uv + 1];
        cdt[vIduv + 2] = tAr[id3uv];
        cdt[vIduv + 3] = tAr[id3uv + 1];
        cdt[vIduv + 4] = tAr[id4uv];
        cdt[vIduv + 5] = tAr[id4uv + 1];
      }
    }
  };

  return DrawArraysData;
});