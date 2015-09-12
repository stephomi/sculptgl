define([
  'misc/Utils',
  'mesh/meshData/DrawArraysData',
  'mesh/meshData/EdgeData',
  'mesh/meshData/FaceData',
  'mesh/meshData/TexCoordsData',
  'mesh/meshData/TransformData',
  'mesh/meshData/VertexData',
  'mesh/meshData/WireframeData'
], function (Utils, DrawArraysData, EdgeData, FaceData, TexCoordsData, TransformData, VertexData, WireframeData) {

  'use strict';

  var MeshData = function (mesh) {
    this._mesh = mesh; // the mesh

    this._drawArraysData = new DrawArraysData(mesh); // the wireframe data
    this._edgeData = new EdgeData(mesh); // the edge data
    this._faceData = new FaceData(mesh); // the index data
    this._texCoordsData = new TexCoordsData(mesh); // the uv data
    this._vertexData = new VertexData(mesh); // the vertex data
    this._wireframeData = new WireframeData(mesh); // the wireframe data
    this._transformData = new TransformData(mesh); // the transform data
  };

  MeshData.prototype = {
    getDrawArraysData: function () {
      return this._drawArraysData;
    },
    getEdgeData: function () {
      return this._edgeData;
    },
    getFaceData: function () {
      return this._faceData;
    },
    getTexCoordsData: function () {
      return this._texCoordsData;
    },
    getTransformData: function () {
      return this._transformData;
    },
    getVertexData: function () {
      return this._vertexData;
    },
    getWireframeData: function () {
      return this._wireframeData;
    },
    setDrawArraysData: function (data) {
      this._drawArraysData = data;
    },
    setEdgeData: function (data) {
      this._edgeData = data;
    },
    setFaceData: function (data) {
      this._faceData = data;
    },
    setTexCoordsData: function (data) {
      this._texCoordsData = data;
    },
    setTransformData: function (data) {
      this._transformData = data;
    },
    setVertexData: function (data) {
      this._vertexData = data;
    },
    setWireframeData: function (data) {
      this._wireframeData = data;
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

  Utils.makeProxy(FaceData, MeshData, function (proto) {
    return function () {
      return proto.apply(this.getFaceData(), arguments);
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