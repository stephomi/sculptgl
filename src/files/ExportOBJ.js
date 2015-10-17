define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');

  var vec3 = glm.vec3;

  var Export = {};

  /** Export OBJ file */
  Export.exportOBJ = function (meshes, saveColor) {
    var data = 's 0\n';
    var offsets = [1, 1];
    for (var i = 0, l = meshes.length; i < l; ++i) {
      data += 'o mesh_' + i + '\n';
      data = Export.addMesh(meshes[i], data, offsets, saveColor);
    }
    return new Blob([data]);
  };
  Export.addMesh = function (mesh, data, offsets, saveColor) {
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    var fAr = mesh.getFaces();
    var nbVertices = mesh.getNbVertices();
    var nbFaces = mesh.getNbFaces();
    var matrix = mesh.getMatrix();
    var i = 0;
    var j = 0;
    var ver = [0.0, 0.0, 0.0];
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      ver[0] = vAr[j];
      ver[1] = vAr[j + 1];
      ver[2] = vAr[j + 2];
      vec3.transformMat4(ver, ver, matrix);
      data += 'v ' + ver[0] + ' ' + ver[1] + ' ' + ver[2];
      data += (saveColor ? ' ' + cAr[j] + ' ' + cAr[j + 1] + ' ' + cAr[j + 2] + '\n' : '\n');
    }
    if (!saveColor) {
      // zbrush-like vertex color
      var nbChunck = Math.ceil(nbVertices / 64);
      for (i = 0; i < nbChunck; ++i) {
        data += '#MRGB ';
        j = i * 64;
        var nbCol = j + (i === nbChunck - 1 ? nbVertices % 64 : 64);
        for (; j < nbCol; ++j) {
          data += 'ff';
          var cId = j * 3;
          var r = Math.round(cAr[cId] * 255).toString(16);
          var g = Math.round(cAr[cId + 1] * 255).toString(16);
          var b = Math.round(cAr[cId + 2] * 255).toString(16);
          data += r.length === 1 ? '0' + r : r;
          data += g.length === 1 ? '0' + g : g;
          data += b.length === 1 ? '0' + b : b;
        }
        data += '\n';
      }
      // zbrush-like vertex material
      nbChunck = Math.ceil(nbVertices / 46);
      for (i = 0; i < nbChunck; ++i) {
        data += '#MAT ';
        j = i * 46;
        var nbMat = j + (i === nbChunck - 1 ? nbVertices % 46 : 46);
        for (; j < nbMat; ++j) {
          var mId = j * 3;
          var ro = Math.round(mAr[mId] * 255).toString(16);
          var m = Math.round(mAr[mId + 1] * 255).toString(16);
          var a = Math.round(mAr[mId + 2] * 255).toString(16);
          data += ro.length === 1 ? '0' + ro : ro;
          data += m.length === 1 ? '0' + m : m;
          data += a.length === 1 ? '0' + a : a;
        }
        data += '\n';
      }
    }
    var nbTexCoords = mesh.getNbTexCoords();
    var fArUV = mesh.getFacesTexCoord();
    var uvAr = mesh.getTexCoords();
    var saveUV = mesh.hasUV();
    for (i = 0; i < nbTexCoords; ++i) {
      j = i * 2;
      data += 'vt ' + uvAr[j] + ' ' + uvAr[j + 1] + '\n';
    }
    var offV = offsets[0];
    var offTex = offsets[1];
    offsets[0] += nbVertices;
    offsets[1] += nbTexCoords;
    for (i = 0; i < nbFaces; ++i) {
      j = i * 4;
      var id = fAr[j + 3];
      if (saveUV) {
        data += 'f ' + (offV + fAr[j]) + '/' + (offTex + fArUV[j]);
        data += ' ' + (offV + fAr[j + 1]) + '/' + (offTex + fArUV[j + 1]);
        data += ' ' + (offV + fAr[j + 2]) + '/' + (offTex + fArUV[j + 2]);
        data += (id >= 0 ? ' ' + (offV + id) + '/' + (offTex + fArUV[j + 3]) + '\n' : '\n');
      } else {
        data += 'f ' + (offV + fAr[j]);
        data += ' ' + (offV + fAr[j + 1]);
        data += ' ' + (offV + fAr[j + 2]);
        data += (id >= 0 ? ' ' + (offV + id) + '\n' : '\n');
      }
    }
    return data;
  };

  module.exports = Export;
});