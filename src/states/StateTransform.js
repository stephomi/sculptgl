define([
  'lib/glMatrix'
], function (glm) {

  'use strict';

  var mat4 = glm.mat4;

  function StateTransform(mesh) {
    this.mesh_ = mesh; // the mesh
    this.matrixState_ = mat4.create(); // the matrix transform
    mat4.copy(this.matrixState_, this.mesh_.getMatrix());
  }

  StateTransform.prototype = {
    /** On undo */
    undo: function () {
      mat4.copy(this.mesh_.getMatrix(), this.matrixState_);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateTransform(this.mesh_);
    }
  };

  return StateTransform;
});