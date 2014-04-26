define([], function () {

  'use strict';

  function StateMultiresolution(multimesh, type, ignoreData) {
    this.multimesh_ = multimesh; //the multires mesh
    this.mesh_ = multimesh.getCurrent(); //the sub multimesh
    this.vArState_ = null; //copies of vertices coordinates
    this.cArState_ = null; //copies of vertices coordinates
    if (type === StateMultiresolution.SUBDIVISION && !ignoreData) {
      this.vArState_ = new Float32Array(this.mesh_.getVertices());
      this.cArState_ = new Float32Array(this.mesh_.getColors());
    }
    this.type_ = type;
  }

  StateMultiresolution.SUBDIVISION = 0; //subdivision of the mesh
  StateMultiresolution.SELECTION = 1; //change selection of resolution

  StateMultiresolution.prototype = {
    /** On undo */
    undo: function () {
      if (this.type_ === StateMultiresolution.SUBDIVISION) {
        this.mesh_.setVertices(new Float32Array(this.vArState_));
        this.mesh_.setColors(new Float32Array(this.cArState_));
        this.multimesh_.popMesh();
      } else {
        this.multimesh_.selectMesh(this.mesh_);
      }
    },
    /** On redo */
    redo: function () {
      if (this.type_ === StateMultiresolution.SUBDIVISION) {
        this.multimesh_.pushMesh(this.mesh_);
      } else {
        this.multimesh_.selectMesh(this.mesh_);
      }
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateMultiresolution(this.multimesh_, this.type_, true);
    }
  };

  return StateMultiresolution;
});