define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var Export = {};

  /** Export Ascii STL file */
  Export.exportAsciiSTL = function (mesh) {
    var vAr = mesh.getVertices();
    var iAr = mesh.getTriangles();
    var origFN = mesh.getFaceNormals();
    var faceNormals = new Float32Array(Utils.getMemory(origFN.length * 4), 0, origFN.length);
    Utils.normalizeArrayVec3(origFN, faceNormals);
    var data = 'solid mesh\n';
    var nbTriangles = mesh.getNbTriangles();
    for (var i = 0; i < nbTriangles; ++i) {
      var j = i * 3;
      data += ' facet normal ' + faceNormals[j] + ' ' + faceNormals[j + 1] + ' ' + faceNormals[j + 2] + '\n';
      data += '  outer loop\n';
      var iv1 = iAr[j] * 3;
      var iv2 = iAr[j + 1] * 3;
      var iv3 = iAr[j + 2] * 3;
      data += '   vertex ' + vAr[iv1] + ' ' + vAr[iv1 + 1] + ' ' + vAr[iv1 + 2] + '\n';
      data += '   vertex ' + vAr[iv2] + ' ' + vAr[iv2 + 1] + ' ' + vAr[iv2 + 2] + '\n';
      data += '   vertex ' + vAr[iv3] + ' ' + vAr[iv3 + 1] + ' ' + vAr[iv3 + 2] + '\n';
      data += '  endloop\n';
      data += ' endfacet\n';
    }
    data += 'endsolid mesh\n';
    return new Blob([data]);
  };

  /** Export binary STL file */
  Export.exportBinarySTL = function (mesh) {
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var iAr = mesh.getTriangles();

    var origFN = mesh.getFaceNormals();
    var faceNormals = new Float32Array(Utils.getMemory(origFN.length * 4), 0, origFN.length);
    Utils.normalizeArrayVec3(origFN, faceNormals);

    var nbTriangles = mesh.getNbTriangles();

    var data = new Uint8Array(84 + nbTriangles * 50);
    var nbTriBuff = new Uint8Array(new Uint32Array([nbTriangles]).buffer);
    data.set(nbTriBuff, 80);

    var verBuffer = new Uint8Array(vAr.buffer);
    var norBuffer = new Uint8Array(faceNormals.buffer);
    var offset = 84;
    var inc = 0;

    var mulc = 31 / 3;
    for (var i = 0; i < nbTriangles; ++i) {
      var k = i * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = norBuffer[k++];
      }
      k = i * 3;
      var iv1 = iAr[k] * 3;
      var iv2 = iAr[k + 1] * 3;
      var iv3 = iAr[k + 2] * 3;

      var id1 = iv1 * 4;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[id1++];
      }
      var id2 = iv2 * 4;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[id2++];
      }
      var id3 = iv3 * 4;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[id3++];
      }
      var r = Math.round((cAr[iv1] + cAr[iv2] + cAr[iv3]) * mulc) << 10;
      var g = Math.round((cAr[iv1 + 1] + cAr[iv2 + 1] + cAr[iv3 + 1]) * mulc) << 5;
      var b = Math.round((cAr[iv1 + 2] + cAr[iv2 + 2] + cAr[iv3 + 2]) * mulc);
      var col = r + g + b + 32768;
      data[offset++] = col & 255;
      data[offset++] = col >> 8;
    }
    return new Blob([data]);
  };

  return Export;
});