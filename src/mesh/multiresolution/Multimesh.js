define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var MeshResolution = require('mesh/multiresolution/MeshResolution');
  var LowRender = require('mesh/multiresolution/LowRender');
  var Subdivision = require('editing/Subdivision');
  var Reversion = require('editing/Reversion');

  var Multimesh = function (mesh) {
    // every submeshes will share the same render/transformData
    mesh.getRender()._mesh = this;
    mesh.getTransformData()._mesh = this;
    this._meshes = [new MeshResolution(mesh.getTransformData(), mesh.getRender(), mesh)];
    this._sel = 0;
    this._lowRender = new LowRender(mesh.getRender());
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
    addLevel: function () {
      if ((this._meshes.length - 1) !== this._sel)
        return this.getCurrentMesh();
      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh.getTransformData(), baseMesh.getRender());
      newMesh.setID(this.getID());
      baseMesh.setVerticesMapping(undefined);

      Subdivision.fullSubdivision(baseMesh, newMesh);
      newMesh.initTopology();

      this.pushMesh(newMesh);
      this.getRender().initRender();
      return newMesh;
    },
    computeReverse: function () {
      if (this._sel !== 0)
        return this.getCurrentMesh();
      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh.getTransformData(), baseMesh.getRender());
      newMesh.setID(this.getID());

      var status = Reversion.computeReverse(baseMesh, newMesh);
      if (!status)
        return;
      newMesh.initTopology();

      this.unshiftMesh(newMesh);
      this.getRender().initRender();
      return newMesh;
    },
    lowerLevel: function () {
      if (this._sel === 0)
        return this._meshes[0];
      this._meshes[this._sel - 1].lowerAnalysis(this.getCurrentMesh());
      --this._sel;
      this.updateResolution();
      return this.getCurrentMesh();
    },
    higherLevel: function () {
      if (this._sel === this._meshes.length - 1)
        return this.getCurrentMesh();
      this._meshes[this._sel + 1].higherSynthesis(this.getCurrentMesh());
      ++this._sel;
      this.updateResolution();
      return this.getCurrentMesh();
    },
    updateResolution: function () {
      this.updateGeometry();
      this.updateDuplicateColorsAndMaterials();
      this.updateBuffers();
      this._lowRender.updateBuffers(this._meshes[this.getLowIndexRender()]);
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
      this._sel = this._meshes.length - 1;
      this.updateResolution();
    },
    unshiftMesh: function (mesh) {
      this._meshes.unshift(mesh);
      this._sel = 1;
      this.lowerLevel();
    },
    popMesh: function () {
      this._meshes.pop();
      this._sel = this._meshes.length - 1;
      this.updateResolution();
    },
    shiftMesh: function () {
      this._meshes.shift();
      this._sel = 0;
      this.updateResolution();
    },
    deleteLower: function () {
      this._meshes.splice(0, this._sel);
      this._sel = 0;
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
      var tmpSel = this._sel;
      this._sel = this.getLowIndexRender();
      this._lowRender.render(main);
      this._sel = tmpSel;
    },
    _renderWireframeLow: function (main) {
      var tmpSel = this._sel;
      this._sel = this.getLowIndexRender();
      this._lowRender.renderWireframe(main);
      this._sel = tmpSel;
    },
    _canUseLowRender: function (main) {
      if (this.getCurrentMesh().isUsingTexCoords() || this.isUsingDrawArrays()) return false;
      if (Multimesh.RENDER_HINT === Multimesh.PICKING || Multimesh.RENDER_HINT === Multimesh.NONE) return false;
      if (main.getMesh() === this && Multimesh.RENDER_HINT !== Multimesh.CAMERA) return false;
      if (this.getLowIndexRender() === this._sel) return false;
      return true;
    },
    render: function (main) {
      return this._canUseLowRender(main) ? this._renderLow(main) : this.getCurrentMesh().render(main);
    },
    renderWireframe: function (main) {
      return this._canUseLowRender(main) ? this._renderWireframeLow(main) : this.getCurrentMesh().renderWireframe(main);
    }
  };

  Utils.makeProxy(MeshResolution, Multimesh, function (proto) {
    return function () {
      return proto.apply(this.getCurrentMesh(), arguments);
    };
  });

  module.exports = Multimesh;
});