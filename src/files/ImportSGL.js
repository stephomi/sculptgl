define(function (require, exports, module) {

  'use strict';

  var Mesh = require('mesh/Mesh');
  var ExportSGL = require('files/ExportSGL');
  var ShaderBase = require('render/shaders/ShaderBase');

  var intToString = ExportSGL.intToString;

  var Import = {};

  // see ExportSGL for file description
  //
  /** Import SGL file */
  Import.importSGL = function (buffer, gl, main) {
    var f32a = new Float32Array(buffer);
    var u32a = new Uint32Array(buffer);
    var i32a = new Int32Array(buffer);

    var off = 0;
    var version = u32a[off++];
    if (version > 2)
      return [];

    // camera stuffs
    if (version >= 2) {
      main._showGrid = u32a[off++];
      ShaderBase.showSymmetryLine = u32a[off++];
      main._showContour = u32a[off++];

      var cam = main.getCamera();
      cam.setProjectionType(intToString.INT_TO_PROJECTION[u32a[off++]]);
      cam.setMode(intToString.INT_TO_MODE[u32a[off++]]);
      cam.setFov(f32a[off++]);
      cam.setUsePivot(u32a[off++]);
    }

    var nbMeshes = u32a[off++];
    var meshes = new Array(nbMeshes);
    for (var i = 0; i < nbMeshes; ++i) {
      var mesh = meshes[i] = new Mesh(gl);

      // shader + matcap + wire + alpha + flat 
      if (version >= 2) {
        var render = mesh.getRender();
        // we don't have the geometry buffer and data yet so
        // we don't want to call updateBuffers (so no call to )
        render._shaderName = intToString.INT_TO_SHADER[u32a[off++]];
        render.setMatcap(u32a[off++]);
        render._showWireframe = u32a[off++];
        render._flatShading = u32a[off++];
        render.setOpacity(f32a[off++]);
      }

      // center matrix and scale
      mesh.getCenter().set(f32a.subarray(off, off + 3));
      off += 3;
      mesh.getMatrix().set(f32a.subarray(off, off + 16));
      off += 16;
      off++; // scale

      // vertices
      var nbElts = u32a[off++];
      mesh.setVertices(f32a.subarray(off, off + nbElts * 3));
      off += nbElts * 3;

      // colors
      nbElts = u32a[off++];
      if (nbElts > 0)
        mesh.setColors(f32a.subarray(off, off + nbElts * 3));
      off += nbElts * 3;

      // materials
      nbElts = u32a[off++];
      if (nbElts > 0)
        mesh.setMaterials(f32a.subarray(off, off + nbElts * 3));
      off += nbElts * 3;

      // faces
      nbElts = u32a[off++];
      mesh.setFaces(i32a.subarray(off, off + nbElts * 4));
      off += nbElts * 4;

      // uvs
      nbElts = u32a[off++];
      var uv = null;
      if (nbElts)
        uv = f32a.subarray(off, off + nbElts * 2);
      off += nbElts * 2;

      // face uvs
      nbElts = u32a[off++];
      var fuv = null;
      if (nbElts)
        fuv = i32a.subarray(off, off + nbElts * 4);
      off += nbElts * 4;

      if (uv && fuv)
        mesh.initTexCoordsDataFromOBJData(uv, fuv);
    }

    return meshes;
  };

  module.exports = Import;
});