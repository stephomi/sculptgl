define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Mesh = require('mesh/Mesh');
  var createTransformData = require('mesh/TransformData');
  var createMeshData = require('mesh/MeshData');
  var RenderData = require('mesh/RenderData');

  var MeshStatic = function (gl) {
    Mesh.call(this);

    this._id = Mesh.ID++; // useful id to retrieve a mesh (dynamic mesh, multires mesh, voxel mesh)

    if (gl) this._renderData = new RenderData(gl, this);
    this._meshData = createMeshData();
    this._transformData = createTransformData();
  };

  Utils.makeProxy(Mesh, MeshStatic);

  module.exports = MeshStatic;
});
