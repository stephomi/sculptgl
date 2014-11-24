define([
  'mesh/Mesh'
], function (Mesh) {

  'use strict';

  var Import = {};

  // see ExportSGL for file description
  //
  /** Import SGL file */
  Import.importSGL = function (buffer, gl) {
    var f32a = new Float32Array(buffer);
    var u32a = new Uint32Array(buffer);
    var i32a = new Int32Array(buffer);

    var off = 0;
    var version = u32a[off++];
    if (version !== 1)
      return [];
    var nbMeshes = u32a[off++];

    var meshes = new Array(nbMeshes);
    for (var i = 0; i < nbMeshes; ++i) {
      var mesh = meshes[i] = new Mesh(gl);

      // center matrix and scale
      mesh.getCenter().set(f32a.subarray(off, off + 3));
      off += 3;
      mesh.getMatrix().set(f32a.subarray(off, off + 16));
      off += 16;
      mesh.setScale(f32a[off++]);

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
      var uv;
      if (nbElts)
        uv = f32a.subarray(off, off + nbElts * 2);
      off += nbElts * 2;

      // face uvs
      nbElts = u32a[off++];
      var fuv;
      if (nbElts)
        fuv = i32a.subarray(off, off + nbElts * 4);
      off += nbElts * 4;

      if (uv && fuv)
        mesh.initTexCoordsDataFromOBJData(uv, fuv);
    }

    return meshes;
  };

  return Import;
});