define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');

  var TexCoordsData = function (mesh) {
    this._mesh = mesh; // the mesh

    this._texCoordsST = null; // tex coords (Float32Array)
    this._duplicateStartCount = null; // array of vertex duplicates location (start/count) (Uint32Array)
    this._UVfacesABCD = null; // faces unwrap (Int32Array)

    // attributes vertex (duplicated for rendering because of tex coords)
    this._UVverticesXYZ = null; // vertices + duplicates (Float32Array)
    this._UVcolorsRGB = null; // color vertices + duplicates (Float32Array)
    this._UVmaterialsPBR = null; // materials vertices + duplicates (Float32Array)
    this._UVnormalsXYZ = null; // normals + duplicates (Float32Array)
  };

  TexCoordsData.prototype = {
    hasUV: function () {
      return this._texCoordsST !== null;
    },
    setTexCoords: function (tAr) {
      this._texCoordsST = tAr;
    },
    setVerticesDuplicateStartCount: function (startCount) {
      this._duplicateStartCount = startCount;
    },
    setFacesTexCoord: function (fuAr) {
      this._UVfacesABCD = fuAr;
    },
    getVerticesTexCoord: function () {
      return this._UVverticesXYZ;
    },
    getColorsTexCoord: function () {
      return this._UVcolorsRGB;
    },
    getMaterialsTexCoord: function () {
      return this._UVmaterialsPBR;
    },
    getNormalsTexCoord: function () {
      return this._UVnormalsXYZ;
    },
    getTexCoords: function () {
      return this._texCoordsST;
    },
    getVerticesDuplicateStartCount: function () {
      return this._duplicateStartCount;
    },
    getFacesTexCoord: function () {
      return this._UVfacesABCD;
    },
    getNbTexCoords: function () {
      return this._texCoordsST ? this._texCoordsST.length / 2 : 0;
    },
    allocateArrays: function () {
      if (!this.hasUV())
        return;

      var mesh = this._mesh;
      var nbTexCoords = this._texCoordsST.length / 2;
      var nbVertices = mesh.getNbVertices();

      var verts = this._UVverticesXYZ = new Float32Array(nbTexCoords * 3);
      verts.set(mesh.getVertices());
      mesh.setVertices(verts.subarray(0, nbVertices * 3));

      var normals = this._UVnormalsXYZ = new Float32Array(nbTexCoords * 3);
      normals.set(mesh.getNormals());
      mesh.setNormals(normals.subarray(0, nbVertices * 3));

      var colors = this._UVcolorsRGB = new Float32Array(nbTexCoords * 3);
      colors.set(mesh.getColors());
      mesh.setColors(colors.subarray(0, nbVertices * 3));

      var materials = this._UVmaterialsPBR = new Float32Array(nbTexCoords * 3);
      materials.set(mesh.getMaterials());
      mesh.setMaterials(materials.subarray(0, nbVertices * 3));
    },
    updateDuplicateGeometry: function (iVerts) {
      var mesh = this._mesh;
      if (!mesh.isUsingTexCoords() || !this.hasUV())
        return;

      var vAr = this.getVerticesTexCoord();
      var cAr = this.getColorsTexCoord();
      var mAr = this.getMaterialsTexCoord();
      var nAr = this.getNormalsTexCoord();
      var startCount = this.getVerticesDuplicateStartCount();

      var full = iVerts === undefined;
      var nbVerts = full ? mesh.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = full ? i : iVerts[i];
        var start = startCount[ind * 2];
        if (start === 0)
          continue;
        var end = start + startCount[ind * 2 + 1];
        var idOrig = ind * 3;
        var vx = vAr[idOrig];
        var vy = vAr[idOrig + 1];
        var vz = vAr[idOrig + 2];
        var nx = nAr[idOrig];
        var ny = nAr[idOrig + 1];
        var nz = nAr[idOrig + 2];
        var cx = cAr[idOrig];
        var cy = cAr[idOrig + 1];
        var cz = cAr[idOrig + 2];
        var mx = mAr[idOrig];
        var my = mAr[idOrig + 1];
        var mz = mAr[idOrig + 2];
        for (var j = start; j < end; ++j) {
          var idDup = j * 3;
          vAr[idDup] = vx;
          vAr[idDup + 1] = vy;
          vAr[idDup + 2] = vz;
          nAr[idDup] = nx;
          nAr[idDup + 1] = ny;
          nAr[idDup + 2] = nz;
          cAr[idDup] = cx;
          cAr[idDup + 1] = cy;
          cAr[idDup + 2] = cz;
          mAr[idDup] = mx;
          mAr[idDup + 1] = my;
          mAr[idDup + 2] = mz;
        }
      }
    },
    updateDuplicateColorsAndMaterials: function (iVerts) {
      var mesh = this._mesh;
      if (!mesh.isUsingTexCoords() || !this.hasUV())
        return;

      var cAr = this.getColorsTexCoord();
      var mAr = this.getMaterialsTexCoord();
      var startCount = this.getVerticesDuplicateStartCount();

      var full = iVerts === undefined;
      var nbVerts = full ? mesh.getNbVertices() : iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = full ? i : iVerts[i];
        var start = startCount[ind * 2];
        if (start === 0)
          continue;
        var end = start + startCount[ind * 2 + 1];
        var idOrig = ind * 3;
        var cx = cAr[idOrig];
        var cy = cAr[idOrig + 1];
        var cz = cAr[idOrig + 2];
        var mx = mAr[idOrig];
        var my = mAr[idOrig + 1];
        var mz = mAr[idOrig + 2];
        for (var j = start; j < end; ++j) {
          var idDup = j * 3;
          cAr[idDup] = cx;
          cAr[idDup + 1] = cy;
          cAr[idDup + 2] = cz;
          mAr[idDup] = mx;
          mAr[idDup + 1] = my;
          mAr[idDup + 2] = mz;
        }
      }
    },
    initTexCoordsDataFromOBJData: function (uvAr, uvfArOrig) {
      var mesh = this._mesh;
      var fAr = mesh.getFaces();
      var nbVertices = mesh.getNbVertices();
      var i = 0;
      var j = 0;
      var iv = 0;
      var tag = 0;

      // detect duplicates vertices because of tex coords
      var tagV = new Int32Array(nbVertices);
      // vertex without uv might receive random values...
      var tArTemp = new Float32Array(Utils.getMemory(nbVertices * 4 * 2), 0, nbVertices * 2);
      var dup = [];
      var acc = 0;
      var nbDuplicates = 0;
      var len = fAr.length;
      for (i = 0; i < len; ++i) {
        iv = fAr[i];
        if (iv < 0)
          continue;
        var uv = uvfArOrig[i];
        tag = tagV[iv];
        if (tag === (uv + 1))
          continue;
        if (tag === 0) {
          tagV[iv] = uv + 1;
          tArTemp[iv * 2] = uvAr[uv * 2];
          tArTemp[iv * 2 + 1] = uvAr[uv * 2 + 1];
          continue;
        }
        // first duplicate
        if (tag > 0) {
          tagV[iv] = --acc;
          dup.push([uv]);
          ++nbDuplicates;
          continue;
        }
        // check if we need to insert a new duplicate
        var dupArray = dup[-tag - 1];
        var nbDup = dupArray.length;
        for (j = 0; j < nbDup; ++j) {
          if (dupArray[j] === uv)
            break;
        }
        // insert new duplicate
        if (j === nbDup) {
          ++nbDuplicates;
          dupArray.push(uv);
        }
      }

      // order the duplicates vertices (and tex coords)
      var tAr = new Float32Array((nbVertices + nbDuplicates) * 2);
      tAr.set(tArTemp);
      var startCount = this._duplicateStartCount = new Uint32Array(nbVertices * 2);
      acc = 0;
      for (i = 0; i < nbVertices; ++i) {
        tag = tagV[i];
        if (tag >= 0)
          continue;
        var dAr = dup[-tag - 1];
        var nbDu = dAr.length;
        var start = nbVertices + acc;
        startCount[i * 2] = start;
        startCount[i * 2 + 1] = nbDu;
        acc += nbDu;
        for (j = 0; j < nbDu; ++j) {
          var idUv = dAr[j] * 2;
          var idUvCoord = (start + j) * 2;
          tAr[idUvCoord] = uvAr[idUv];
          tAr[idUvCoord + 1] = uvAr[idUv + 1];
        }
      }

      // create faces that uses duplicates vertices (with textures coordinates)
      var uvfAr = new Int32Array(fAr);
      len = fAr.length;
      for (i = 0; i < len; ++i) {
        iv = uvfAr[i];
        if (iv < 0)
          continue;
        tag = tagV[iv];
        if (tag > 0)
          continue;
        var idtex = uvfArOrig[i];
        var dArray = dup[-tag - 1];
        var nbEl = dArray.length;
        for (j = 0; j < nbEl; ++j) {
          if (idtex === dArray[j]) {
            uvfAr[i] = startCount[iv * 2] + j;
            break;
          }
        }
      }

      this.setTexCoords(tAr);
      this.setFacesTexCoord(uvfAr);
    }
  };

  module.exports = TexCoordsData;
});