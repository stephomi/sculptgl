define(function (require, exports, module) {

  'use strict';

  var ShaderBase = require('render/shaders/ShaderBase');

  var invert = function (obj) {
    var keys = Object.keys(obj);
    var inv = {};
    for (var i = 0, nbkeys = keys.length; i < nbkeys; ++i)
      inv[obj[keys[i]]] = keys[i];
    return inv;
  };

  var stringToInt = {};
  var intToString = {};
  stringToInt.MODE_TO_INT = {
    ORBIT: 0,
    SPHERICAL: 1,
    PLANE: 2
  };
  intToString.INT_TO_MODE = invert(stringToInt.MODE_TO_INT);

  stringToInt.PROJECTION_TO_INT = {
    PERSPECTIVE: 0,
    ORTHOGRAPHIC: 1
  };
  intToString.INT_TO_PROJECTION = invert(stringToInt.PROJECTION_TO_INT);

  stringToInt.SHADER_TO_INT = {
    PBR: 0,
    NORMAL: 2,
    UV: 4,
    MATCAP: 5
  };
  intToString.INT_TO_SHADER = invert(stringToInt.SHADER_TO_INT);

  var Export = {};
  Export.intToString = intToString;
  Export.stringToInt = stringToInt;

  // current version 2
  //
  // Version (u32)

  // ShowGrid (u32) .v2
  // ShowMirror (u32) .v2
  // ShowContour (u32) .v2

  // CameraProj (u32) .v2
  // CameraMode (u32) .v2
  // CameraFov (f32) .v2
  // CameraPivot (u32) .v2

  // nbMeshes (u32)

  // Shader (u32) .v2
  // Matcap (u32) .v2
  // ShowWireframe (u32) .v2;
  // FlatShading (u32) .v2;
  // Alpha (f32) .v2

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

  // NbFacesTexCoords (u32) => 0 or nbFaces
  // faces (i32 * 4 * nbFaces)
  //
  /** Export SGL (sculptgl) file */

  Export.exportSGLAsArrayBuffer = function (meshes, main) {
    return Export.exportSGL(meshes, main, true);
  };
  Export.exportSGL = function (meshes, main, returnArrayBuffer) {
    var nbMeshes = meshes.length;

    var bytePerMesh = 3 + 16 + 1 + 6 + 5;
    var nbBytes = 4 * (1 + 3 + 4 + 1 + nbMeshes * bytePerMesh);
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
    u32a[off++] = 2;

    // misc stuffs
    u32a[off++] = main._showGrid;
    u32a[off++] = ShaderBase.showSymmetryLine;
    u32a[off++] = main._showContour;

    // camera stuffs
    var cam = main.getCamera();
    u32a[off++] = stringToInt.PROJECTION_TO_INT[cam.getProjectionType()];
    u32a[off++] = stringToInt.MODE_TO_INT[cam.getMode()];
    f32a[off++] = cam.getFov();
    u32a[off++] = cam.getUsePivot();

    // save meshes
    u32a[off++] = nbMeshes;
    for (i = 0; i < nbMeshes; ++i) {
      mesh = meshes[i];

      // shader + matcap + wire + alpha + flat 
      u32a[off++] = stringToInt.SHADER_TO_INT[mesh.getShaderName()];
      u32a[off++] = mesh.getMatcap();
      u32a[off++] = mesh.getShowWireframe();
      u32a[off++] = mesh.getFlatShading();
      f32a[off++] = mesh.getOpacity();

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
      u32a[off++] = hasUV ? nbTexCoords : 0;
      if (hasUV) {
        f32a.set(mesh.getTexCoords().subarray(0, nbTexCoords * 2), off);
        off += nbTexCoords * 2;
      }

      // face uvs
      u32a[off++] = hasUV ? nbFaces : 0;
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

  module.exports = Export;
});