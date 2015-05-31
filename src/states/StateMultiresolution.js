define([], function () {

  'use strict';

  var StateMultiresolution = function (main, multimesh, type, isRedo) {
    this._main = main; // main application
    this._multimesh = multimesh; // the multires mesh
    this._mesh = multimesh.getCurrentMesh(); // the sub multimesh
    this._type = type; // the type of action
    this._sel = multimesh._sel; // the selected mesh

    switch (this._type) {
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
        this._vArState = new Float32Array(this._mesh.getVertices()); // copies of vertices coordinates
        this._cArState = new Float32Array(this._mesh.getColors()); // copies of colors
        this._mArState = new Float32Array(this._mesh.getMaterials()); // copies of materials
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
    /** On undo */
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
        this._mesh.setVertices(new Float32Array(this._vArState));
        this._mesh.setColors(new Float32Array(this._cArState));
        this._mesh.setMaterials(new Float32Array(this._mArState));
        mul.popMesh();
        break;
      case StateMultiresolution.REVERSION:
        this._mesh.setVertices(new Float32Array(this._vArState));
        this._mesh.setColors(new Float32Array(this._cArState));
        this._mesh.setMaterials(new Float32Array(this._mArState));
        mul.shiftMesh();
        break;
      }
      this._main.setMesh(mul);
    },
    /** On redo */
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
    /** Push the redo state */
    createRedo: function () {
      return new StateMultiresolution(this._main, this._multimesh, this._type, true);
    }
  };

  return StateMultiresolution;
});