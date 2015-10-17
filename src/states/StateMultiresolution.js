define(function (require, exports, module) {

  'use strict';

  var StateMultiresolution = function (main, multimesh, type, isRedo) {
    this._main = main; // main application
    this._multimesh = multimesh; // the multires mesh
    this._mesh = multimesh.getCurrentMesh(); // the sub multimesh
    this._type = type; // the type of action
    this._sel = multimesh._sel; // the selected mesh

    switch (type) {
    case StateMultiresolution.DELETE_LOWER:
      this._deletedMeshes = multimesh._meshes.slice(0, multimesh._sel); // deleted meshes
      break;
    case StateMultiresolution.DELETE_HIGHER:
      this._deletedMeshes = multimesh._meshes.slice(multimesh._sel + 1); // deleted meshes
      if (!isRedo)
        this._vMappingState = this._mesh.getVerticesMapping(); // vertex mapping low to high res
      break;
    case StateMultiresolution.SUBDIVISION:
    case StateMultiresolution.REVERSION:
      if (!isRedo) {
        this._vArState = this._mesh.getVertices().slice(); // copies of vertices coordinates
        this._cArState = this._mesh.getColors().slice(); // copies of colors
        this._mArState = this._mesh.getMaterials().slice(); // copies of materials
      }
      break;
    }
  };

  StateMultiresolution.SUBDIVISION = 0; // subdivision of the mesh
  StateMultiresolution.REVERSION = 1; // reversion of the mesh
  StateMultiresolution.SELECTION = 2; // change selection of resolution
  StateMultiresolution.DELETE_LOWER = 3; // deletes lower resolution
  StateMultiresolution.DELETE_HIGHER = 4; // deletes higher resolution

  StateMultiresolution.prototype = {
    isNoop: function () {
      return false;
    },
    undo: function () {
      var mul = this._multimesh;
      switch (this._type) {
      case StateMultiresolution.SELECTION:
        mul.selectMesh(this._mesh);
        break;
      case StateMultiresolution.DELETE_LOWER:
        Array.prototype.unshift.apply(mul._meshes, this._deletedMeshes);
        mul._sel = this._deletedMeshes.length;
        break;
      case StateMultiresolution.DELETE_HIGHER:
        Array.prototype.push.apply(mul._meshes, this._deletedMeshes);
        this._mesh.setVerticesMapping(this._vMappingState);
        break;
      case StateMultiresolution.SUBDIVISION:
        this._mesh.setVertices(this._vArState.slice());
        this._mesh.setColors(this._cArState.slice());
        this._mesh.setMaterials(this._mArState.slice());
        mul.popMesh();
        break;
      case StateMultiresolution.REVERSION:
        this._mesh.setVertices(this._vArState.slice());
        this._mesh.setColors(this._cArState.slice());
        this._mesh.setMaterials(this._mArState.slice());
        mul.shiftMesh();
        break;
      }
      this._main.setMesh(mul);
    },
    redo: function () {
      var mul = this._multimesh;
      switch (this._type) {
      case StateMultiresolution.SELECTION:
        mul.selectMesh(this._mesh);
        break;
      case StateMultiresolution.DELETE_LOWER:
        mul.deleteLower();
        break;
      case StateMultiresolution.DELETE_HIGHER:
        mul.deleteHigher();
        break;
      case StateMultiresolution.SUBDIVISION:
        mul.pushMesh(this._mesh);
        break;
      case StateMultiresolution.REVERSION:
        mul.unshiftMesh(this._mesh);
        break;
      }
      this._main.setMesh(mul);
    },
    createRedo: function () {
      return new StateMultiresolution(this._main, this._multimesh, this._type, true);
    }
  };

  module.exports = StateMultiresolution;
});