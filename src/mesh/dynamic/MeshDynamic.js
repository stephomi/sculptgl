define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Topology = require('mesh/dynamic/Topology');
  var Mesh = require('mesh/Mesh');

  // Dynamic topology mesh (triangles only)
  // Obviously less performant than the static topology mesh
  // It "inherits" Mesh but in practice it almost overrides everything related to topology
  //
  // The edges are not computed though (kind of bothersome to update...)
  //
  // The wireframe is directly computed from the triangles (it's as stupid as 1 tri => 3 lines)
  // Basically... "quick and dirty" (the edges will be drawn twice)

  var MeshDynamic = function (mesh) {
    Mesh.call(this, mesh.getGL());
    this.setTransformData(mesh.getTransformData());
    this.setID(mesh.getID());
    this._dynamicTopology = new Topology(this);

    // vertices rings
    var vdata = this.getVertexData();
    this._vrings = vdata._vertRingVert = []; // vertex ring
    this._frings = vdata._vertRingFace = []; // face ring
    this._nbFaces = 0;
    this._nbVertices = 0;

    this._facesStateFlags = null; // state flags (<= Utils.STATE_FLAG) (Int32Array)
    this._wireframe = null; // Uint32Array
    this.init(mesh);
    this.setRender(mesh.getRender());
    if (mesh.isUsingTexCoords())
      this.setShaderName('MATCAP');
    mesh.getRender()._mesh = this;
    this.initRender();
  };

  MeshDynamic.prototype = {
    getDynamicTopology: function () {
      return this._dynamicTopology;
    },
    getVerticesProxy: function () {
      return this.getVertices(); // for now no proxy sculpting for dynamic meshes
    },
    getNbVertices: function () {
      return this._nbVertices;
    },
    setNbVertices: function (nbVertices) {
      this._nbVertices = nbVertices;
    },
    addNbVertice: function (nb) {
      this._nbVertices += nb;
    },
    getNbFaces: function () {
      return this._nbFaces;
    },
    getNbTriangles: function () {
      return this._nbFaces;
    },
    setNbFaces: function (nbFaces) {
      this._nbFaces = nbFaces;
    },
    addNbFace: function (nb) {
      this._nbFaces += nb;
    },
    getNbEdges: function () {
      return this.getNbTriangles() * 3;
    },
    getFacesStateFlags: function () {
      return this._facesStateFlags;
    },
    getRenderVertices: function () {
      if (this.isUsingDrawArrays()) return this.getVerticesDrawArrays();
      return this.getVertices().subarray(0, this.getNbVertices() * 3);
    },
    getRenderNormals: function () {
      if (this.isUsingDrawArrays()) return this.getNormalsDrawArrays();
      return this.getNormals().subarray(0, this.getNbVertices() * 3);
    },
    getRenderColors: function () {
      if (this.isUsingDrawArrays()) return this.getColorsDrawArrays();
      return this.getColors().subarray(0, this.getNbVertices() * 3);
    },
    getRenderMaterials: function () {
      if (this.isUsingDrawArrays()) return this.getMaterialsDrawArrays();
      return this.getMaterials().subarray(0, this.getNbVertices() * 3);
    },
    getRenderTriangles: function () {
      return this.getTriangles().subarray(0, this.getNbTriangles() * 3);
    },
    init: function (mesh) {
      this.setVertices(mesh.getVertices().slice());
      this.setColors(mesh.getColors().slice());
      this.setMaterials(mesh.getMaterials().slice());
      this.setFaces(new Int32Array(mesh.getNbTriangles() * 4));
      this.setNbFaces(mesh.getNbTriangles());
      this.setNbVertices(mesh.getNbVertices());

      this.allocateArrays();

      this.initTriangles(mesh);
      this.initRenderTriangles();
      this.initVerticesTopology();

      this.updateFacesAabbAndNormal();
      this.updateVerticesNormal();
      this.updateOctree();
    },
    updateTopology: function (iFaces) {
      this.updateRenderTriangles(iFaces);
      if (this.getShowWireframe())
        this.updateWireframe(iFaces);
      if (this.isUsingDrawArrays())
        this.updateDrawArrays(iFaces);
    },
    getWireframe: function () {
      if (!this._wireframe) {
        this._wireframe = new Uint32Array(this.getTriangles().length * 2);
        this.updateWireframe();
      }
      return this._wireframe.subarray(0, this.getNbEdges() * 2);
    },
    setShowWireframe: function (showWireframe) {
      this._wireframe = null;
      this.getRender().setShowWireframe(showWireframe);
    },
    updateWireframe: function (iFaces) {
      var wire = this._wireframe;
      var tris = this.getTriangles();
      var full = iFaces === undefined;
      var useDA = this.isUsingDrawArrays();
      var nbTriangles = full ? this.getNbTriangles() : iFaces.length;
      for (var i = 0; i < nbTriangles; ++i) {
        var ind = full ? i : iFaces[i];
        var idw = ind * 6;
        var idt = ind * 3;
        if (useDA) {
          wire[idw] = wire[idw + 5] = idt;
          wire[idw + 1] = wire[idw + 2] = idt + 2;
          wire[idw + 3] = wire[idw + 4] = idt + 1;
        } else {
          wire[idw] = wire[idw + 5] = tris[idt];
          wire[idw + 1] = wire[idw + 2] = tris[idt + 1];
          wire[idw + 3] = wire[idw + 4] = tris[idt + 2];
        }
      }
    },
    updateRenderTriangles: function (iFaces) {
      var tAr = this.getTriangles();
      var fAr = this.getFaces();
      var full = iFaces === undefined;
      var nbFaces = full ? this.getNbFaces() : iFaces.length;
      for (var i = 0; i < nbFaces; ++i) {
        var id = full ? i : iFaces[i];
        var idt = id * 3;
        var idf = id * 4;
        tAr[idt] = fAr[idf];
        tAr[idt + 1] = fAr[idf + 1];
        tAr[idt + 2] = fAr[idf + 2];
      }
    },
    resizeArray: function (orig, targetSize) {
      if (!orig) return null;
      // multiply by 2 the size
      if (orig.length >= targetSize) return orig.subarray(0, targetSize * 2);
      var tmp = new orig.constructor(targetSize * 2);
      tmp.set(orig);
      return tmp;
    },
    /** Reallocate mesh resources */
    reAllocateArrays: function (nbAddElements) {
      this.reAllocate(nbAddElements);
      if (this.isUsingDrawArrays())
        this.getDrawArraysData().reAllocateArrays(nbAddElements);
      this.getFaceData().reAllocateArrays(nbAddElements);
      this.getVertexData().reAllocateArrays(nbAddElements);
      this.getOctree().reAllocateArrays(nbAddElements);
    },
    reAllocate: function (nbAddElements) {
      var nbDyna = this._facesStateFlags.length;
      var nbTriangles = this.getNbTriangles();
      var len = nbTriangles + nbAddElements;
      if (nbDyna < len || nbDyna > len * 4) {
        this._facesStateFlags = this.resizeArray(this._facesStateFlags, len);
        if (this.getShowWireframe())
          this._wireframe = this.resizeArray(this._wireframe, len * 6);
      }
    },
    initTriangles: function (mesh) {
      var iArMesh = mesh.getTriangles();
      var nbTriangles = this.getNbTriangles();
      var fAr = this.getFaces();
      this._facesStateFlags = new Int32Array(nbTriangles);
      for (var i = 0; i < nbTriangles; ++i) {
        var id3 = i * 3;
        var id4 = i * 4;
        fAr[id4] = iArMesh[id3];
        fAr[id4 + 1] = iArMesh[id3 + 1];
        fAr[id4 + 2] = iArMesh[id3 + 2];
        fAr[id4 + 3] = -1;
      }
    },
    initVerticesTopology: function () {
      var vrings = this._vrings;
      var frings = this._frings;
      var i = 0;
      var nbVertices = this.getNbVertices();
      vrings.length = frings.length = nbVertices;
      for (i = 0; i < nbVertices; ++i) {
        vrings[i] = [];
        frings[i] = [];
      }

      var nbTriangles = this.getNbTriangles();
      var iAr = this.getTriangles();
      for (i = 0; i < nbTriangles; ++i) {
        var j = i * 3;
        frings[iAr[j]].push(i);
        frings[iAr[j + 1]].push(i);
        frings[iAr[j + 2]].push(i);
      }

      for (i = 0; i < nbVertices; ++i)
        this.computeRingVertices(i);
    },
    /** Compute the vertices around a vertex */
    computeRingVertices: function (iVert) {
      var tagFlag = ++Utils.TAG_FLAG;
      var fAr = this.getFaces();
      var vflags = this.getVerticesTagFlags();

      var vring = this._vrings[iVert];
      var fring = this._frings[iVert];
      vring.length = 0;
      var nbTris = fring.length;

      for (var i = 0; i < nbTris; ++i) {
        var ind = fring[i] * 4;
        var iVer1 = fAr[ind];
        var iVer2 = fAr[ind + 1];
        var iVer3 = fAr[ind + 2];
        if (iVer1 !== iVert && vflags[iVer1] !== tagFlag) {
          vring.push(iVer1);
          vflags[iVer1] = tagFlag;
        }
        if (iVer2 !== iVert && vflags[iVer2] !== tagFlag) {
          vring.push(iVer2);
          vflags[iVer2] = tagFlag;
        }
        if (iVer3 !== iVert && vflags[iVer3] !== tagFlag) {
          vring.push(iVer3);
          vflags[iVer3] = tagFlag;
        }
      }
    }
  };

  Utils.makeProxy(Mesh, MeshDynamic);

  module.exports = MeshDynamic;
});