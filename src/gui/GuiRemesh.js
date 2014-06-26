define([
  'gui/GuiTR',
  'editor/Remesh'
], function (TR, Remesh) {

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
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      this.sculptgl_.states_.reset();
      Remesh.remesh(mesh);
      this.ctrlGui_.updateMesh();
      this.sculptgl_.scene_.render();
    },
  };

  return GuiRemesh;
});