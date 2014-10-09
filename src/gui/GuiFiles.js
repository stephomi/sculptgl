define([
  'gui/GuiTR',
  'lib/FileSaver',
  'misc/Export'
], function (TR, saveAs, Export) {

  'use strict';

  function GuiFiles(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.init(guiParent);
  }

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('fileTitle'));

      // scene
      menu.addTitle(TR('fileResetTitle'));
      menu.addButton(TR('fileResetSphere'), this.main_, 'resetScene');
      menu.addButton(TR('fileResetScene'), this.main_, 'clearScene');

      // import
      menu.addTitle(TR('fileImportTitle'));
      menu.addButton(TR('fileAdd'), this, 'addFile');

      // export
      menu.addTitle(TR('fileExportSceneTitle'));
      menu.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ');
      menu.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
      menu.addTitle(TR('fileExportMeshTitle'));
      menu.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
      menu.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
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