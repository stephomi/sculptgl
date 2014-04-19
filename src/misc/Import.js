define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var Import = {};

  /** Import OBJ file */
  Import.importOBJ = function (data, mesh) {
    var vAr = [];
    var iAr = [];
    var nbVertices = 0;
    var lines = data.split('\n');
    var split = [];
    var nbLength = lines.length;
    var nbTriangles = 0;
    for (var i = 0; i < nbLength; ++i) {
      var line = lines[i].trim();
      if (line.startsWith('v ')) {
        split = line.split(/\s+/);
        vAr.push(parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]));
        ++nbVertices;
      } else if (line.startsWith('f ')) {
        split = line.split(/\s+/);
        var split1 = split[1].split('/'),
          split2 = split[2].split('/'),
          split3 = split[3].split('/');
        var iv1 = parseInt(split1[0], 10);
        var iv2 = parseInt(split2[0], 10);
        var iv3 = parseInt(split3[0], 10);

        if (iv1 < 0) {
          iv1 += nbVertices;
          iv2 += nbVertices;
          iv3 += nbVertices;
        } else {
          --iv1;
          --iv2;
          --iv3;
        }
        iAr.push(iv1, iv2, iv3);
        ++nbTriangles;
        //quad to triangle...
        if (split.length > 4) {
          var iv4 = parseInt(split[4].split('/')[0], 10);
          if (iv4 < 0)
            iv4 += nbVertices;
          else --iv4;
          iAr.push(iv1, iv3, iv4);
          ++nbTriangles;
        }
      }
    }
    mesh.verticesXYZ_ = new Float32Array(vAr);
    mesh.indicesABC_ = new Utils.indexArrayType(iAr);
  };

  /** Import PLY file */
  Import.importPLY = function (data, mesh) {
    var vAr, cAr, iAr;
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
        iAr = new Utils.indexArrayType(nbFaces * 4);
        var offsetTri = 0;
        if (isBinary)
          offsetTri = Import.importBinaryPLY(data, offsetData + i, offsetVertex, vAr, iAr, cAr, colorIndex);
        else
          offsetTri = Import.importAsciiPLY(lines, i, vAr, iAr, cAr, colorIndex);
        iAr = iAr.subarray(0, offsetTri);
        break;
      }
      ++i;
    }
    mesh.verticesXYZ_ = vAr;
    mesh.indicesABC_ = iAr;
    mesh.colorsRGB_ = cAr;
  };

  /** Import binary PLY file */
  Import.importBinaryPLY = function (data, offData, offVert, vAr, iAr, cAr, colorIndex) {
    var nbVertices = vAr.length / 3;
    var vb = new Uint8Array(nbVertices * 12);

    var i = 0;
    var inc = 0;
    var idv = 0;
    var idc = 0;
    var inv255 = 1.0 / 255.0;
    for (i = 0; i < nbVertices; ++i) {
      for (inc = 0; inc < 12; ++inc) {
        vb[idv++] = data.charCodeAt(offData++);
      }
      if (cAr) {
        offData += (colorIndex - 3) * 4; // if offset normal
        cAr[idc++] = data.charCodeAt(offData++) * inv255;
        cAr[idc++] = data.charCodeAt(offData++) * inv255;
        cAr[idc++] = data.charCodeAt(offData++) * inv255;
      }
      offData += offVert;
    }
    vAr.set(new Float32Array(vb.buffer));

    var nbFaces = iAr.length / 4;
    var ib = new Uint8Array(nbFaces * 16);
    var idt = 0;
    for (i = 0; i < nbFaces; ++i) {
      var pol = data.charCodeAt(offData++);
      if (pol === 3) {
        for (inc = 0; inc < 12; ++inc) {
          ib[idt++] = data.charCodeAt(offData++);
        }
      } else if (pol === 4) {
        ib[idt++] = data.charCodeAt(offData - 12);
        ib[idt++] = data.charCodeAt(offData - 11);
        ib[idt++] = data.charCodeAt(offData - 10);
        ib[idt++] = data.charCodeAt(offData - 9);

        ib[idt++] = data.charCodeAt(offData - 4);
        ib[idt++] = data.charCodeAt(offData - 3);
        ib[idt++] = data.charCodeAt(offData - 2);
        ib[idt++] = data.charCodeAt(offData - 1);

        ib[idt++] = data.charCodeAt(offData++);
        ib[idt++] = data.charCodeAt(offData++);
        ib[idt++] = data.charCodeAt(offData++);
        ib[idt++] = data.charCodeAt(offData++);
      }
    }
    iAr.set(new Utils.indexArrayType(ib.buffer));
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
        var iv1 = parseInt(split[1], 10);
        var iv2 = parseInt(split[2], 10);
        var iv3 = parseInt(split[3], 10);
        iAr[id] = iv1;
        iAr[id + 1] = iv2;
        iAr[id + 2] = iv3;
        id += 3;
        if (nbVert === 4) {
          iAr[id] = iv1;
          iAr[id + 1] = iv3;
          iAr[id + 2] = parseInt(split[4], 10);
          id += 3;
        }
      }
    }
    return id;
  };

  /** Import STL file */
  Import.importSTL = function (data, mesh) {
    var isBinary = 84 + (Utils.getUint32(data, 80) * 50) === data.length;
    var vb = isBinary ? Import.importBinarySTL(data) : Import.importAsciiSTL(data);
    var nbTriangles = vb.length / 9;
    var mapVertices = {};
    var nbVertices = [0];
    var iAr = new Utils.indexArrayType(nbTriangles * 3);
    for (var i = 0; i < nbTriangles; ++i) {
      var idt = i * 3;
      var idv = i * 9;
      iAr[idt] = Import.detectNewVertex(mapVertices, vb, idv, nbVertices);
      iAr[idt + 1] = Import.detectNewVertex(mapVertices, vb, idv + 3, nbVertices);
      iAr[idt + 2] = Import.detectNewVertex(mapVertices, vb, idv + 6, nbVertices);
    }
    mesh.verticesXYZ_ = vb.subarray(0, nbVertices[0] * 3);
    mesh.indicesABC_ = iAr;
  };

  /** Check if the vertex already exists */
  Import.detectNewVertex = function (mapVertices, vb, start, nbVertices) {
    var x = vb[start];
    var y = vb[start + 1];
    var z = vb[start + 2];
    var hash = x + '+' + y + '+' + z;
    var idVertex = mapVertices[hash];
    if (idVertex === undefined) {
      mapVertices[hash] = idVertex = nbVertices[0];
      var id = idVertex * 3;
      vb[id] = x;
      vb[id + 1] = y;
      vb[id + 2] = z;
      nbVertices[0]++;
    }
    return idVertex;
  };

  /** Import Ascii STL file */
  Import.importAsciiSTL = function (data) {
    var lines = data.split('\n');
    var nbLength = lines.length;
    var vb = new Float32Array(Math.ceil(nbLength * 9 / 7));
    var acc = 0;
    for (var i = 0; i < nbLength; ++i) {
      var line = lines[i].trim();
      if (line.startsWith('facet')) {
        var split = lines[i + 2].trim().split(/\s+/);
        vb[acc++] = parseFloat(split[1]);
        vb[acc++] = parseFloat(split[2]);
        vb[acc++] = parseFloat(split[3]);
        split = lines[i + 3].trim().split(/\s+/);
        vb[acc++] = parseFloat(split[1]);
        vb[acc++] = parseFloat(split[2]);
        vb[acc++] = parseFloat(split[3]);
        split = lines[i + 4].trim().split(/\s+/);
        vb[acc++] = parseFloat(split[1]);
        vb[acc++] = parseFloat(split[2]);
        vb[acc++] = parseFloat(split[3]);
      }
    }
    return vb.subarray(0, acc);
  };

  /** Import binary STL file */
  Import.importBinarySTL = function (data) {
    var nbTriangles = Utils.getUint32(data, 80);
    var i = 0;
    var vb = new Uint8Array(nbTriangles * 36);
    var offset = 96;
    var j = 0;
    for (i = 0; i < nbTriangles; i++) {
      for (var inc = 0; inc < 36; ++inc) {
        vb[j++] = data.charCodeAt(offset++);
      }
      offset += 14;
    }
    return new Float32Array(vb.buffer);
  };

  return Import;
});