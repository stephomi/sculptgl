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
    this.id_ = Mesh.ID++; // useful id to retrieve a mesh (dynamic mesh, multires mesh, voxel mesh)

    // dirty local edited part of the mesh
    this.updateLocalEdit_ = false;
    this.localStackEditFaces_ = [];

    this.localVerticesXYZ_ = null;
    this.localColorsRGB_ = null;
    this.localMaterialsPBR_ = null;
    this.localNormalsXYZ_ = null;
    this.localTrianglesABC_ = null;
  }

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
      return this.id_;
    },
    setID: function (id) {
      this.id_ = id;
    },
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
    setIsLocalEdit: function (bool) {
      this.isLocalEdit_ = bool;
      if (!bool)
        this.localStackEditFaces_.length = 0;
    },
    isLocalEdit: function () {
      return this.isLocalEdit_;
    },
    getRenderVertices: function () {
      if (this.isLocalEdit()) return this.localVerticesXYZ_;
      if (this.isUsingDrawArrays()) return this.getVerticesDrawArrays();
      return this.isUsingTexCoords() ? this.getVerticesTexCoord() : this.getVertices();
    },
    getRenderNormals: function () {
      if (this.isLocalEdit()) return this.localNormalsXYZ_;
      if (this.isUsingDrawArrays()) return this.getNormalsDrawArrays();
      return this.isUsingTexCoords() ? this.getNormalsTexCoord() : this.getNormals();
    },
    getRenderColors: function () {
      if (this.isLocalEdit()) return this.localColorsRGB_;
      if (this.isUsingDrawArrays()) return this.getColorsDrawArrays();
      return this.isUsingTexCoords() ? this.getColorsTexCoord() : this.getColors();
    },
    getRenderMaterials: function () {
      if (this.isLocalEdit()) return this.localMaterialsPBR_;
      if (this.isUsingDrawArrays()) return this.getMaterialsDrawArrays();
      return this.isUsingTexCoords() ? this.getMaterialsTexCoord() : this.getMaterials();
    },
    getRenderTexCoords: function () {
      return this.isUsingDrawArrays() ? this.getTexCoordsDrawArrays() : this.getTexCoords();
    },
    getRenderTriangles: function () {
      if (this.isLocalEdit()) return this.localTrianglesABC_;
      return this.isUsingTexCoords() ? this.getTrianglesTexCoord() : this.getTriangles();
    },
    getRenderNbTriangles: function () {
      if (this.isLocalEdit()) return this.localTrianglesABC_.length / 3;
      return this.getNbTriangles();
    },
    getRenderNbEdges: function () {
      return this.getNbEdges();
    },
    /** Initialize stuffs for the mesh */
    init: function (ignoreTransform) {
      this.initColorsAndMaterials();
      this.allocateArrays();
      this.initTopology();
      this.updateGeometry();
      this.updateDuplicateColorsAndMaterials();
      if (!ignoreTransform)
        this.scaleAndCenter();
    },
    /** Init topoloy stuffs */
    initTopology: function () {
      this.initFaceRings();
      this.initEdges();
      this.initVertexRings();
      this.initRenderTriangles();
    },
    /** Updates the mesh Geometry */
    updateGeometry: function (iFaces, iVerts) {
      this.updateFacesAabbAndNormal(iFaces);
      this.updateVerticesNormal(iVerts);
      this.updateOctree(iFaces);
      this.updateDuplicateGeometry(iVerts);
      this.updateFlatShading(iFaces);
      if (iFaces)
        this.localStackEditFaces_.push(iFaces);
    },
    /** Allocate mesh resources */
    allocateArrays: function () {
      this.getIndexData().allocateArrays();
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

  return Mesh;
});