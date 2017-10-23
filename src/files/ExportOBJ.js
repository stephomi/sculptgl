import { vec3 } from 'gl-matrix';
import Utils from 'misc/Utils';

var Export = {};

/** Export OBJ file */
Export.exportOBJ = function (meshes) {
  var data = 's 0\n';
  var offsets = [1, 1];
  for (var i = 0, l = meshes.length; i < l; ++i) {
    data += 'o mesh_' + i + '\n';
    data = Export.addMesh(meshes[i], data, offsets);
  }
  return new Blob([data]);
};

var appendString = function (buffer, str, it) {
  for (var k = 0, strLen = str.length; k < strLen; k++) {
    buffer[it++] = str.charCodeAt(k);
  }
  return it;
};

Export.addMesh = function (mesh, data, offsets) {
  var zColor = true; // zbrush color
  var vColor = false; // appended color

  var vAr = mesh.getVertices();
  var cAr = mesh.getColors();
  var mAr = mesh.getMaterials();
  var fAr = mesh.getFaces();

  var nbVertices = mesh.getNbVertices();
  var nbFaces = mesh.getNbFaces();
  var nbTexCoords = mesh.getNbTexCoords();

  var matrix = mesh.getMatrix();
  var i = 0;
  var j = 0;

  var str = '';

  // chrome uses too much resources when appending many times to a very big string
  // Use of a buffer array as an intermediate storage to avoid crashes 

  var estimaton = 0;
  // 25 chars limits per float
  var cpf = 20;
  if (vColor) estimaton = nbVertices * (8 + cpf * 6);
  else estimaton = nbVertices * (5 + cpf * 3 + 8 + 6);
  estimaton += nbTexCoords * (5 + cpf * 2) + nbFaces * (6 + 15 * 4);

  var bufView = new Uint8Array(Math.max(1000, estimaton));
  var it = 0;

  ///////////
  // VERTICES
  ///////////
  var ver = [0.0, 0.0, 0.0];
  for (i = 0; i < nbVertices; ++i) {
    j = i * 3;
    ver[0] = vAr[j];
    ver[1] = vAr[j + 1];
    ver[2] = vAr[j + 2];
    vec3.transformMat4(ver, ver, matrix);

    str = 'v ' + ver[0] + ' ' + ver[1] + ' ' + ver[2];
    str += (vColor ? ' ' + cAr[j] + ' ' + cAr[j + 1] + ' ' + cAr[j + 2] + '\n' : '\n');

    it = appendString(bufView, str, it);
  }

  ////////////////
  // COLORS-zbrush
  ////////////////
  if (zColor) {
    // zbrush-like vertex color
    var nbChunck = Math.ceil(nbVertices / 64);
    for (i = 0; i < nbChunck; ++i) {
      str = '#MRGB ';
      j = i * 64;
      var nbCol = i === nbChunck - 1 ? nbVertices : j + 64;
      for (; j < nbCol; ++j) {
        str += 'ff';
        var cId = j * 3;
        var r = Math.round(cAr[cId] * 255).toString(16);
        var g = Math.round(cAr[cId + 1] * 255).toString(16);
        var b = Math.round(cAr[cId + 2] * 255).toString(16);
        str += r.length === 1 ? '0' + r : r;
        str += g.length === 1 ? '0' + g : g;
        str += b.length === 1 ? '0' + b : b;
      }
      str += '\n';

      it = appendString(bufView, str, it);
    }

    // zbrush-like vertex material
    nbChunck = Math.ceil(nbVertices / 46);
    for (i = 0; i < nbChunck; ++i) {
      str = '#MAT ';
      j = i * 46;
      var nbMat = i === nbChunck - 1 ? nbVertices : j + 46;
      for (; j < nbMat; ++j) {
        var mId = j * 3;
        var ro = Math.round(mAr[mId] * 255).toString(16);
        var m = Math.round(mAr[mId + 1] * 255).toString(16);
        var a = Math.round(mAr[mId + 2] * 255).toString(16);
        str += ro.length === 1 ? '0' + ro : ro;
        str += m.length === 1 ? '0' + m : m;
        str += a.length === 1 ? '0' + a : a;
      }
      str += '\n';

      it = appendString(bufView, str, it);
    }
  }

  /////
  // UV
  /////
  var fArUV = mesh.getFacesTexCoord();
  var uvAr = mesh.getTexCoords();
  var saveUV = mesh.hasUV();
  if (saveUV) {
    for (i = 0; i < nbTexCoords; ++i) {
      j = i * 2;
      str = 'vt ' + uvAr[j] + ' ' + uvAr[j + 1] + '\n';
      it = appendString(bufView, str, it);
    }
  }

  ////////
  // FACES
  ////////
  var offV = offsets[0];
  var offTex = offsets[1];
  offsets[0] += nbVertices;
  offsets[1] += nbTexCoords;
  for (i = 0; i < nbFaces; ++i) {
    j = i * 4;
    var id = fAr[j + 3];
    if (saveUV) {
      str = 'f ' + (offV + fAr[j]) + '/' + (offTex + fArUV[j]);
      str += ' ' + (offV + fAr[j + 1]) + '/' + (offTex + fArUV[j + 1]);
      str += ' ' + (offV + fAr[j + 2]) + '/' + (offTex + fArUV[j + 2]);
      str += (id !== Utils.TRI_INDEX ? ' ' + (offV + id) + '/' + (offTex + fArUV[j + 3]) + '\n' : '\n');
    } else {
      str = 'f ' + (offV + fAr[j]);
      str += ' ' + (offV + fAr[j + 1]);
      str += ' ' + (offV + fAr[j + 2]);
      str += (id !== Utils.TRI_INDEX ? ' ' + (offV + id) + '\n' : '\n');
    }
    it = appendString(bufView, str, it);
  }

  bufView = bufView.subarray(0, it);

  if (window.TextDecoder) {
    var de = new TextDecoder();
    return data + de.decode(bufView);
  }

  for (i = 0; i < it; ++i)
    data += String.fromCharCode(bufView[i]);

  return data;
};

export default Export;
