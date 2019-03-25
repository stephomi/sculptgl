import Utils from 'misc/Utils';
import MeshStatic from 'mesh/meshStatic/MeshStatic';

var Import = {};

/** Import STL file */
Import.importSTL = function (buffer, gl) {
  var nbTriangles = new Uint32Array(buffer, 80, 1)[0] || 0;
  var isBinary = 84 + (nbTriangles * 50) === buffer.byteLength;
  var vb = isBinary ? Import.importBinarySTL(buffer, nbTriangles) : Import.importAsciiSTL(Utils.ab2str(buffer));
  var vbc;
  if (isBinary) {
    vbc = vb[1];
    vb = vb[0];
  }
  nbTriangles = vb.length / 9;
  var mapVertices = new Map();
  var nbVertices = [0];
  var iAr = new Uint32Array(nbTriangles * 4);
  for (var i = 0; i < nbTriangles; ++i) {
    var idt = i * 4;
    var idv = i * 9;
    iAr[idt] = Import.detectNewVertex(mapVertices, vb, vbc, idv, nbVertices);
    iAr[idt + 1] = Import.detectNewVertex(mapVertices, vb, vbc, idv + 3, nbVertices);
    iAr[idt + 2] = Import.detectNewVertex(mapVertices, vb, vbc, idv + 6, nbVertices);
    iAr[idt + 3] = Utils.TRI_INDEX;
  }
  var mesh = new MeshStatic(gl);
  mesh.setVertices(vb.subarray(0, nbVertices[0] * 3));
  if (vbc)
    mesh.setColors(vbc.subarray(0, nbVertices[0] * 3));
  mesh.setFaces(iAr);
  return [mesh];
};

/** Check if the vertex already exists */
Import.detectNewVertex = function (mapVertices, vb, vbc, start, nbVertices) {
  var x = vb[start];
  var y = vb[start + 1];
  var z = vb[start + 2];
  var hash = x + '+' + y + '+' + z;
  var idVertex = mapVertices.get(hash);
  if (idVertex === undefined) {
    idVertex = nbVertices[0];
    mapVertices.set(hash, idVertex);
    var id = idVertex * 3;
    vb[id] = x;
    vb[id + 1] = y;
    vb[id + 2] = z;
    if (vbc) {
      vbc[id] = vbc[start];
      vbc[id + 1] = vbc[start + 1];
      vbc[id + 2] = vbc[start + 2];
    }
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

  var dataHeader = data.subarray(0, 80);
  var colorMagic = String.fromCharCode.apply(null, dataHeader).indexOf('COLOR=') !== -1;

  var i = 0;
  var vb = new Uint8Array(nbTriangles * 36);
  var vbc = new Uint8Array(nbTriangles * 2);
  var offset = 96;
  var j = 0;
  var jc = 0;
  for (i = 0; i < nbTriangles; i++) {
    for (var inc = 0; inc < 36; ++inc) {
      vb[j++] = data[offset++];
    }
    vbc[jc++] = data[offset++];
    vbc[jc++] = data[offset++];
    offset += 12;
  }

  var uc = new Uint16Array(vbc.buffer);
  vbc = new Float32Array(nbTriangles * 9);
  var inv = 1.0 / 31;
  for (i = 0; i < nbTriangles; ++i) {
    j = i * 9;
    var u = uc[i];

    var r = 1.0;
    var g = 1.0;
    var b = 1.0;

    var bit15 = u & 32768;
    // https://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL
    if (colorMagic) {
      // Materialise Magics
      if (!bit15) {
        r = ((u & 31) & 31) * inv;
        g = ((u >> 5) & 31) * inv;
        b = ((u >> 10) & 31) * inv;
      }
    } else if (bit15) {
      // VisCAM and SolidView 
      r = ((u >> 10) & 31) * inv;
      g = ((u >> 5) & 31) * inv;
      b = ((u & 31) & 31) * inv;
    }

    vbc[j] = vbc[j + 3] = vbc[j + 6] = r;
    vbc[j + 1] = vbc[j + 4] = vbc[j + 7] = g;
    vbc[j + 2] = vbc[j + 5] = vbc[j + 8] = b;
  }
  return [new Float32Array(vb.buffer), vbc];
};

export default Import;
