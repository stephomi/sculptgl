var Import = {};

/** Import OBJ file */
Import.importOBJ = function (data, mesh) {
  var vertRingTri = mesh.vertRingTri_;
  var vAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbLength = lines.length;
  var nbTriangles = 0;
  for (var i = 0; i < nbLength; ++i) {
    var line = lines[i].trim();
    if (line.startsWith('v ')) {
      split = line.split(/\s+/);
      vertRingTri.push([]);
      vAr.push(parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]));
    } else if (line.startsWith('f ')) {
      split = line.split(/\s+/);
      var split1 = split[1].split('/'),
        split2 = split[2].split('/'),
        split3 = split[3].split('/');
      var iv1 = parseInt(split1[0], 10),
        iv2 = parseInt(split2[0], 10),
        iv3 = parseInt(split3[0], 10);

      var nbVertices = vertRingTri.length;
      if (iv1 < 0) {
        iv1 += nbVertices;
        iv2 += nbVertices;
        iv3 += nbVertices;
      } else {
        --iv1;
        --iv2;
        --iv3;
      }
      var ring1 = vertRingTri[iv1],
        ring2 = vertRingTri[iv2],
        ring3 = vertRingTri[iv3];
      ring1.push(nbTriangles);
      ring2.push(nbTriangles);
      ring3.push(nbTriangles);
      iAr.push(iv1, iv2, iv3);
      ++nbTriangles;
      //quad to triangle...
      if (split.length > 4) {
        var iv4 = parseInt(split[4].split('/')[0], 10);
        if (iv4 < 0)
          iv4 += nbVertices;
        else --iv4;
        var ring4 = vertRingTri[iv4];
        ring1.push(nbTriangles);
        ring3.push(nbTriangles);
        ring4.push(nbTriangles);
        iAr.push(iv1, iv3, iv4);
        ++nbTriangles;
      }
    }
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Import PLY file */
Import.importPLY = function (data, mesh) {
  var vertRingTri = mesh.vertRingTri_;
  var nbTriangles = 0;
  var vAr = [],
    cAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbVertices = -1;
  var nbFaces = -1;
  var colorIndex = -1;
  var i = 0;
  var inv255 = 1.0 / 255.0;
  while (true) {
    var line = lines[i].trim();
    if (line.startsWith('element vertex ')) {
      split = line.split(/\s+/);
      nbVertices = parseInt(split[2], 10);
      var startIndex = i;
      while (true) {
        ++i;
        line = lines[i].trim();
        if (line.startsWith('property ')) {
          split = line.split(/\s+/);
          if (split[2] === 'red') {
            colorIndex = i - startIndex - 1;
            break;
          }
        } else
          break;
      }
      --i;
    } else if (line.startsWith('element face ')) {
      split = line.split(/\s+/);
      nbFaces = parseInt(split[2], 10);
    } else if (line.startsWith('end_header')) {
      ++i;
      var endVertices = nbVertices + i;
      for (; i < endVertices; ++i) {
        line = lines[i].trim();
        split = line.split(/\s+/);
        vertRingTri.push([]);
        vAr.push(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]));
        cAr.push(parseInt(split[colorIndex], 10) * inv255, parseInt(split[colorIndex + 1], 10) * inv255, parseInt(split[colorIndex + 2], 10) * inv255);
      }
      var endFaces = nbFaces + i;
      for (; i < endFaces; ++i) {
        line = lines[i].trim();
        split = line.split(/\s+/);
        var nbVert = parseInt(split[0], 10);
        if (nbVert === 3 || nbVert === 4) {
          var iv1 = parseInt(split[1], 10),
            iv2 = parseInt(split[2], 10),
            iv3 = parseInt(split[3], 10);
          var ring1 = vertRingTri[iv1],
            ring2 = vertRingTri[iv2],
            ring3 = vertRingTri[iv3];
          ring1.push(nbTriangles);
          ring2.push(nbTriangles);
          ring3.push(nbTriangles);
          iAr.push(iv1, iv2, iv3);
          ++nbTriangles;
          if (nbVert === 4) {
            var iv4 = parseInt(split[4], 10);
            var ring4 = vertRingTri[iv4];
            ring1.push(nbTriangles);
            ring3.push(nbTriangles);
            ring4.push(nbTriangles);
            iAr.push(iv1, iv3, iv4);
            ++nbTriangles;
          }
        }
      }
      break;
    }
    ++i;
  }
  Import.initMeshArrays(mesh, vAr, iAr, cAr);
};

/** Import STL file */
Import.importSTL = function (data, mesh) {
  if (84 + (Import.getUint32(data, 80) * 50) === data.length)
    Import.importBinarySTL(data, mesh);
  else
    Import.importAsciiSTL(data, mesh);
};

/** Import Ascii STL file */
Import.importAsciiSTL = function (data, mesh) {
  var vertRingTri = mesh.vertRingTri_;
  var nbTriangles = 0;
  var vAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbLength = lines.length;
  var mapVertices = {};
  var x = 0.0,
    y = 0.0,
    z = 0.0;
  var iv1 = 0,
    iv2 = 0,
    iv3 = 0;
  for (var i = 0; i < nbLength; ++i) {
    var line = lines[i].trim();
    if (line.startsWith('facet')) {
      split = lines[i + 2].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv1 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, nbTriangles);

      split = lines[i + 3].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv2 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, nbTriangles);

      split = lines[i + 4].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv3 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, nbTriangles);

      iAr.push(iv1, iv2, iv3);
      ++nbTriangles;
      i += 6;
    }
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Import binary STL file */
Import.importBinarySTL = function (data, mesh) {
  var vertRingTri = mesh.vertRingTri_;
  var vAr = [],
    iAr = [];
  var nbTriangles = Import.getUint32(data, 80);
  var mapVertices = {};
  var x = 0.0,
    y = 0.0,
    z = 0.0;
  var iv1 = 0,
    iv2 = 0,
    iv3 = 0;
  var offset = 96;
  for (var i = 0; i < nbTriangles; ++i) {
    x = Import.getFloat32(data, offset);
    y = Import.getFloat32(data, offset + 4);
    z = Import.getFloat32(data, offset + 8);
    iv1 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, i);

    x = Import.getFloat32(data, offset + 12);
    y = Import.getFloat32(data, offset + 16);
    z = Import.getFloat32(data, offset + 20);
    iv2 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, i);

    x = Import.getFloat32(data, offset + 24);
    y = Import.getFloat32(data, offset + 28);
    z = Import.getFloat32(data, offset + 32);
    iv3 = Import.detectNewVertex(mapVertices, x, y, z, vertRingTri, vAr, i);

    iAr.push(iv1, iv2, iv3);
    offset += 50;
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Check if the vertex already exists */
Import.detectNewVertex = function (mapVertices, x, y, z, vertRingTri, vAr, iTri) {
  var hash = x + '+' + y + '+' + z;
  var idVertex = mapVertices[hash];
  if (idVertex === undefined) {
    idVertex = vertRingTri.length;
    vertRingTri.push([]);
    vAr.push(x, y, z);
    mapVertices[hash] = idVertex;
  }
  vertRingTri[idVertex].push(iTri);
  return idVertex;
};

/** Initialize the mesh arrays */
Import.initMeshArrays = function (mesh, vAr, iAr, cAr) {
  mesh.verticesXYZ_ = new Float32Array(vAr.length);
  mesh.colorsRGB_ = new Float32Array(vAr.length);
  mesh.indicesABC_ = new SculptGL.indexArrayType(iAr.length);
  mesh.verticesXYZ_.set(vAr);
  mesh.indicesABC_.set(iAr);
  if (cAr)
    mesh.colorsRGB_.set(cAr);
  else {
    var colorArray = mesh.colorsRGB_;
    for (var i = 0, nbColors = vAr.length; i < nbColors; ++i)
      colorArray[i] = 1.0;
  }
};

/** Get bytes */
Import.getBytes = function (data, offset) {
  return [data[offset].charCodeAt(), data[offset + 1].charCodeAt(), data[offset + 2].charCodeAt(), data[offset + 3].charCodeAt()];
};

/** Read a binary uint32 */
Import.getUint32 = function (data, offset) {
  var b = Import.getBytes(data, offset);
  return (b[0] << 0) | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
};

/** Read a binary float32 */
Import.getFloat32 = function (data, offset) {
  var b = Import.getBytes(data, offset),
    sign = 1 - (2 * (b[3] >> 7)),
    exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
    mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0];

  if (exponent === 128) {
    if (mantissa !== 0)
      return NaN;
    else
      return sign * Infinity;
  }
  if (exponent === -127)
    return sign * mantissa * Math.pow(2, -126 - 23);
  return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
};