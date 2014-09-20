define([
  'gui/GuiTR',
  'lib/FileSaver',
  'misc/Export'
], function (TR, saveAs, Export) {

  'use strict';

  function GuiFiles(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.init(guiParent);
  }

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var foldFiles = guiParent.addMenu(TR('fileTitle'));

      // scene
      foldFiles.addTitle(TR('fileResetTitle'));
      foldFiles.addButton(TR('fileResetSphere'), this.main_, 'resetScene');
      foldFiles.addButton(TR('fileResetScene'), this.main_, 'clearScene');

      // import
      foldFiles.addTitle(TR('fileImportTitle'));
      foldFiles.addButton(TR('fileAdd'), this, 'addFile');

      // export
      foldFiles.addTitle(TR('fileExportSceneTitle'));
      foldFiles.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ');
      foldFiles.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
      foldFiles.addTitle(TR('fileExportMeshTitle'));
      foldFiles.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
      foldFiles.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
    },
    /** Load file */
    addFile: function () {
      document.getElementById('fileopen').click();
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      if (this.main_.getMeshes().length === 0) return;
      var blob = Export.exportOBJ(this.main_.meshes_);
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var blob = Export.exportPLY(mesh);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var blob = Export.exportSTL(mesh);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var api = window.prompt(TR('sketchfabUploadMessage'), 'guest');
      if (!api) return;
      Export.exportSketchfab(mesh, api === 'guest' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api);
    }
  };

  return GuiFiles;
});