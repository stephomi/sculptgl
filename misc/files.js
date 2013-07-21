var Files = {};

/** Import OBJ file */
Files.importOBJ = function (data, mesh)
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
    var line = lines[i];
    line = line.trim();
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
  mesh.vertexArray_ = new Float32Array(vAr.length * 2);
  mesh.normalArray_ = new Float32Array(vAr.length * 2);
  mesh.indexArray_ = new SculptGL.indexArrayType(iAr.length * 2);
  mesh.vertexArray_.set(vAr);
  mesh.indexArray_.set(iAr);
};

/** Export OBJ file */
Files.exportOBJ = function (mesh)
{
  var vAr = mesh.vertexArray_;
  var iAr = mesh.indexArray_;
  var data = 's 0\n';
  var nbVertices = mesh.vertices_.length;
  var nbTriangles = mesh.triangles_.length;
  var scale = 1 / mesh.scale_;
  var i = 0,
    j = 0;
  for (i = 0; i < nbVertices; ++i)
  {
    j = i * 3;
    data += 'v ' + vAr[j] * scale + ' ' + vAr[j + 1] * scale + ' ' + vAr[j + 2] * scale + '\n';
  }
  for (i = 0; i < nbTriangles; ++i)
  {
    j = i * 3;
    data += 'f ' + (1 + iAr[j]) + ' ' + (1 + iAr[j + 1]) + ' ' + (1 + iAr[j + 2]) + '\n';
  }
  return data;
};

/** Import STL file */
Files.importSTL = function (data, mesh)
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
    Files.importBinarySTL(data, mesh);
  else
    Files.importAsciiSTL(data, mesh);
};

/** Import Ascii STL file */
Files.importAsciiSTL = function (data, mesh)
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
  var offset = 96;
  var iTri = 0;
  for (var i = 0; i < nbLength; ++i)
  {
    var line = lines[i];
    line = line.trim();
    if (line.startsWith('facet'))
    {
      iTri = triangles.length;
      split = lines[i + 2].split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv1 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      split = lines[i + 3].split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv2 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      split = lines[i + 4].split(/\s+/);
      x = parseFloat(split[1]);
      y = parseFloat(split[2]);
      z = parseFloat(split[3]);
      iv3 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

      iAr.push(iv1, iv2, iv3);
      triangles.push(new Triangle(iTri));
      i += 6;
    }
  }
  mesh.vertexArray_ = new Float32Array(vAr.length * 2);
  mesh.normalArray_ = new Float32Array(vAr.length * 2);
  mesh.indexArray_ = new SculptGL.indexArrayType(iAr.length * 2);
  mesh.vertexArray_.set(vAr);
  mesh.indexArray_.set(iAr);
};

/** Import binary STL file */
Files.importBinarySTL = function (data, mesh)
{
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = [],
    iAr = [];
  var nbTriangles = Files.getUint32(data, 80);
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

    x = Files.getFloat32(data, offset);
    y = Files.getFloat32(data, offset + 4);
    z = Files.getFloat32(data, offset + 8);
    iv1 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    x = Files.getFloat32(data, offset + 12);
    y = Files.getFloat32(data, offset + 16);
    z = Files.getFloat32(data, offset + 20);
    iv2 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    x = Files.getFloat32(data, offset + 24);
    y = Files.getFloat32(data, offset + 28);
    z = Files.getFloat32(data, offset + 32);
    iv3 = Files.detectNewVertex(mapVertices, x, y, z, vertices, vAr, iTri);

    iAr.push(iv1, iv2, iv3);
    triangles.push(new Triangle(iTri));
    offset += 50;
  }
  mesh.vertexArray_ = new Float32Array(vAr.length * 2);
  mesh.normalArray_ = new Float32Array(vAr.length * 2);
  mesh.indexArray_ = new SculptGL.indexArrayType(iAr.length * 2);
  mesh.vertexArray_.set(vAr);
  mesh.indexArray_.set(iAr);
};

/** Check if the vertex already exists */
Files.detectNewVertex = function (mapVertices, x, y, z, vertices, vAr, iTri)
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

/** Get bytes */
Files.getBytes = function (data, offset)
{
  return [data[offset].charCodeAt(), data[offset + 1].charCodeAt(), data[offset + 2].charCodeAt(), data[offset + 3].charCodeAt()];
};

/** Read a binary uint32 */
Files.getUint32 = function (data, offset)
{
  var b = Files.getBytes(data, offset);
  return (b[0] << 0) | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
};

/** Read a binary float32 */
Files.getFloat32 = function (data, offset)
{
  var b = Files.getBytes(data, offset),
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

/** Export OBJ file to Verold */
Files.exportVerold = function (mesh, key)
{
  var fd = new FormData();

  fd.append('api_key', key);
  var model = Files.exportOBJ(mesh);

  fd.append('model', new Blob([model]), 'model.obj');
  fd.append('title', 'Model');
  fd.append('description', 'Imported from SculptGL.');

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://studio.verold.com/projects.json');

  var result = function ()
  {
    var res = JSON.parse(xhr.responseText);
    console.log(res);
    if (res.errors)
      alert('Verold upload error :\n' + res.errors[0]);
    else
      alert('Upload success !');
  };
  xhr.addEventListener('load', result, true);
  xhr.send(fd);
};

/** Export OBJ file to Sketchfab */
Files.exportSketchfab = function (mesh, key)
{
  var fd = new FormData();

  fd.append('token', key);
  var model = Files.exportOBJ(mesh);

  fd.append('fileModel', new Blob([model]));
  fd.append('filenameModel', 'model.obj');

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.sketchfab.com/v1/models');

  var result = function ()
  {
    var res = JSON.parse(xhr.responseText);
    console.log(res);
    if (!res.success)
      alert('Sketchfab upload error :\n' + res.error);
    else
      alert('Upload success !');
  };
  xhr.addEventListener('load', result, true);
  xhr.send(fd);
};