define([], function () {

  'use strict';

  function StateMultiresolution(multimesh, type, ignoreData) {
    this.multimesh_ = multimesh; // the multires mesh
    this.mesh_ = multimesh.getCurrent(); // the sub multimesh
    this.vArState_ = null; // copies of vertices coordinates
    this.cArState_ = null; // copies of vertices coordinates
    if (type !== StateMultiresolution.SELECTION && !ignoreData) {
      this.vArState_ = new Float32Array(this.mesh_.getVertices());
      this.cArState_ = new Float32Array(this.mesh_.getColors());
    }
    this.type_ = type;
  }

  StateMultiresolution.SUBDIVISION = 0; // subdivision of the mesh
  StateMultiresolution.DECIMATION = 1; // decimation of the mesh
  StateMultiresolution.SELECTION = 2; // change selection of resolution

  StateMultiresolution.prototype = {
    /** On undo */
    undo: function () {
      if (this.type_ === StateMultiresolution.SELECTION) {
        this.multimesh_.selectMesh(this.mesh_);
      } else {
        this.mesh_.setVertices(new Float32Array(this.vArState_));
        this.mesh_.setColors(new Float32Array(this.cArState_));
        if (this.type_ === StateMultiresolution.SUBDIVISION) {
          this.multimesh_.popMesh();
        } else if (this.type_ === StateMultiresolution.DECIMATION) {
          this.multimesh_.shiftMesh();
        }
      }
    },
    /** On redo */
    redo: function () {
      if (this.type_ === StateMultiresolution.SELECTION) {
        this.multimesh_.selectMesh(this.mesh_);
      } else if (this.type_ === StateMultiresolution.SUBDIVISION) {
        this.multimesh_.pushMesh(this.mesh_);
      } else if (this.type_ === StateMultiresolution.DECIMATION) {
        this.multimesh_.unshiftMesh(this.mesh_);
      }
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateMultiresolution(this.multimesh_, this.type_, true);
    }
  };

  return StateMultiresolution;
});