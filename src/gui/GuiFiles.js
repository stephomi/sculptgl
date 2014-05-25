define([
  'lib/FileSaver',
  'misc/Export'
], function (saveAs, Export) {

  'use strict';

  function GuiFiles(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.init(guiParent);
  }

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var scene = this.sculptgl_.scene_;

      // file fold
      var foldFiles = guiParent.addFolder('Files (import/export)');
      foldFiles.add(scene, 'resetScene_').name('Reset scene');
      foldFiles.add(this, 'openFile').name('Add (obj, ply, stl)');
      foldFiles.add(this, 'saveFileAsOBJ').name('Export (obj)');
      foldFiles.add(this, 'saveFileAsPLY').name('Export (ply)');
      foldFiles.add(this, 'saveFileAsSTL').name('Export (stl)');
      foldFiles.close();

      // Sketchfab fold
      var foldSketchfab = guiParent.addFolder('Go to Sketchfab !');
      foldSketchfab.add(this, 'exportSketchfab').name('Upload');
      foldSketchfab.close();
    },
    /** Open file */
    openFile: function () {
      document.getElementById('fileopen').click();
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      var blob = Export.exportOBJ(mesh);
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      var blob = Export.exportPLY(mesh);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      var blob = Export.exportSTL(mesh);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      var message = 'Please enter your sketchfab API Key.\n';
      message += 'You can also leave an empty field to upload anonymously.\n';
      message += '(a new window will pop up when the uploading and processing is finished)';
      var api = window.prompt(message, '');
      Export.exportSketchfab(mesh, api === '' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api);
    }
  };

  return GuiFiles;
});