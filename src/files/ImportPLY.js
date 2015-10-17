define(function (require, exports, module) {

  'use strict';

  var Mesh = require('mesh/Mesh');
  var Utils = require('misc/Utils');

  var Import = {};

  /** Import PLY file */
  Import.importPLY = function (buffer, gl) {
    var data = Utils.ab2str(buffer);
    var vAr, cAr, fAr;
    var lines = data.split('\n');
    var split = [];
    var nbVertices = -1;
    var nbFaces = -1;
    var colorIndex = -1;
    var i = 0;
    var isBinary = false;
    var offsetData = 0;
    var offsetVertex = 0;
    while (true) {
      var line = lines[i];
      offsetData += line.length;
      line = line.trim();
      if (line.startsWith('format binary')) {
        isBinary = true;
      } else if (line.startsWith('element vertex ')) {
        split = line.split(/\s+/);
        nbVertices = parseInt(split[2], 10);
        var startIndex = i;
        while (true) {
          ++i;
          var raw = lines[i];
          line = raw.trim();
          if (line.startsWith('property ')) {
            split = line.split(/\s+/)[2];
            if (split === 'red') {
              colorIndex = i - startIndex - 1;
            } else if (split === 'alpha') {
              offsetVertex += 1;
            } else if (split === 'material_index') {
              offsetVertex += 4;
            }
          } else
            break;
          offsetData += raw.length;
        }
        --i;
      } else if (line.startsWith('element face ')) {
        split = line.split(/\s+/);
        nbFaces = parseInt(split[2], 10);
      } else if (line.startsWith('end_header')) {
        ++i;
        vAr = new Float32Array(nbVertices * 3);
        cAr = colorIndex !== -1 ? new Float32Array(nbVertices * 3) : null;
        fAr = new Int32Array(nbFaces * 4);
        var offsetFace = 0;
        if (isBinary)
          offsetFace = Import.importBinaryPLY(buffer, offsetData + i, offsetVertex, vAr, fAr, cAr, colorIndex);
        else
          offsetFace = Import.importAsciiPLY(lines, i, vAr, fAr, cAr, colorIndex);
        fAr = fAr.subarray(0, offsetFace);
        break;
      }
      ++i;
    }
    var mesh = new Mesh(gl);
    mesh.setVertices(vAr);
    mesh.setFaces(fAr);
    mesh.setColors(cAr);
    return [mesh];
  };

  /** Import binary PLY file */
  Import.importBinaryPLY = function (buffer, offData, offVert, vAr, fAr, cAr, colorIndex) {
    var data = new Uint8Array(buffer);
    var nbVertices = vAr.length / 3;
    var vb = new Uint8Array(nbVertices * 12);
    var i = 0;
    var inc = 0;
    var idv = 0;
    var idc = 0;
    var inv255 = 1.0 / 255.0;
    for (i = 0; i < nbVertices; ++i) {
      for (inc = 0; inc < 12; ++inc) {
        vb[idv++] = data[offData++];
      }
      if (cAr) {
        offData += (colorIndex - 3) * 4; // if offset normal
        cAr[idc++] = data[offData++] * inv255;
        cAr[idc++] = data[offData++] * inv255;
        cAr[idc++] = data[offData++] * inv255;
      }
      offData += offVert;
    }
    vAr.set(new Float32Array(vb.buffer));

    var nbFaces = fAr.length / 4;
    var ib = new Int8Array(nbFaces * 16);
    var idt = 0;
    for (i = 0; i < nbFaces; ++i) {
      var pol = data[offData++];
      var nb = pol * 4;
      if (pol === 3 || pol === 4) {
        for (inc = 0; inc < nb; ++inc) {
          ib[idt++] = data[offData++];
        }
        if (pol === 3) {
          ib[idt++] = -1;
          ib[idt++] = -1;
          ib[idt++] = -1;
          ib[idt++] = -1;
        }
      }
    }
    fAr.set(new Int32Array(ib.buffer));
    return idt / 4;
  };

  /** Import Ascii PLY file */
  Import.importAsciiPLY = function (lines, i, vAr, iAr, cAr, colorIndex) {
    var split;
    var nbVertices = vAr.length / 3;
    var endVertices = nbVertices + i;
    var inv255 = 1.0 / 255.0;

    var id = 0;
    for (; i < endVertices; ++i) {
      split = lines[i].trim().split(/\s+/);
      vAr[id] = parseFloat(split[0]);
      vAr[id + 1] = parseFloat(split[1]);
      vAr[id + 2] = parseFloat(split[2]);
      if (cAr) {
        cAr[id] = parseInt(split[colorIndex], 10) * inv255;
        cAr[id + 1] = parseInt(split[colorIndex + 1], 10) * inv255;
        cAr[id + 2] = parseInt(split[colorIndex + 2], 10) * inv255;
      }
      id += 3;
    }
    var nbFaces = iAr.length / 4;
    var endFaces = nbFaces + i;
    id = 0;
    for (; i < endFaces; ++i) {
      split = lines[i].trim().split(/\s+/);
      var nbVert = parseInt(split[0], 10);
      if (nbVert === 3 || nbVert === 4) {
        iAr[id] = parseInt(split[1], 10);
        iAr[id + 1] = parseInt(split[2], 10);
        iAr[id + 2] = parseInt(split[3], 10);
        iAr[id + 3] = nbVert === 4 ? parseInt(split[4], 10) : -1;
        id += 4;
      }
    }
    return id;
  };

  module.exports = Import;
});