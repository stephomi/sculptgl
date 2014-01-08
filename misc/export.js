var Export = {};

/** Export OBJ file */
Export.exportOBJ = function (mesh)
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

/** Export STL file */
Export.exportSTL = function (mesh)
{
  return Export.exportAsciiSTL(mesh);
};

/** Export Ascii STL file */
Export.exportAsciiSTL = function (mesh)
{
  var vAr = mesh.vertexArray_;
  var nAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;
  var data = 'solid mesh\n';
  var triangles = mesh.triangles_;
  var nbTriangles = triangles.length;
  var scale = 1.0 / mesh.scale_;
  var i = 0,
    j = 0;
  for (i = 0; i < nbTriangles; ++i)
  {
    j = i * 3;
    var n = triangles[i].normal_;
    data += ' facet normal ' + n[0] + ' ' + n[1] + ' ' + n[2] + '\n';
    data += '  outer loop\n'
    var iv1 = iAr[j] * 3,
      iv2 = iAr[j + 1] * 3,
      iv3 = iAr[j + 2] * 3;
    data += '   vertex ' + vAr[iv1] * scale + ' ' + vAr[iv1 + 1] * scale + ' ' + vAr[iv1 + 2] * scale + '\n';
    data += '   vertex ' + vAr[iv2] * scale + ' ' + vAr[iv2 + 1] * scale + ' ' + vAr[iv2 + 2] * scale + '\n';
    data += '   vertex ' + vAr[iv3] * scale + ' ' + vAr[iv3 + 1] * scale + ' ' + vAr[iv3 + 2] * scale + '\n';
    data += '  endloop\n';
    data += ' endfacet\n';
  }
  data += 'endsolid mesh\n';
  return data;
};

/** Export PLY file */
Export.exportPLY = function (mesh)
{
  return Export.exportAsciiPLY(mesh);
};

/** Export Ascii PLY file */
Export.exportAsciiPLY = function (mesh)
{
  var vAr = mesh.vertexArray_;
  var cAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;
  var data = 'ply\nformat ascii 1.0\ncomment created by SculptGL\n';
  var nbVertices = mesh.vertices_.length;
  var nbTriangles = mesh.triangles_.length;
  var scale = 1.0 / mesh.scale_;
  var i = 0,
    j = 0;
  data += 'element vertex ' + nbVertices + '\n';
  data += 'property float x\nproperty float y\nproperty float z\n';
  data += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
  data += 'element face ' + nbTriangles + '\n';
  data += 'property list uchar uint vertex_indices\nend_header\n';
  for (i = 0; i < nbVertices; ++i)
  {
    j = i * 3;
    data += vAr[j] * scale + ' ' +
      vAr[j + 1] * scale + ' ' +
      vAr[j + 2] * scale + ' ' +
      ((cAr[j] * 0xff) | 0) + ' ' +
      ((cAr[j + 1] * 0xff) | 0) + ' ' +
      ((cAr[j + 2] * 0xff) | 0) + '\n';
  }
  for (i = 0; i < nbTriangles; ++i)
  {
    j = i * 3;
    data += '3 ' + iAr[j] + ' ' + iAr[j + 1] + ' ' + iAr[j + 2] + '\n';
  }
  return data;
};

/** Export OBJ file to Verold */
Export.exportVerold = function (mesh, key)
{
  var fd = new FormData();

  fd.append('api_key', key);
  var model = Export.exportOBJ(mesh);

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
Export.exportSketchfab = function (mesh, key)
{
  var fd = new FormData();

  fd.append('token', key);
  var model = Export.exportOBJ(mesh);

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