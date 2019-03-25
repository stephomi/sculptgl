import Utils from 'misc/Utils';
import Remesh from 'editing/Remesh';

var Export = {};

var getResult = function (meshes) {
  return Remesh.mergeArrays(meshes, { vertices: null, colors: null, faces: null });
};

/** Export Ascii PLY file */
Export.exportAsciiPLY = function (meshes) {
  var res = getResult(meshes);
  var nbVertices = res.nbVertices;
  var nbFaces = res.nbFaces;
  var vAr = res.vertices;
  var cAr = res.colors;
  var fAr = res.faces;

  var i = 0;
  var j = 0;
  var data = 'ply\nformat ascii 1.0\ncomment created by SculptGL\n';
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
    var isQuad = id !== Utils.TRI_INDEX;
    data += (isQuad ? '4 ' : '3 ') + fAr[j] + ' ' + fAr[j + 1] + ' ' + fAr[j + 2] + (isQuad ? ' ' + id + '\n' : '\n');
  }
  return new Blob([data]);
};

/** Export binary PLY file */
Export.exportBinaryPLY = function (meshes, opt) {
  var res = getResult(meshes);
  var nbVertices = res.nbVertices;
  var nbFaces = res.nbFaces;
  var nbQuads = res.nbQuads;
  var nbTriangles = res.nbTriangles;
  var vAr = res.vertices;
  var cAr = res.colors;
  var fAr = res.faces;

  var i = 0;
  var j = 0;
  var k = 0;

  if (opt && opt.swapXY) {
    for (i = 0; i < nbVertices; ++i) {
      k = i * 3;
      var yVal = vAr[k + 1];
      vAr[k + 1] = -vAr[k + 2];
      vAr[k + 2] = yVal;
    }
  }

  var endian = Utils.littleEndian ? 'little' : 'big';
  var header = 'ply\nformat binary_' + endian + '_endian 1.0\ncomment created by SculptGL\n';
  header += 'element vertex ' + nbVertices + '\n';
  header += 'property float x\nproperty float y\nproperty float z\n';
  header += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
  header += 'element face ' + nbFaces + '\n';
  header += 'property list uchar uint vertex_indices\nend_header\n';

  var vertSize = vAr.length * 4 + cAr.length;
  var indexSize = (nbQuads * 4 + nbTriangles * 3) * 4 + nbFaces;
  var totalSize = header.length + vertSize + indexSize * 2;
  var data = new Uint8Array(totalSize);
  var dview = new DataView(data.buffer);

  j = header.length;
  var posOc = 0;
  for (posOc = 0; posOc < j; ++posOc) {
    data[posOc] = header.charCodeAt(posOc);
  }

  for (i = 0; i < nbVertices; ++i) {
    j = i * 3;
    dview.setFloat32(posOc, vAr[j], true);
    posOc += 4;
    dview.setFloat32(posOc, vAr[j + 1], true);
    posOc += 4;
    dview.setFloat32(posOc, vAr[j + 2], true);
    posOc += 4;

    dview.setUint8(posOc, Math.round(255.0 * cAr[j]));
    posOc += 1;
    dview.setUint8(posOc, Math.round(255.0 * cAr[j + 1]));
    posOc += 1;
    dview.setUint8(posOc, Math.round(255.0 * cAr[j + 2]));
    posOc += 1;
  }

  for (i = 0; i < nbFaces; ++i) {
    j = i * 4;
    var isQuad = fAr[j + 3] !== Utils.TRI_INDEX;

    dview.setUint8(posOc, isQuad ? 4 : 3);
    posOc += 1;

    dview.setUint32(posOc, fAr[j], true);
    posOc += 4;
    dview.setUint32(posOc, fAr[j + 1], true);
    posOc += 4;
    dview.setUint32(posOc, fAr[j + 2], true);
    posOc += 4;
    if (isQuad) {
      dview.setUint32(posOc, fAr[j + 3], true);
      posOc += 4;
    }
  }

  return new Blob([data]);
};

export default Export;
