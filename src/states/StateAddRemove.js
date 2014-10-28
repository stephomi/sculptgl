define([], function () {

  'use strict';

  function StateAddRemove(main, addedMeshes, removedMeshes) {
    this.main_ = main; // main application
    this.addedMeshes_ = addedMeshes.length !== undefined ? addedMeshes : [addedMeshes]; // the added meshes
    this.removedMeshes_ = removedMeshes.length !== undefined ? removedMeshes : [removedMeshes]; // the deleted meshes
  }

  StateAddRemove.prototype = {
    /** On undo */
    undo: function () {
      var main = this.main_;
      var meshesMain = main.getMeshes();
      var addMeshes = this.addedMeshes_;
      var i, l;
      for (i = 0, l = addMeshes.length; i < l; ++i)
        meshesMain.splice(main.getIndexMesh(addMeshes[i]), 1);
      var remMeshes = this.removedMeshes_;
      for (i = 0, l = remMeshes.length; i < l; ++i)
        meshesMain.push(remMeshes[i]);
      // re link the mesh's render to the current mesh
      for (i = 0, l = meshesMain.length; i < l; ++i) {
        var mesh = meshesMain[i];
        mesh.getRender().mesh_ = mesh;
        mesh.initRender();
      }
      main.setMesh(remMeshes[0] ? remMeshes[0] : meshesMain[0]);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      return new StateAddRemove(this.main_, this.removedMeshes_, this.addedMeshes_);
    }
  };

  return StateAddRemove;
});