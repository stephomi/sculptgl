define([
  'mesh/Mesh'
], function (Mesh) {

  'use strict';

  var Import = {};

  /** Import OBJ file */
  Import.importOBJ = function (data, gl) {
    var meshes = [];
    var vAr = [];
    var cAr = [];
    var cArMrgb = [];
    var mAr = [];
    var mArMat = [];
    var texAr = [];
    var fAr = [];
    var uvfAr = [];
    var offsetVertices = 0;
    var offsetTexCoords = 0;
    var nbVertices = 0;
    var nbTexCoords = 0;
    var lines = data.split('\n');
    var split = [];
    var inv255 = 1.0 / 255;
    var nbLength = lines.length;
    for (var i = 0; i < nbLength; ++i) {
      var line = lines[i].trim();
      if (line.startsWith('o ')) {
        if (meshes.length > 0) {
          Import.initMeshOBJ(meshes[meshes.length - 1], vAr, fAr, cAr, mAr, texAr, uvfAr, cArMrgb, mArMat);
          offsetVertices = nbVertices;
          offsetTexCoords = nbTexCoords;
        }
        meshes.push(new Mesh(gl));
      } else if (line.startsWith('v ')) {
        split = line.split(/\s+/);
        vAr.push(parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]));
        if (split[4])
          cAr.push(parseFloat(split[4]), parseFloat(split[5]), parseFloat(split[6]));
        ++nbVertices;
      } else if (line.startsWith('#MRGB ')) {
        // zbrush-like vertex color
        split = line.split(/\s+/);
        var blockMRGB = split[1];
        for (var m = 2, mlen = blockMRGB.length; m < mlen; m += 8) {
          var hex = parseInt(blockMRGB.substr(m, 6), 16);
          cArMrgb.push((hex >> 16) * inv255, (hex >> 8 & 0xff) * inv255, (hex & 0xff) * inv255);
        }
      } else if (line.startsWith('#MAT ')) {
        // zbrush-like vertex material
        split = line.split(/\s+/);
        var blockMAT = split[1];
        for (var n = 0, nlen = blockMAT.length; n < nlen; n += 6) {
          var hex2 = parseInt(blockMAT.substr(n, 6), 16);
          mArMat.push((hex2 >> 16) * inv255, (hex2 >> 8 & 0xff) * inv255, (hex2 & 0xff) * inv255);
        }
      } else if (line.startsWith('vt ')) {
        split = line.split(/\s+/);
        texAr.push(parseFloat(split[1]), parseFloat(split[2]));
        ++nbTexCoords;
      } else if (line.startsWith('f ')) {
        split = line.split(/\s+/);
        var sp1 = split[1].split('/');
        var sp2 = split[2].split('/');
        var sp3 = split[3].split('/');
        var isQuad = split.length > 4;

        var iv1 = parseInt(sp1[0], 10);
        var iv2 = parseInt(sp2[0], 10);
        var iv3 = parseInt(sp3[0], 10);
        var iv4 = isQuad ? parseInt(split[4].split('/')[0], 10) : undefined;
        if (isQuad && (iv4 === iv1 || iv4 === iv2 || iv4 === iv3))
          continue;
        if (iv1 === iv2 || iv1 === iv3 || iv2 === iv3)
          continue;
        iv1 = (iv1 < 0 ? iv1 + nbVertices : iv1 - 1) - offsetVertices;
        iv2 = (iv2 < 0 ? iv2 + nbVertices : iv2 - 1) - offsetVertices;
        iv3 = (iv3 < 0 ? iv3 + nbVertices : iv3 - 1) - offsetVertices;
        if (isQuad) iv4 = (iv4 < 0 ? iv4 + nbVertices : iv4 - 1) - offsetVertices;
        fAr.push(iv1, iv2, iv3, isQuad ? iv4 : -1);

        if (sp1[1]) {
          var uv1 = parseInt(sp1[1], 10);
          var uv2 = parseInt(sp2[1], 10);
          var uv3 = parseInt(sp3[1], 10);
          var uv4 = isQuad ? parseInt(split[4].split('/')[1], 10) : undefined;
          uv1 = (uv1 < 0 ? uv1 + nbTexCoords : uv1 - 1) - offsetTexCoords;
          uv2 = (uv2 < 0 ? uv2 + nbTexCoords : uv2 - 1) - offsetTexCoords;
          uv3 = (uv3 < 0 ? uv3 + nbTexCoords : uv3 - 1) - offsetTexCoords;
          if (isQuad) uv4 = (uv4 < 0 ? uv4 + nbTexCoords : uv4 - 1) - offsetTexCoords;
          uvfAr.push(uv1, uv2, uv3, isQuad ? uv4 : -1);
        }
      }
    }
    if (meshes.length === 0) meshes[0] = new Mesh(gl);
    Import.initMeshOBJ(meshes[meshes.length - 1], vAr, fAr, cAr, mAr, texAr, uvfAr, cArMrgb, mArMat);
    return meshes;
  };

  Import.initMeshOBJ = function (mesh, vAr, fAr, cAr, mAr, texAr, uvfAr, cArMrgb, mArMat) {
    mesh.setVertices(new Float32Array(vAr));
    mesh.setFaces(new Int32Array(fAr));
    if (cArMrgb.length > 0) mesh.setColors(new Float32Array(cArMrgb));
    else if (cAr.length > 0) mesh.setColors(new Float32Array(cAr));

    if (mArMat.length > 0) mesh.setMaterials(new Float32Array(mArMat));
    else if (mAr.length > 0) mesh.setMaterials(new Float32Array(mAr));

    if (texAr.length > 0 && uvfAr.length > 0) mesh.initTexCoordsDataFromOBJData(texAr, uvfAr);
    vAr.length = texAr.length = fAr.length = uvfAr.length = 0;
  };

  return Import;
});