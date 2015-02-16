define([
  'gui/GuiTR',
  'lib/FileSaver',
  'files/Export'
], function (TR, saveAs, Export) {

  'use strict';

  var GuiFiles = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.ctrlGui_ = ctrlGui;
    this.menu_ = null; // ui menu
    this.parent_ = guiParent;
    this.init(guiParent);
  };

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('fileTitle'));

      // import
      menu.addTitle(TR('fileImportTitle'));
      menu.addButton(TR('fileAdd'), this, 'addFile');

      // replayer
      menu.addTitle(TR('fileReplayerTitle'));
      menu.addButton(TR('fileReplayerImport'), this, 'addFile');
      menu.addButton(TR('fileReplayerExport'), this, 'saveFileAsREP');

      // export
      menu.addTitle(TR('fileExportSceneTitle'));
      menu.addButton(TR('fileExportSGL'), this, 'saveFileAsSGL');
      menu.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ');
      this.ctrlSketchfab_ = menu.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
      menu.addTitle(TR('fileExportMeshTitle'));
      menu.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
      menu.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
    },
    /** Load file */
    addFile: function () {
      document.getElementById('fileopen').click();
    },
    /** Save file as .rep*/
    saveFileAsREP: function () {
      var rep = this.main_.getReplayWriter();
      var blob = rep.export();
      saveAs(blob, rep.uid_ + '.rep');
    },
    /** Save file as .sgl*/
    saveFileAsSGL: function () {
      if (this.main_.getMeshes().length === 0) return;
      var blob = Export.exportSGL(this.main_.getMeshes());
      saveAs(blob, 'yourMesh.sgl');
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      if (this.main_.getMeshes().length === 0) return;
      var blob = Export.exportOBJ(this.main_.getMeshes());
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var blob = Export.exportBinaryPLY(mesh);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var blob = Export.exportBinarySTL(mesh);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      var mesh = this.main_.getMesh();
      if (!mesh)
        return;

      var ctrlNotif = this.ctrlGui_.getWidgetNotification();
      if (this.sketchfabXhr_ && ctrlNotif.domContainer.hidden === false) {
        if (!window.confirm(TR('sketchfabAbort')))
          return;
        this.sketchfabXhr_.abort();
      }

      var api = window.prompt(TR('sketchfabUploadMessage'), 'guest');
      if (!api)
        return;

      var key = api === 'guest' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api;
      this.sketchfabXhr_ = Export.exportSketchfab(this.main_, key, ctrlNotif);
    }
  };

  return GuiFiles;
});