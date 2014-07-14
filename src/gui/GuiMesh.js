define([
  'gui/GuiTR'
], function (TR) {

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
      var foldMesh = guiParent.addFolder(TR('meshTitle'));
      this.ctrlNbVertices_ = foldMesh.add(dummy, 'func_').name(TR('meshNbVertices') + '0');
      this.ctrlNbFaces_ = foldMesh.add(dummy, 'func_').name(TR('meshNbFaces') + '0');
      foldMesh.open();
    },
    /** Update number of vertices and faces */
    updateMeshInfo: function (mesh) {
      this.ctrlNbVertices_.name(TR('meshNbVertices') + mesh.getNbVertices());
      this.ctrlNbFaces_.name(TR('meshNbFaces') + mesh.getNbFaces());
    }
  };

  return GuiMesh;
});