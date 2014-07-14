define([], function () {

  'use strict';

  function StateRemesh(sculptgl, oldMesh, newMesh) {
    this.sculptgl_ = sculptgl; // main scene
    this.oldMesh_ = oldMesh; // the old mesh
    this.newMesh_ = newMesh; // the new mesh
  }

  StateRemesh.prototype = {
    /** On undo */
    undo: function () {
      this.sculptgl_.replaceMesh(this.newMesh_, this.oldMesh_);
      var mesh = this.oldMesh_;
      // render buffer and transform data can be shared
      // when we convert a mesh to a multimesh (or the opposite)
      mesh.getRender().mesh_ = mesh;
      mesh.getTransformData().mesh_ = mesh;
      mesh.updateFlatShading(); // only if necessary
      mesh.initRender();
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateRemesh(this.sculptgl_, this.newMesh_, this.oldMesh_);
    }
  };

  return StateRemesh;
});