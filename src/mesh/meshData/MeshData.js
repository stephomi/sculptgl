define([
  'misc/Utils',
  'mesh/meshData/VertexData',
  'mesh/meshData/IndexData',
  'mesh/meshData/EdgeData',
  'mesh/meshData/WireframeData',
  'mesh/meshData/DrawArraysData',
  'mesh/meshData/TransformData'
], function (Utils, VertexData, IndexData, EdgeData, WireframeData, DrawArraysData, TransformData) {

  'use strict';

  function MeshData(mesh) {
    this.mesh_ = mesh; //the mesh

    this.vertexData_ = new VertexData(mesh); // the vertex data
    this.indexData_ = new IndexData(mesh); // the index data
    this.edgeData_ = new EdgeData(mesh); // the edge data
    this.wireframeData_ = new WireframeData(mesh); // the wireframe data
    this.drawArraysData_ = new DrawArraysData(mesh); // the wireframe data
    this.transformData_ = new TransformData(mesh); // the transform data
  }

  MeshData.prototype = {
    getVertexData: function () {
      return this.vertexData_;
    },
    getIndexData: function () {
      return this.indexData_;
    },
    getEdgeData: function () {
      return this.edgeData_;
    },
    getWireframeData: function () {
      return this.wireframeData_;
    },
    getDrawArraysData: function () {
      return this.drawArraysData_;
    },
    getTransformData: function () {
      return this.transformData_;
    },
    setVertexData: function (data) {
      this.vertexData_ = data;
    },
    setIndexData: function (data) {
      this.indexData_ = data;
    },
    setEdgeData: function (data) {
      this.edgeData_ = data;
    },
    setWireframeData: function (data) {
      this.wireframeData_ = data;
    },
    setDrawArraysData: function (data) {
      this.drawArraysData_ = data;
    },
    setTransformData: function (data) {
      this.transformData_ = data;
    },
  };

  // Basically... Mesh is a proxy/interface of all the data stuffs

  Utils.makeProxy(VertexData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getVertexData(), arguments);
    };
  });

  Utils.makeProxy(IndexData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getIndexData(), arguments);
    };
  });

  Utils.makeProxy(EdgeData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getEdgeData(), arguments);
    };
  });

  Utils.makeProxy(WireframeData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getWireframeData(), arguments);
    };
  });

  Utils.makeProxy(DrawArraysData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getDrawArraysData(), arguments);
    };
  });

  Utils.makeProxy(TransformData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getTransformData(), arguments);
    };
  });

  return MeshData;
});