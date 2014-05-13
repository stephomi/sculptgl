define([
  'misc/Utils',
  'mesh/meshData/MeshData',
  'math3d/Octree',
  'render/Render'
], function (Utils, MeshData, Octree, Render) {

  'use strict';

  function Mesh(gl) {
    this.meshData_ = new MeshData(this); // the mesh data
    this.octree_ = new Octree(this); // octree
    this.render_ = gl ? new Render(gl, this) : null; // octree
  }

  Mesh.prototype = {
    getMeshData: function () {
      return this.meshData_;
    },
    getOctree: function () {
      return this.octree_;
    },
    getRender: function () {
      return this.render_;
    },
    setMeshData: function (data) {
      this.meshData_ = data;
    },
    setOctree: function (octree) {
      this.octree_ = octree;
    },
    setRender: function (render) {
      this.render_ = render;
    },
    getRenderVertices: function (useDrawArrays) {
      return useDrawArrays ? this.getDrawArraysData().verticesXYZ_ : this.getVertices();
    },
    getRenderNormals: function (useDrawArrays) {
      return useDrawArrays ? this.getDrawArraysData().normalsXYZ_ : this.getNormals();
    },
    getRenderColors: function (useDrawArrays) {
      return useDrawArrays ? this.getDrawArraysData().colorsRGB_ : this.getColors();
    },
    getRenderIndices: function () {
      return this.getIndices();
    },
    getRenderNbTriangles: function () {
      return this.getNbTriangles();
    },
    getRenderNbEdges: function () {
      return this.getNbEdges();
    },
    /** Initialize stuffs for the mesh */
    init: function () {
      this.initColors();
      this.allocateArrays();
      this.initTopology();
      this.updateGeometry();
      this.scaleAndCenter();
    },
    /** Init topoloy stuffs */
    initTopology: function () {
      this.initTriangleRings();
      this.initEdges();
      this.initVertexRings();
    },
    /** Updates the mesh Geometry */
    updateGeometry: function (iTris, iVerts) {
      this.updateTrianglesAabbAndNormal(iTris);
      this.updateVerticesNormal(iVerts);
      this.updateOctree(iTris);
      this.updateFlatShading(iTris);
    },
    /** Allocate arrays, except for : coordinates, primitives, edges, wireframe, drawArrays, details */
    allocateArrays: function () {
      this.getIndexData().allocateArrays();
      this.getVertexData().allocateArrays();
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

  return Mesh;
});