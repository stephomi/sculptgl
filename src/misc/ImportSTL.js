define([
  'mesh/Mesh',
  'misc/Utils'
], function (Mesh, Utils) {

  'use strict';

  var Import = {};

  /** Import STL file */
  Import.importSTL = function (buffer, gl) {
    var nbTriangles = new Uint32Array(buffer, 80, 1)[0] || 0;
    var isBinary = 84 + (nbTriangles * 50) === buffer.byteLength;
    var vb = isBinary ? Import.importBinarySTL(buffer, nbTriangles) : Import.importAsciiSTL(Utils.ab2str(buffer));
    nbTriangles = vb.length / 9;
    var mapVertices = {};
    var nbVertices = [0];
    var iAr = new Int32Array(nbTriangles * 4);
    for (var i = 0; i < nbTriangles; ++i) {
      var idt = i * 4;
      var idv = i * 9;
      iAr[idt] = Import.detectNewVertex(mapVertices, vb, idv, nbVertices);
      iAr[idt + 1] = Import.detectNewVertex(mapVertices, vb, idv + 3, nbVertices);
      iAr[idt + 2] = Import.detectNewVertex(mapVertices, vb, idv + 6, nbVertices);
      iAr[idt + 3] = -1;
    }
    var mesh = new Mesh(gl);
    mesh.setVertices(vb.subarray(0, nbVertices[0] * 3));
    mesh.setFaces(iAr);
    return [mesh];
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
  Import.importBinarySTL = function (buffer, nbTriangles) {
    var data = new Uint8Array(buffer);
    var i = 0;
    var vb = new Uint8Array(nbTriangles * 36);
    var offset = 96;
    var j = 0;
    for (i = 0; i < nbTriangles; i++) {
      for (var inc = 0; inc < 36; ++inc) {
        vb[j++] = data[offset++];
      }
      offset += 14;
    }
    return new Float32Array(vb.buffer);
  };

  return Import;
});