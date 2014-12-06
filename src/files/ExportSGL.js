define([], function () {

  'use strict';

  var Export = {};

  // current version 1
  // only vertices coordinates and faces are mandatory
  //
  // Version (u32)
  // nbMeshes (u32)
  // Center (f32 * 3)
  // Matrix (f32 * 16)
  // Scale (f32)
  // NbVertices (u32)
  // vertices (f32 * 3 * nbVertices)
  // nbColors (u32) => 0 or nbVertices
  // colors (f32 * 3 * nbVertices)
  // nbMaterials (u32) => 0 or nbVertices
  // materials (f32 * 3 * nbVertices)
  // NbFaces (u32)
  // faces (i32 * 4 * nbFaces)
  // NbTexCoords (u32) => 0 means no UV
  // texcoords (f32 * 2 * nbTexCoords)
  // nbFacesTexCoords (u32) => 0 or nbFaces
  // faces (i32 * 4 * nbFaces)
  //
  /** Export SGL (sculptgl) file */
  Export.exportSGLAsArrayBuffer = function (meshes) {
    return Export.exportSGL(meshes, true);
  };
  Export.exportSGL = function (meshes, returnArrayBuffer) {
    var nbMeshes = meshes.length;

    var nbBytes = 4 * (2 + nbMeshes * (3 + 16 + 1 + 6));
    var i = 0;
    var mesh;
    for (i = 0; i < nbMeshes; ++i) {
      mesh = meshes[i];
      nbBytes += mesh.getNbVertices() * 4 * 3;
      if (mesh.getColors())
        nbBytes += mesh.getNbVertices() * 4 * 3;
      if (mesh.getMaterials())
        nbBytes += mesh.getNbVertices() * 4 * 3;
      nbBytes += mesh.getNbFaces() * 4 * 4;
      if (mesh.hasUV()) {
        nbBytes += mesh.getNbTexCoords() * 4 * 2;
        nbBytes += mesh.getNbFaces() * 4 * 4;
      }
    }

    var buffer = new ArrayBuffer(nbBytes);
    var f32a = new Float32Array(buffer);
    var u32a = new Uint32Array(buffer);
    var i32a = new Int32Array(buffer);
    var off = 0;
    u32a[off++] = 1;
    u32a[off++] = nbMeshes;
    for (i = 0; i < nbMeshes; ++i) {
      mesh = meshes[i];

      // center + matrix + scale
      f32a.set(mesh.getCenter(), off);
      off += 3;
      f32a.set(mesh.getMatrix(), off);
      off += 16;
      f32a[off++] = mesh.getScale();

      // vertices
      var nbVertices = mesh.getNbVertices();
      u32a[off++] = nbVertices;
      f32a.set(mesh.getVertices(), off);
      off += nbVertices * 3;

      // colors
      var nbColors = mesh.getColors() ? nbVertices : 0;
      u32a[off++] = nbColors;
      if (nbColors > 0)
        f32a.set(mesh.getColors().subarray(0, nbVertices * 3), off);
      off += nbColors * 3;

      // materials
      var nbMaterials = mesh.getMaterials() ? nbVertices : 0;
      u32a[off++] = nbMaterials;
      if (nbMaterials > 0)
        f32a.set(mesh.getMaterials().subarray(0, nbVertices * 3), off);
      off += nbMaterials * 3;

      // faces
      var nbFaces = mesh.getNbFaces();
      u32a[off++] = nbFaces;
      i32a.set(mesh.getFaces().subarray(0, nbFaces * 4), off);
      off += nbFaces * 4;

      var hasUV = mesh.hasUV();
      // uvs
      var nbTexCoords = mesh.getNbTexCoords();
      u32a[off++] = nbTexCoords;
      if (hasUV > 0) {
        f32a.set(mesh.getTexCoords().subarray(0, nbTexCoords * 2), off);
        off += nbTexCoords * 2;
      }

      // face uvs
      u32a[off++] = nbFaces;
      if (hasUV) {
        i32a.set(mesh.getFacesTexCoord().subarray(0, nbFaces * 4), off);
        off += nbFaces * 4;
      }
    }

    if (returnArrayBuffer)
      return buffer;

    var data = new DataView(buffer, 0, off * 4);
    return new Blob([data]);
  };

  return Export;
});