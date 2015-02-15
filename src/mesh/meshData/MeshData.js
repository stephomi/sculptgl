define([
  'misc/Utils',
  'mesh/meshData/DrawArraysData',
  'mesh/meshData/EdgeData',
  'mesh/meshData/IndexData',
  'mesh/meshData/TexCoordsData',
  'mesh/meshData/TransformData',
  'mesh/meshData/VertexData',
  'mesh/meshData/WireframeData'
], function (Utils, DrawArraysData, EdgeData, IndexData, TexCoordsData, TransformData, VertexData, WireframeData) {

  'use strict';

  var MeshData = function (mesh) {
    this.mesh_ = mesh; // the mesh

    this.drawArraysData_ = new DrawArraysData(mesh); // the wireframe data
    this.edgeData_ = new EdgeData(mesh); // the edge data
    this.indexData_ = new IndexData(mesh); // the index data
    this.texCoordsData_ = new TexCoordsData(mesh); // the uv data
    this.vertexData_ = new VertexData(mesh); // the vertex data
    this.wireframeData_ = new WireframeData(mesh); // the wireframe data
    this.transformData_ = new TransformData(mesh); // the transform data
  };

  MeshData.prototype = {
    getDrawArraysData: function () {
      return this.drawArraysData_;
    },
    getEdgeData: function () {
      return this.edgeData_;
    },
    getIndexData: function () {
      return this.indexData_;
    },
    getTexCoordsData: function () {
      return this.texCoordsData_;
    },
    getTransformData: function () {
      return this.transformData_;
    },
    getVertexData: function () {
      return this.vertexData_;
    },
    getWireframeData: function () {
      return this.wireframeData_;
    },
    setDrawArraysData: function (data) {
      this.drawArraysData_ = data;
    },
    setEdgeData: function (data) {
      this.edgeData_ = data;
    },
    setIndexData: function (data) {
      this.indexData_ = data;
    },
    setTexCoordsData: function (data) {
      this.texCoordsData_ = data;
    },
    setTransformData: function (data) {
      this.transformData_ = data;
    },
    setVertexData: function (data) {
      this.vertexData_ = data;
    },
    setWireframeData: function (data) {
      this.wireframeData_ = data;
    }
  };

  // Basically... Mesh is a proxy/interface of all the data stuffs

  Utils.makeProxy(DrawArraysData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getDrawArraysData(), arguments);
    };
  });

  Utils.makeProxy(EdgeData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getEdgeData(), arguments);
    };
  });

  Utils.makeProxy(IndexData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getIndexData(), arguments);
    };
  });

  Utils.makeProxy(TexCoordsData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getTexCoordsData(), arguments);
    };
  });

  Utils.makeProxy(TransformData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getTransformData(), arguments);
    };
  });

  Utils.makeProxy(VertexData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getVertexData(), arguments);
    };
  });

  Utils.makeProxy(WireframeData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getWireframeData(), arguments);
    };
  });

  return MeshData;
});