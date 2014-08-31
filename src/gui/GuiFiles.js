define([
  'gui/GuiTR',
  'lib/FileSaver',
  'misc/Export'
], function (TR, saveAs, Export) {

  'use strict';

  function GuiFiles(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.init(guiParent);
  }

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var foldFiles = guiParent.addMenu(TR('fileTitle'));
      foldFiles.addButton(TR('fileReset'), this.sculptgl_.scene_, 'resetScene_');
      foldFiles.addButton(TR('fileAdd'), this, 'openFile');
      foldFiles.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ');
      foldFiles.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
      foldFiles.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
      foldFiles.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
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
      var api = window.prompt(TR('sketchfabUploadMessage'), 'guest');
      if (!api)
        return;
      Export.exportSketchfab(mesh, api === 'guest' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api);
    }
  };

  return GuiFiles;
});