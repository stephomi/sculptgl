define([], function () {

  'use strict';

  function GuiMesh(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application

    // ui info
    this.ctrlNbVertices_ = null; // display number of vertices controller
    this.ctrlNbFaces_ = null; // display number of faces controller

    this.init(guiParent);
  }

  GuiMesh.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var dummy = {
        func_: function () {
          return;
        }
      };
      // mesh fold
      var foldMesh = guiParent.addFolder('Mesh');
      this.ctrlNbVertices_ = foldMesh.add(dummy, 'func_').name('Ver : 0');
      this.ctrlNbFaces_ = foldMesh.add(dummy, 'func_').name('Faces : 0');
      foldMesh.open();
    },
    /** Update number of vertices and faces */
    updateMeshInfo: function (mesh) {
      this.ctrlNbVertices_.name('Ver : ' + mesh.getNbVertices());
      this.ctrlNbFaces_.name('Faces : ' + mesh.getNbFaces());
    }
  };

  return GuiMesh;
});