define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Remesh = require('editing/Remesh');

  var Export = {};

  /** Export Ascii PLY file */
  Export.exportAsciiPLY = function (mesh) {
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var fAr = mesh.getFaces();
    var data = 'ply\nformat ascii 1.0\ncomment created by SculptGL\n';
    var nbVertices = mesh.getNbVertices();
    var nbFaces = mesh.getNbFaces();
    var i = 0;
    var j = 0;
    data += 'element vertex ' + nbVertices + '\n';
    data += 'property float x\nproperty float y\nproperty float z\n';
    data += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    data += 'element face ' + nbFaces + '\n';
    data += 'property list uchar uint vertex_indices\nend_header\n';
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      data += vAr[j] + ' ' +
        vAr[j + 1] + ' ' +
        vAr[j + 2] + ' ' +
        ((cAr[j] * 0xff) | 0) + ' ' +
        ((cAr[j + 1] * 0xff) | 0) + ' ' +
        ((cAr[j + 2] * 0xff) | 0) + '\n';
    }
    for (i = 0; i < nbFaces; ++i) {
      j = i * 4;
      var id = fAr[j + 3];
      data += (id >= 0 ? '4 ' : '3 ') + fAr[j] + ' ' + fAr[j + 1] + ' ' + fAr[j + 2] + (id >= 0 ? ' ' + id + '\n' : '\n');
    }
    return new Blob([data]);
  };

  /** Export binary PLY file */
  Export.exportBinaryPLY = function (meshOrMeshes, isSketchfab) {
    var meshes = meshOrMeshes.length ? meshOrMeshes : [meshOrMeshes];
    var nbMeshes = meshes.length;
    var i = 0;
    var j = 0;
    var k = 0;

    var nbVertices = 0;
    var nbFaces = 0;
    var nbQuads = 0;
    var nbTriangles = 0;
    for (i = 0; i < nbMeshes; ++i) {
      nbVertices += meshes[i].getNbVertices();
      nbFaces += meshes[i].getNbFaces();
      nbQuads += meshes[i].getNbQuads();
      nbTriangles += meshes[i].getNbTriangles();
    }

    var vAr, cAr, fAr;
    if (isSketchfab) {
      var arr = {
        vertices: null,
        colors: null,
        faces: null
      };
      Remesh.mergeArrays(meshes, arr);
      vAr = arr.vertices;
      // sketchfab linear vertex color space
      cAr = Utils.convertArrayVec3toLinear(arr.colors);
      fAr = arr.faces;
      // swap xy
      for (i = 0; i < nbVertices; ++i) {
        k = i * 3;
        var yVal = vAr[k + 1];
        vAr[k + 1] = -vAr[k + 2];
        vAr[k + 2] = yVal;
      }
    } else {
      vAr = meshes[0].getVertices();
      cAr = meshes[0].getColors();
      fAr = meshes[0].getFaces();
    }

    var endian = Utils.littleEndian ? 'little' : 'big';
    var header = 'ply\nformat binary_' + endian + '_endian 1.0\ncomment created by SculptGL\n';
    header += 'element vertex ' + nbVertices + '\n';
    header += 'property float x\nproperty float y\nproperty float z\n';
    header += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    header += 'element face ' + nbFaces + '\n';
    header += 'property list uchar uint vertex_indices\nend_header\n';

    var inc = 0;

    var headerSize = header.length;
    var vertSize = vAr.length * 4 + cAr.length;
    var indexSize = (nbQuads * 4 + nbTriangles * 3) * 4 + nbFaces;
    var totalSize = headerSize + vertSize + indexSize;
    var data = new Uint8Array(totalSize);

    j = header.length;
    for (k = 0; k < j; ++k) {
      data[k] = header.charCodeAt(k);
    }

    var verBuffer = new Uint8Array(vAr.buffer);
    var offset = headerSize;
    for (i = 0; i < nbVertices; ++i) {
      j = i * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[k++] = verBuffer[j++];
      }
      j = i * 3;
      data[k++] = (cAr[j] * 0xff) | 0;
      data[k++] = (cAr[j + 1] * 0xff) | 0;
      data[k++] = (cAr[j + 2] * 0xff) | 0;
    }

    var bufIndex = new Uint8Array(fAr.buffer);
    offset += vertSize;
    for (i = 0; i < nbFaces; ++i) {
      j = i * 16;
      var isQuad = fAr[i * 4 + 3] >= 0;
      var nbFacebytes = isQuad ? 16 : 12;
      data[k++] = isQuad ? 4 : 3;
      for (inc = 0; inc < nbFacebytes; ++inc) {
        data[k++] = bufIndex[j++];
      }
    }
    return new Blob([data]);
  };

  module.exports = Export;
});