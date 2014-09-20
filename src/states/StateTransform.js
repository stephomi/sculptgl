define([
  'lib/glMatrix'
], function (glm) {

  'use strict';

  var mat4 = glm.mat4;

  function StateTransform(main, mesh) {
    this.main_ = main; // main application
    this.mesh_ = mesh; // the mesh
    this.matrixState_ = mat4.create(); // the matrix transform
    mat4.copy(this.matrixState_, this.mesh_.getMatrix());
  }

  StateTransform.prototype = {
    /** On undo */
    undo: function () {
      mat4.copy(this.mesh_.getMatrix(), this.matrixState_);
      this.main_.setMesh(this.mesh_);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateTransform(this.main_, this.mesh_);
    }
  };

  return StateTransform;
});