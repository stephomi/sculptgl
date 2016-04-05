define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var MeshResolution = require('mesh/multiresolution/MeshResolution');
  var Mesh = require('mesh/Mesh');
  var Buffer = require('render/Buffer');
  var Subdivision = require('editing/Subdivision');
  var Reversion = require('editing/Reversion');

  var Multimesh = function (mesh) {
    Mesh.call(this);

    this.setID(mesh.getID());
    this.setRenderData(mesh.getRenderData());
    this.setTransformData(mesh.getTransformData());

    this._meshes = [new MeshResolution(mesh, true)];
    this.setSelection(0);

    var gl = mesh.getGL();
    this._indexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this._wireframeBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
  };

  Multimesh.RENDER_HINT = 0;
  Multimesh.NONE = 0;
  Multimesh.SCULPT = 1;
  Multimesh.CAMERA = 2;
  Multimesh.PICKING = 3;

  Multimesh.prototype = {
    getCurrentMesh: function () {
      return this._meshes[this._sel];
    },
    setSelection: function (sel) {
      this._sel = sel;
      this.setMeshData(this.getCurrentMesh().getMeshData());
    },
    addLevel: function () {
      if ((this._meshes.length - 1) !== this._sel)
        return this.getCurrentMesh();

      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh);
      baseMesh.setVerticesMapping(undefined);

      Subdivision.fullSubdivision(baseMesh, newMesh);
      newMesh.initTopology();

      this.pushMesh(newMesh);
      this.initRender();
      return newMesh;
    },
    computeReverse: function () {
      if (this._sel !== 0)
        return this.getCurrentMesh();

      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh);

      var status = Reversion.computeReverse(baseMesh, newMesh);
      if (!status)
        return;

      newMesh.initTopology();

      this.unshiftMesh(newMesh);
      this.initRender();
      return newMesh;
    },
    lowerLevel: function () {
      if (this._sel === 0)
        return this._meshes[0];

      this._meshes[this._sel - 1].lowerAnalysis(this.getCurrentMesh());
      this.setSelection(this._sel - 1);
      this.updateResolution();

      return this.getCurrentMesh();
    },
    higherLevel: function () {
      if (this._sel === this._meshes.length - 1)
        return this.getCurrentMesh();

      this._meshes[this._sel + 1].higherSynthesis(this.getCurrentMesh());
      this.setSelection(this._sel + 1);
      this.updateResolution();

      return this.getCurrentMesh();
    },
    updateResolution: function () {
      this.updateGeometry();
      this.updateDuplicateColorsAndMaterials();
      this.updateBuffers();

      var mesh = this._meshes[this.getLowIndexRender()];
      this._indexBuffer.update(mesh.getTriangles());
      this._wireframeBuffer.update(mesh.getWireframe());
    },
    selectResolution: function (sel) {
      while (this._sel > sel) {
        this.lowerLevel();
      }
      while (this._sel < sel) {
        this.higherLevel();
      }
    },
    findIndexFromMesh: function (mesh) {
      var meshes = this._meshes;
      for (var i = 0, l = meshes.length; i < l; ++i) {
        if (mesh === meshes[i])
          return i;
      }
    },
    selectMesh: function (mesh) {
      var val = this.findIndexFromMesh(mesh);
      this.selectResolution(val);
    },
    pushMesh: function (mesh) {
      this._meshes.push(mesh);
      this.setSelection(this._meshes.length - 1);
      this.updateResolution();
    },
    unshiftMesh: function (mesh) {
      this._meshes.unshift(mesh);
      this.setSelection(1);
      this.lowerLevel();
    },
    popMesh: function () {
      this._meshes.pop();
      this.setSelection(this._meshes.length - 1);
      this.updateResolution();
    },
    shiftMesh: function () {
      this._meshes.shift();
      this.setSelection(0);
      this.updateResolution();
    },
    deleteLower: function () {
      this._meshes.splice(0, this._sel);
      this.setSelection(0);
    },
    deleteHigher: function () {
      this._meshes.splice(this._sel + 1);
    },
    getLowIndexRender: function () {
      var limit = 500000;
      var sel = this._sel;
      while (sel >= 0) {
        var mesh = this._meshes[sel];
        // we disable low rendering for lower resolution mesh with
        // an index indirection for even vertices
        if (mesh.getEvenMapping() === true)
          return sel === this._sel ? sel : sel + 1;
        if (mesh.getNbTriangles() < limit)
          return sel;
        --sel;
      }
      return 0;
    },
    _renderLow: function (main) {
      var render = this.getRenderData();
      var tmpSel = this._sel;
      var tmpIndex = this.getIndexBuffer();
      this.setSelection(this.getLowIndexRender());
      render._indexBuffer = this._indexBuffer;

      Mesh.prototype.render.call(this, main);

      render._indexBuffer = tmpIndex;
      this.setSelection(tmpSel);
    },
    _renderWireframeLow: function (main) {
      var render = this.getRenderData();
      var tmpSel = this._sel;
      var tmpWire = this.getWireframeBuffer();
      this.setSelection(this.getLowIndexRender());
      render._wireframeBuffer = this._wireframeBuffer;

      Mesh.prototype.renderWireframe.call(this, main);

      render._wireframeBuffer = tmpWire;
      this.setSelection(tmpSel);
    },
    _canUseLowRender: function (main) {
      if (this.isUsingTexCoords() || this.isUsingDrawArrays()) return false;
      if (Multimesh.RENDER_HINT === Multimesh.PICKING || Multimesh.RENDER_HINT === Multimesh.NONE) return false;
      if (main.getMesh() === this && Multimesh.RENDER_HINT !== Multimesh.CAMERA) return false;
      if (this.getLowIndexRender() === this._sel) return false;
      return true;
    },
    render: function (main) {
      return this._canUseLowRender(main) ? this._renderLow(main) : Mesh.prototype.render.call(this, main);
    },
    renderWireframe: function (main) {
      return this._canUseLowRender(main) ? this._renderWireframeLow(main) : Mesh.prototype.renderWireframe.call(this, main);
    }
  };

  Utils.makeProxy(Mesh, Multimesh);

  module.exports = Multimesh;
});
