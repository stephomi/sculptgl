define(function (require, exports, module) {

  'use strict';

  var StateAddRemove = function (main, addedMeshes, removedMeshes) {
    this._main = main; // main application
    this._addedMeshes = addedMeshes.length !== undefined ? addedMeshes : [addedMeshes]; // the added meshes
    this._removedMeshes = removedMeshes.length !== undefined ? removedMeshes : [removedMeshes]; // the deleted meshes
    this._selectMeshes = main.getSelectedMeshes().slice();
  };

  StateAddRemove.prototype = {
    isNoop: function () {
      return this._addedMeshes.length === 0 && this._removedMeshes.length === 0;
    },
    undo: function () {
      var main = this._main;
      var meshesMain = main.getMeshes();
      var addMeshes = this._addedMeshes;
      var i, l;
      for (i = 0, l = addMeshes.length; i < l; ++i)
        meshesMain.splice(main.getIndexMesh(addMeshes[i]), 1);
      var remMeshes = this._removedMeshes;
      for (i = 0, l = remMeshes.length; i < l; ++i)
        meshesMain.push(remMeshes[i]);
      // re link the mesh's render to the current mesh
      for (i = 0, l = meshesMain.length; i < l; ++i) {
        var mesh = meshesMain[i];
        mesh.getRender()._mesh = mesh;
        mesh.initRender();
      }

      var sel = this._selectMeshes;
      main.setMesh(sel[0] ? sel[0] : null);
      var sMeshes = main.getSelectedMeshes();
      sMeshes.length = 0;
      for (i = 0, l = sel.length; i < l; ++i)
        sMeshes.push(sel[i]);
    },
    redo: function () {
      this.undo();
    },
    createRedo: function () {
      return new StateAddRemove(this._main, this._removedMeshes, this._addedMeshes);
    }
  };

  module.exports = StateAddRemove;
});