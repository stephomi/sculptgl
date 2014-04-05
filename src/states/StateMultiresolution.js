define([], function () {

  'use strict';

  function StateMultiresolution(multimesh, type) {
    this.multimesh_ = multimesh; //the multires mesh
    this.mesh_ = multimesh.getCurrent(); //the sub multimesh
    this.type_ = type;
  }

  StateMultiresolution.SUBDIVISION = 0;
  StateMultiresolution.LOWER = 1;
  StateMultiresolution.HIGHER = 2;

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
      var type = StateMultiresolution.SUBDIVISION;
      if (this.type_ === StateMultiresolution.LOWER)
        type = StateMultiresolution.HIGHER;
      else if (this.type_ === StateMultiresolution.HIGHER)
        type = StateMultiresolution.LOWER;
      return new StateMultiresolution(this.multimesh_, type);
    }
  };

  return StateMultiresolution;
});