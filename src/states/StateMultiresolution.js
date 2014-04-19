define([], function () {

  'use strict';

  function StateMultiresolution(multimesh, type) {
    this.multimesh_ = multimesh; //the multires mesh
    this.mesh_ = multimesh.getCurrent(); //the sub multimesh
    this.type_ = type;
  }

  StateMultiresolution.SUBDIVISION = 0; //subdivision of the mesh
  StateMultiresolution.SELECTION = 1; //change of resolution

  StateMultiresolution.prototype = {
    /** On undo */
    undo: function () {
      this.multimesh_.selectMesh(this.mesh_);
      if (this.type_ === StateMultiresolution.SUBDIVISION)
        this.multimesh_.meshes_.pop();
    },
    /** On redo */
    redo: function () {
      if (this.type_ === StateMultiresolution.SUBDIVISION)
        this.multimesh_.meshes_.push(this.mesh_);
      this.multimesh_.selectMesh(this.mesh_);
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateMultiresolution(this.multimesh_, this.type_);
    }
  };

  return StateMultiresolution;
});