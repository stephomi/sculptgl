define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var normalizeArray = function (array) {
    for (var i = 0, l = array.length; i < l; ++i) {
      var j = i * 3;
      var nx = array[j];
      var ny = array[j + 1];
      var nz = array[j + 2];
      var len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      array[j] = nx * len;
      array[j + 1] = ny * len;
      array[j + 2] = nz * len;
    }
    return array;
  };

  var Export = {};

  /** Export OBJ file */
  Export.exportOBJ = function (mesh, useColor) {
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var fAr = mesh.getFaces();
    var data = 's 0\n';
    var nbVertices = mesh.getNbVertices();
    var nbFaces = mesh.getNbFaces();
    var i = 0;
    var j = 0;
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      if (useColor)
        data += 'v ' + vAr[j] + ' ' + vAr[j + 1] + ' ' + vAr[j + 2] + ' ' + cAr[j] + ' ' + cAr[j + 1] + ' ' + cAr[j + 2] + '\n';
      else
        data += 'v ' + vAr[j] + ' ' + vAr[j + 1] + ' ' + vAr[j + 2] + '\n';
    }
    for (i = 0; i < nbFaces; ++i) {
      j = i * 4;
      var id = fAr[j + 3];
      data += 'f ' + (1 + fAr[j]) + ' ' + (1 + fAr[j + 1]) + ' ' + (1 + fAr[j + 2]) + (id >= 0 ? ' ' + (1 + id) + '\n' : '\n');
    }
    return new Blob([data]);
  };

  /** Export STL file */
  Export.exportSTL = function (mesh) {
    return Export.exportBinarySTL(mesh);
  };

  /** Export Ascii STL file */
  Export.exportAsciiSTL = function (mesh) {
    var vAr = mesh.getVertices();
    var iAr = mesh.getTriangles();
    var faceNormals = normalizeArray(new Float32Array(mesh.getFaceNormals()));
    normalizeArray(mesh.getFaceNormals(), faceNormals);
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
    var iAr = mesh.getTriangles();
    var faceNormals = normalizeArray(new Float32Array(mesh.getFaceNormals()));
    var nbTriangles = mesh.getNbTriangles();

    var data = new Uint8Array(84 + nbTriangles * 50);
    var nbTriBuff = new Uint8Array(new Uint32Array([nbTriangles]).buffer);
    data.set(nbTriBuff, 80);

    var verBuffer = new Uint8Array(vAr.buffer);
    var norBuffer = new Uint8Array(faceNormals.buffer);
    var offset = 84;
    var inc = 0;
    for (var i = 0; i < nbTriangles; ++i) {
      var k = i * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = norBuffer[k++];
      }
      k = i * 3;
      var iv1 = iAr[k] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv1++];
      }
      var iv2 = iAr[k + 1] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv2++];
      }
      var iv3 = iAr[k + 2] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv3++];
      }
      offset += 2;
    }
    return new Blob([data]);
  };

  /** Export PLY file */
  Export.exportPLY = function (mesh) {
    return Export.exportBinaryPLY(mesh);
  };

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
  Export.exportBinaryPLY = function (mesh) {
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var fAr = mesh.getFaces();
    var nbVertices = mesh.getNbVertices();
    var nbQuads = mesh.getNbQuads();
    var nbTriangles = mesh.getNbTriangles();
    var nbFaces = mesh.getNbFaces();
    var endian = Utils.littleEndian ? 'little' : 'big';
    var header = 'ply\nformat binary_' + endian + '_endian 1.0\ncomment created by SculptGL\n';
    header += 'element vertex ' + nbVertices + '\n';
    header += 'property float x\nproperty float y\nproperty float z\n';
    header += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    header += 'element face ' + nbFaces + '\n';
    header += 'property list uchar uint vertex_indices\nend_header\n';

    var i = 0;
    var j = 0;
    var k = 0;
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

  /** Export PLY file to Sketchfab */
  Export.exportSketchfab = function (mesh, key) {
    var fd = new FormData();

    fd.append('token', key);
    fd.append('fileModel', Export.exportOBJ(mesh, true));
    fd.append('filenameModel', 'model.obj');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.sketchfab.com/v1/models');

    var result = function () {
      var res = JSON.parse(xhr.responseText);
      console.log(res);
      if (!res.success)
        window.alert('Sketchfab upload error :\n' + res.error);
      else
        window.prompt('Upload success !\nHere"s your link :', 'https://sketchfab.com/models/' + res.result.id);
    };
    xhr.addEventListener('load', result, true);
    xhr.send(fd);
  };

  return Export;
});