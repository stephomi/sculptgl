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
      var scene = this.sculptgl_.scene_;

      // file fold
      var foldFiles = guiParent.addFolder(TR('fileTitle'));
      foldFiles.add(scene, 'resetScene_').name(TR('fileReset'));
      foldFiles.add(this, 'openFile').name(TR('fileAdd'));
      foldFiles.add(this, 'saveFileAsOBJ').name(TR('fileExportOBJ'));
      foldFiles.add(this, 'saveFileAsPLY').name(TR('fileExportPLY'));
      foldFiles.add(this, 'saveFileAsSTL').name(TR('fileExportSTL'));
      foldFiles.close();

      // Sketchfab fold
      var foldSketchfab = guiParent.addFolder(TR('sketchfabTitle'));
      foldSketchfab.add(this, 'exportSketchfab').name(TR('sketchfabUpload'));
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
      var api = window.prompt(TR('sketchfabUploadMessage'), 'guest');
      if (!api)
        return;
      Export.exportSketchfab(mesh, api === 'guest' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api);
    }
  };

  return GuiFiles;
});