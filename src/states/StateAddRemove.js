define([], function () {

  'use strict';

  var StateAddRemove = function (main, addedMeshes, removedMeshes) {
    this.main_ = main; // main application
    this.addedMeshes_ = addedMeshes.length !== undefined ? addedMeshes : [addedMeshes]; // the added meshes
    this.removedMeshes_ = removedMeshes.length !== undefined ? removedMeshes : [removedMeshes]; // the deleted meshes
    this.selectMeshes_ = main.getSelectedMeshes().slice();
  };

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

      var sel = this.selectMeshes_;
      main.setMesh(sel[0] ? sel[0] : null);
      var sMeshes = main.getSelectedMeshes();
      sMeshes.length = 0;
      for (i = 0, l = sel.length; i < l; ++i)
        sMeshes.push(sel[i]);
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