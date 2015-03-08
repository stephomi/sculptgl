define([
  'mesh/Mesh'
], function (Mesh) {

  'use strict';

  var Primitive = {};

  Primitive.createCube = function (gl) {
    var mesh = new Mesh(gl);

    var v = new Float32Array(24);
    v[1] = v[2] = v[4] = v[6] = v[7] = v[9] = v[10] = v[11] = v[14] = v[18] = v[21] = v[23] = -10.0;
    v[0] = v[3] = v[5] = v[8] = v[12] = v[13] = v[15] = v[16] = v[17] = v[19] = v[20] = v[22] = 10.0;

    var uv = new Float32Array(28);
    uv[0] = uv[6] = uv[8] = uv[10] = uv[11] = uv[13] = uv[16] = uv[23] = uv[25] = 0.5;
    uv[1] = uv[3] = 1.0;
    uv[2] = uv[4] = uv[9] = uv[12] = uv[14] = uv[15] = uv[18] = 0.25;
    uv[5] = uv[7] = uv[21] = uv[24] = uv[26] = uv[27] = 0.75;
    uv[17] = uv[19] = uv[20] = uv[22] = 0.0;

    var f = new Int32Array(24);
    var ft = new Int32Array(24);
    f[0] = f[8] = f[21] = ft[0] = 0;
    f[1] = f[11] = f[12] = ft[1] = 1;
    f[2] = f[15] = f[16] = ft[2] = ft[15] = ft[16] = 2;
    f[3] = f[19] = f[22] = ft[3] = ft[19] = ft[22] = 3;
    f[4] = f[9] = f[20] = ft[4] = ft[9] = 4;
    f[7] = f[10] = f[13] = ft[5] = ft[18] = ft[23] = 5;
    f[6] = f[14] = f[17] = ft[6] = ft[14] = ft[17] = 6;
    f[5] = f[18] = f[23] = ft[7] = ft[10] = 7;
    ft[8] = 8;
    ft[11] = 9;
    ft[12] = 10;
    ft[13] = 11;
    ft[20] = 12;
    ft[21] = 13;

    mesh.setVertices(v);
    mesh.setFaces(f);
    mesh.initTexCoordsDataFromOBJData(uv, ft);

    mesh.init();
    mesh.scaleAndCenter();
    mesh.initRender();

    return mesh;
  };

  return Primitive;
});