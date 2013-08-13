var Import = {};

/** Import OBJ file */
Import.importOBJ = function (data, mesh)
{
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbLength = lines.length;
  for (var i = 0; i < nbLength; ++i)
  {
    var line = lines[i].trim();
    if (line.startsWith('v '))
    {
      split = line.split(/\s+/);
      vertices.push(new Vertex(vertices.length));
      vAr.push(parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]));
    }
    else if (line.startsWith('f '))
    {
      split = line.split(/\s+/);
      var split1 = split[1].split('/'),
        split2 = split[2].split('/'),
        split3 = split[3].split('/');
      var iv1 = parseInt(split1[0], 10),
        iv2 = parseInt(split2[0], 10),
        iv3 = parseInt(split3[0], 10);

      var nbVertices = vertices.length;
      if (iv1 < 0)
      {
        iv1 += nbVertices;
        iv2 += nbVertices;
        iv3 += nbVertices;
      }
      else
      {
        --iv1;
        --iv2;
        --iv3;
      }
      var v1 = vertices[iv1],
        v2 = vertices[iv2],
        v3 = vertices[iv3];
      var nbTriangles = triangles.length;
      v1.tIndices_.push(nbTriangles);
      v2.tIndices_.push(nbTriangles);
      v3.tIndices_.push(nbTriangles);
      triangles.push(new Triangle(nbTriangles));
      iAr.push(iv1, iv2, iv3);
      //quad to triangle...
      if (split.length > 4)
      {
        ++nbTriangles;
        var iv4 = parseInt(split[4].split('/')[0], 10);
        if (iv4 < 0)
          iv4 += nbVertices;
        else --iv4;
        var v4 = vertices[iv4];
        v1.tIndices_.push(nbTriangles);
        v3.tIndices_.push(nbTriangles);
        v4.tIndices_.push(nbTriangles);
        triangles.push(new Triangle(nbTriangles));
        iAr.push(iv1, iv3, iv4);
      }
    }
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Import PLY file */
Import.importPLY = function (data, mesh)
{
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = [],
    cAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbVertices = -1;
  var nbFaces = -1;
  var colorIndex = -1;
  var i = 0;
  while (true)
  {
    var line = lines[i].trim();
    if (line.startsWith('element vertex '))
    {
      split = line.split(/\s+/);
      nbVertices = parseInt(split[2], 10);
      var startIndex = i;
      while (true)
      {
        ++i;
        line = lines[i].trim();
        if (line.startsWith('property '))
        {
          split = line.split(/\s+/);
          if (split[2] === 'red')
          {
            colorIndex = i - startIndex - 1;
            break;
          }
        }
        else
          break;
      }
      --i;
    }
    else if (line.startsWith('element face '))
    {
      split = line.split(/\s+/);
      nbFaces = parseInt(split[2], 10);
    }
    else if (line.startsWith('end_header'))
    {
      ++i;
      var endVertices = nbVertices + i;
      var inv255 = 1 / 255;
      for (; i < endVertices; ++i)
      {
        line = lines[i].trim();
        split = line.split(/\s+/);
        vertices.push(new Vertex(vertices.length));
        vAr.push(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]));
        cAr.push(parseInt(split[colorIndex], 10) * inv255, parseInt(split[colorIndex + 1], 10) * inv255, parseInt(split[colorIndex + 2], 10) * inv255);
      }
      var endFaces = nbFaces + i;
      for (; i < endFaces; ++i)
      {
        line = lines[i].trim();
        split = line.split(/\s+/);
        var nbVert = parseInt(split[0], 10);
        if (nbVert === 3 || nbVert === 4)
        {
          var iv1 = parseInt(split[1], 10),
            iv2 = parseInt(split[2], 10),
            iv3 = parseInt(split[3], 10);
          var v1 = vertices[iv1],
            v2 = vertices[iv2],
            v3 = vertices[iv3];
          var nbTriangles = triangles.length;
          v1.tIndices_.push(nbTriangles);
          v2.tIndices_.push(nbTriangles);
          v3.tIndices_.push(nbTriangles);
          triangles.push(new Triangle(nbTriangles));
          iAr.push(iv1, iv2, iv3);
          if (nbVert === 4)
          {
            ++nbTriangles;
            var iv4 = parseInt(split[4], 10);
            var v4 = vertices[iv4];
            v1.tIndices_.push(nbTriangles);
            v3.tIndices_.push(nbTriangles);
            v4.tIndices_.push(nbTriangles);
            triangles.push(new Triangle(nbTriangles));
            iAr.push(iv1, iv3, iv4);
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
Import.importSTL = function (data, mesh)
{
  //thanks https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js
  var len = data.length;
  var data_buffer = new Uint8Array(len);
  for (var i = 0; i < len; ++i)
    data_buffer[i] = data[i].charCodeAt() & 0xff;
  var reader = new DataView(data_buffer.buffer || data_buffer),
    face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8),
    n_faces = reader.getUint32(80, true),
    expect = 80 + (32 / 8) + (n_faces * face_size);
  if (expect === reader.byteLength)
    Import.importBinarySTL(data, mesh);
  else
    Import.importAsciiSTL(data, mesh);
};

/** Import Ascii STL file */
Import.importAsciiSTL = function (data, mesh)
{
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = [],
    iAr = [];
  var lines = data.split('\n');
  var split = [];
  var nbLength = lines.length;
  var mapVertices = {};
  var x = 0,
    y = 0,
    z = 0;
  var iv1 = 0,
    iv2 = 0,
    iv3 = 0;
  var iTri = 0;
  for (var i = 0; i < nbLength; ++i)
  {
    var line = lines[i].trim();
    if (line.startsWith('facet'))
    {
      iTri = triangles.length;
      split = lines[i + 2].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv1 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      split = lines[i + 3].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv2 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      split = lines[i + 4].trim().split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv3 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      iAr.push(iv1, iv2, iv3);
      triangles.push(new Triangle(iTri));
      i += 6;
    }
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Import binary STL file */
Import.importBinarySTL = function (data, mesh)
{
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = [],
    iAr = [];
  var nbTriangles = Import.getUint32(data, 80);
  var mapVertices = {};
  var x = 0,
    y = 0,
    z = 0;
  var iv1 = 0,
    iv2 = 0,
    iv3 = 0;
  var offset = 96;
  var iTri = 0;
  for (var i = 0; i < nbTriangles; ++i)
  {
    iTri = triangles.length;

    x = Import.getFloat32(data, offset);
    y = Import.getFloat32(data, offset + 4);
    z = Import.getFloat32(data, offset + 8);
    iv1 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    x = Import.getFloat32(data, offset + 12);
    y = Import.getFloat32(data, offset + 16);
    z = Import.getFloat32(data, offset + 20);
    iv2 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    x = Import.getFloat32(data, offset + 24);
    y = Import.getFloat32(data, offset + 28);
    z = Import.getFloat32(data, offset + 32);
    iv3 = Import.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    iAr.push(iv1, iv2, iv3);
    triangles.push(new Triangle(iTri));
    offset += 50;
  }
  Import.initMeshArrays(mesh, vAr, iAr);
};

/** Check if the vertex already exists */
Import.detectNewVertex = function (mapVertices, x, y, z, vertices, vAr, iTri)
{
  var hash = x + '+' + y + '+' + z;
  var vertex = null;
  var idVertex = 0;
  if (mapVertices.hasOwnProperty(hash))
  {
    idVertex = mapVertices[hash];
    vertex = vertices[idVertex];
  }
  else
  {
    idVertex = vertices.length;
    vertex = new Vertex(idVertex);
    vertices.push(vertex);
    vAr.push(x, y, z);
    mapVertices[hash] = idVertex;
  }
  vertex.tIndices_.push(iTri);
  return idVertex;
};

/** Initialize the mesh arrays */
Import.initMeshArrays = function (mesh, vAr, iAr, cAr)
{
  mesh.vertexArray_ = new Float32Array(vAr.length * 2);
  mesh.normalArray_ = new Float32Array(vAr.length * 2);
  mesh.colorArray_ = new Float32Array(vAr.length * 2);
  mesh.indexArray_ = new SculptGL.indexArrayType(iAr.length * 2);
  mesh.vertexArray_.set(vAr);
  mesh.indexArray_.set(iAr);
  if (cAr)
    mesh.colorArray_.set(cAr);
  else
  {
    var nbColors = vAr.length / 3;
    var colorArray = mesh.colorArray_;
    var j = 0;
    for (var i = 0; i < nbColors; ++i)
    {
      j = i * 3;
      colorArray[j] = 1.0;
      colorArray[j + 1] = 1.0;
      colorArray[j + 2] = 1.0;
    }
  }
};

/** Get bytes */
Import.getBytes = function (data, offset)
{
  return [data[offset].charCodeAt(), data[offset + 1].charCodeAt(), data[offset + 2].charCodeAt(), data[offset + 3].charCodeAt()];
};

/** Read a binary uint32 */
Import.getUint32 = function (data, offset)
{
  var b = Import.getBytes(data, offset);
  return (b[0] << 0) | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
};

/** Read a binary float32 */
Import.getFloat32 = function (data, offset)
{
  var b = Import.getBytes(data, offset),
    sign = 1 - (2 * (b[3] >> 7)),
    exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
    mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0];

  if (exponent === 128)
  {
    if (mantissa !== 0)
      return NaN;
    else
      return sign * Infinity;
  }
  if (exponent === -127)
    return sign * mantissa * Math.pow(2, -126 - 23);
  return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
};