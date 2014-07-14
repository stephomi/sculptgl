define([
  'gui/GuiTR',
  'editor/Remesh',
  'states/StateRemesh'
], function (TR, Remesh, StateRemesh) {

  'use strict';

  function GuiRemesh(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.init(guiParent);
  }

  GuiRemesh.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var foldRemesh = guiParent.addFolder(TR('remeshTitle'));
      foldRemesh.add(this, 'remesh').name(TR('remeshRemesh'));
      foldRemesh.add(Remesh, 'resolution', 8, 400).name(TR('remeshResolution'));
      foldRemesh.open();
    },
    /** Update information on mesh */
    remesh: function () {
      var main = this.sculptgl_;
      var mesh = main.mesh_;
      if (!mesh)
        return;
      var newMesh = Remesh.remesh(mesh);
      main.states_.pushState(new StateRemesh(main, mesh, newMesh));
      main.replaceMesh(mesh, newMesh);
      main.scene_.render();
      this.ctrlGui_.updateMesh();
    },
  };

  return GuiRemesh;
});