define([], function () {

  'use strict';

  function StateMultiresolution(multimesh, type, isRedo) {
    this.multimesh_ = multimesh; // the multires mesh
    this.mesh_ = multimesh.getCurrent(); // the sub multimesh
    this.type_ = type; // the type of action
    this.sel_ = multimesh.sel_; // the selected mesh

    switch (this.type_) {
    case StateMultiresolution.DELETE_LOWER:
      this.deletedMeshes_ = multimesh.meshes_.slice(0, multimesh.sel_); // deleted meshes
      break;
    case StateMultiresolution.DELETE_HIGHER:
      this.deletedMeshes_ = multimesh.meshes_.slice(multimesh.sel_ + 1); // deleted meshes
      if (!isRedo)
        this.vMappingState_ = this.mesh_.getVerticesMapping(); // vertex mapping low to high res
      break;
    case StateMultiresolution.SUBDIVISION:
    case StateMultiresolution.REVERSION:
      if (!isRedo) {
        this.vArState_ = new Float32Array(this.mesh_.getVertices()); // copies of vertices coordinates
        this.cArState_ = new Float32Array(this.mesh_.getColors()); // copies of colors coordinates
      }
      break;
    }
  }

  StateMultiresolution.SUBDIVISION = 0; // subdivision of the mesh
  StateMultiresolution.REVERSION = 1; // reversion of the mesh
  StateMultiresolution.SELECTION = 2; // change selection of resolution
  StateMultiresolution.DELETE_LOWER = 3; // deletes lower resolution
  StateMultiresolution.DELETE_HIGHER = 4; // deletes higher resolution

  StateMultiresolution.prototype = {
    /** On undo */
    undo: function () {
      var mul = this.multimesh_;
      switch (this.type_) {
      case StateMultiresolution.SELECTION:
        mul.selectMesh(this.mesh_);
        break;
      case StateMultiresolution.DELETE_LOWER:
        [].unshift.apply(mul.meshes_, this.deletedMeshes_);
        mul.sel_ = this.deletedMeshes_.length;
        break;
      case StateMultiresolution.DELETE_HIGHER:
        [].push.apply(mul.meshes_, this.deletedMeshes_);
        this.mesh_.setVerticesMapping(this.vMappingState_);
        break;
      case StateMultiresolution.SUBDIVISION:
        this.mesh_.setVertices(new Float32Array(this.vArState_));
        this.mesh_.setColors(new Float32Array(this.cArState_));
        mul.popMesh();
        break;
      case StateMultiresolution.REVERSION:
        this.mesh_.setVertices(new Float32Array(this.vArState_));
        this.mesh_.setColors(new Float32Array(this.cArState_));
        mul.shiftMesh();
        break;
      }
    },
    /** On redo */
    redo: function () {
      var mul = this.multimesh_;
      switch (this.type_) {
      case StateMultiresolution.SELECTION:
        mul.selectMesh(this.mesh_);
        break;
      case StateMultiresolution.DELETE_LOWER:
        mul.deleteLower();
        break;
      case StateMultiresolution.DELETE_HIGHER:
        mul.deleteHigher();
        break;
      case StateMultiresolution.SUBDIVISION:
        mul.pushMesh(this.mesh_);
        break;
      case StateMultiresolution.REVERSION:
        mul.unshiftMesh(this.mesh_);
        break;
      }
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateMultiresolution(this.multimesh_, this.type_, true);
    }
  };

  return StateMultiresolution;
});