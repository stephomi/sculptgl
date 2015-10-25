define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var MeshData = require('mesh/meshData/MeshData');
  var Octree = require('math3d/Octree');
  var Render = require('mesh/Render');

  var Mesh = function (gl) {
    this._meshData = new MeshData(this); // the mesh data
    this._octree = new Octree(this); // octree
    this._render = gl ? new Render(gl, this) : null; // octree
    this._id = Mesh.ID++; // useful id to retrieve a mesh (dynamic mesh, multires mesh, voxel mesh)
  };

  Mesh.ID = 0;
  Mesh.sortFunction = function (meshA, meshB) {
    // render transparent (back to front) after opaque (front to back) ones
    var aTr = meshA.isTransparent();
    var bTr = meshB.isTransparent();
    if (aTr && !bTr) return 1;
    if (!aTr && bTr) return -1;
    return (meshB.getDepth() - meshA.getDepth()) * (aTr && bTr ? 1.0 : -1.0);
  };

  Mesh.prototype = {
    getID: function () {
      return this._id;
    },
    setID: function (id) {
      this._id = id;
    },
    getMeshData: function () {
      return this._meshData;
    },
    getOctree: function () {
      return this._octree;
    },
    getRender: function () {
      return this._render;
    },
    setMeshData: function (data) {
      this._meshData = data;
    },
    setOctree: function (octree) {
      this._octree = octree;
    },
    setRender: function (render) {
      this._render = render;
    },
    getRenderVertices: function () {
      if (this.isUsingDrawArrays()) return this.getVerticesDrawArrays();
      return this.isUsingTexCoords() ? this.getVerticesTexCoord() : this.getVertices();
    },
    getRenderNormals: function () {
      if (this.isUsingDrawArrays()) return this.getNormalsDrawArrays();
      return this.isUsingTexCoords() ? this.getNormalsTexCoord() : this.getNormals();
    },
    getRenderColors: function () {
      if (this.isUsingDrawArrays()) return this.getColorsDrawArrays();
      return this.isUsingTexCoords() ? this.getColorsTexCoord() : this.getColors();
    },
    getRenderMaterials: function () {
      if (this.isUsingDrawArrays()) return this.getMaterialsDrawArrays();
      return this.isUsingTexCoords() ? this.getMaterialsTexCoord() : this.getMaterials();
    },
    getRenderTexCoords: function () {
      return this.isUsingDrawArrays() ? this.getTexCoordsDrawArrays() : this.getTexCoords();
    },
    getRenderTriangles: function () {
      return this.isUsingTexCoords() ? this.getTrianglesTexCoord() : this.getTriangles();
    },
    getRenderNbEdges: function () {
      return this.getNbEdges();
    },
    init: function () {
      this.initColorsAndMaterials();
      this.allocateArrays();
      this.initTopology();
      this.updateGeometry();
      if (this._render)
        this.updateDuplicateColorsAndMaterials();
      this.updateCenter();
    },
    initTopology: function () {
      this.initFaceRings();
      this.initEdges();
      this.initVertexRings();
      this.initRenderTriangles();
    },
    updateGeometry: function (iFaces, iVerts) {
      this.updateFacesAabbAndNormal(iFaces);
      this.updateVerticesNormal(iVerts);
      this.updateOctree(iFaces);
      if (this._render) {
        this.updateDuplicateGeometry(iVerts);
        this.updateDrawArrays(iFaces);
      }
    },
    allocateArrays: function () {
      this.getFaceData().allocateArrays();
      this.getVertexData().allocateArrays();
      this.getTexCoordsData().allocateArrays();
      this.getOctree().allocateArrays();
    }
  };

  // Basically... Mesh is a proxy/interface of all the stuffs below

  Utils.makeProxy(MeshData, Mesh, function (proto) {
    return function () {
      return proto.apply(this.getMeshData(), arguments);
    };
  });

  Utils.makeProxy(Render, Mesh, function (proto) {
    return function () {
      return proto.apply(this.getRender(), arguments);
    };
  });

  Utils.makeProxy(Octree, Mesh, function (proto) {
    return function () {
      return proto.apply(this.getOctree(), arguments);
    };
  });

  module.exports = Mesh;
});