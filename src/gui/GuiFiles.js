define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var saveAs = require('lib/FileSaver');
  var Export = require('files/Export');

  var GuiFiles = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this._parent = guiParent;
    this.init(guiParent);
  };

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('fileTitle'));

      // import
      menu.addTitle(TR('fileImportTitle'));
      menu.addButton(TR('fileAdd'), this, 'addFile' /*, 'CTRL+O/I'*/ );
      menu.addCheckbox(TR('fileAutoMatrix'), this._main, '_autoMatrix');
      menu.addCheckbox(TR('fileVertexSRGB'), this._main, '_vertexSRGB');

      // export
      menu.addTitle(TR('fileExportSceneTitle'));
      menu.addButton(TR('fileExportSGL'), this, 'saveFileAsSGL');
      menu.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ' /*, 'CTRL+(Alt)+E'*/ );
      menu.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
      menu.addTitle(TR('fileExportMeshTitle'));
      menu.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
      menu.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
    },
    addFile: function () {
      document.getElementById('fileopen').click();
    },
    saveFileAsSGL: function () {
      if (this._main.getMeshes().length === 0) return;
      var blob = Export.exportSGL(this._main.getMeshes(), this._main);
      saveAs(blob, 'yourMesh.sgl');
    },
    saveFileAsOBJ: function (selection) {
      var meshes = this._main.getMeshes();
      if (meshes.length === 0) return;
      if (selection) {
        meshes = this._main.getSelectedMeshes();
        if (!meshes[0]) return;
      }
      var blob = Export.exportOBJ(meshes);
      saveAs(blob, 'yourMesh.obj');
    },
    saveFileAsPLY: function () {
      var mesh = this._main.getMesh();
      if (!mesh) return;
      var blob = Export.exportBinaryPLY(mesh);
      saveAs(blob, 'yourMesh.ply');
    },
    saveFileAsSTL: function () {
      var mesh = this._main.getMesh();
      if (!mesh) return;
      var blob = Export.exportBinarySTL(mesh);
      saveAs(blob, 'yourMesh.stl');
    },
    exportSketchfab: function () {
      var mesh = this._main.getMesh();
      if (!mesh)
        return;

      var ctrlNotif = this._ctrlGui.getWidgetNotification();
      if (this._sketchfabXhr && ctrlNotif.sketchfab === true) {
        if (!window.confirm(TR('sketchfabAbort')))
          return;
        ctrlNotif.sketchfab = false;
        this._sketchfabXhr.abort();
      }

      var api = window.prompt(TR('sketchfabUploadMessage'), 'guest');
      if (!api)
        return;

      var key = api === 'guest' ? 'babc9a5cd4f343f9be0c7bd9cf93600c' : api;
      this._sketchfabXhr = Export.exportSketchfab(this._main, key, ctrlNotif);
    },
    ////////////////
    // KEY EVENTS
    //////////////// 
    onKeyDown: function (event) {
      if (event.handled === true)
        return;

      event.stopPropagation();
      if (!this._main._focusGui)
        event.preventDefault();

      var key = event.which;
      if (event.ctrlKey && event.altKey && key === 78) { // N
        this._main.clearScene();
        event.handled = true;

      } else if (event.ctrlKey && (key === 79 || key === 73)) { // O or I
        this.addFile();
        event.handled = true;

      } else if (event.ctrlKey && key === 69) { // E 
        this.saveFileAsOBJ(event.altKey);
        event.handled = true;
      }
    }
  };

  module.exports = GuiFiles;
});