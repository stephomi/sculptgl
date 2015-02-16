define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;

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

    var vAr = !isSketchfab ? meshes[0].getVertices() : new Float32Array(nbVertices * 3);
    var cAr = !isSketchfab ? meshes[0].getColors() : new Float32Array(nbVertices * 3);
    var fAr = !isSketchfab ? meshes[0].getFaces() : new Int32Array(nbFaces * 4);
    if (isSketchfab) {
      // multiple meshes => swap xy (sketchfab)
      var ver = [0.0, 0.0, 0.0];
      var offsetVerts = 0;
      var offsetFaces = 0;
      var offsetIndex = 0;
      for (i = 0; i < nbMeshes; ++i) {
        var mesh = meshes[i];
        var mVerts = mesh.getVertices();
        var mCols = mesh.getColors();
        var mFaces = mesh.getFaces();
        var mNbVertices = mesh.getNbVertices();
        var mNbFaces = mesh.getNbFaces();
        var matrix = mesh.getMatrix();
        for (j = 0; j < mNbVertices; ++j) {
          k = j * 3;
          ver[0] = mVerts[k];
          ver[1] = mVerts[k + 1];
          ver[2] = mVerts[k + 2];
          vec3.transformMat4(ver, ver, matrix);
          vAr[offsetVerts + k] = ver[0];
          vAr[offsetVerts + k + 1] = -ver[2];
          vAr[offsetVerts + k + 2] = ver[1];
          cAr[offsetVerts + k] = mCols[k];
          cAr[offsetVerts + k + 1] = mCols[k + 1];
          cAr[offsetVerts + k + 2] = mCols[k + 2];
        }
        offsetVerts += mNbVertices * 3;
        for (j = 0; j < mNbFaces; ++j) {
          k = j * 4;
          fAr[offsetFaces + k] = mFaces[k] + offsetIndex;
          fAr[offsetFaces + k + 1] = mFaces[k + 1] + offsetIndex;
          fAr[offsetFaces + k + 2] = mFaces[k + 2] + offsetIndex;
          fAr[offsetFaces + k + 3] = mFaces[k + 3] >= 0 ? mFaces[k + 3] + offsetIndex : -1;
        }
        offsetIndex += mNbVertices;
        offsetFaces = mNbFaces * 4;
      }
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

  return Export;
});