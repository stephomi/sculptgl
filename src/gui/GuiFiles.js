import TR from 'gui/GuiTR';
import { saveAs } from 'file-saver';
import { zip } from 'zip';
import Export from 'files/Export';
// import { SketchfabOAuth2 } from 'sketchfab-oauth2-1.0.0'; // webpack warning
var SketchfabOAuth2 = require('sketchfab-oauth2-1.0.0.js').SketchfabOAuth2;

class GuiFiles {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this._parent = guiParent;
    this._exportAll = true;
    this.init(guiParent);
  }

  init(guiParent) {
    var menu = this._menu = guiParent.addMenu(TR('fileTitle'));

    // import
    menu.addTitle(TR('fileImportTitle'));
    menu.addButton(TR('fileAdd'), this, 'addFile' /*, 'CTRL+O/I'*/ );
    menu.addCheckbox(TR('fileAutoMatrix'), this._main, '_autoMatrix');
    menu.addCheckbox(TR('fileVertexSRGB'), this._main, '_vertexSRGB');

    // export
    menu.addTitle(TR('fileExportSceneTitle'));
    menu.addCheckbox(TR('fileExportAll'), this, '_exportAll');
    menu.addButton(TR('fileExportSGL'), this, 'saveFileAsSGL');
    menu.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ' /*, 'CTRL+E'*/ );
    menu.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
    menu.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
    menu.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
  }

  addFile() {
    document.getElementById('fileopen').click();
  }

  _getExportMeshes() {
    if (this._exportAll) return this._main.getMeshes();
    var selected = this._main.getSelectedMeshes();
    return selected.length ? selected : undefined;
  }

  saveFileAsSGL() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportSGL(meshes, this._main), 'yourMesh.sgl');
  }

  saveFileAsOBJ() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportOBJ(meshes), 'yourMesh.obj');
  }

  saveFileAsPLY() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportBinaryPLY(meshes), 'yourMesh.ply');
  }

  saveFileAsSTL() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportBinarySTL(meshes), 'yourMesh.stl');
  }

  _save(data, fileName, useZip) {
    if (!useZip) return saveAs(data, fileName);

    zip.useWebWorkers = true;
    zip.workerScriptsPath = 'worker/';
    zip.createWriter(new zip.BlobWriter('application/zip'), function (zipWriter) {
      zipWriter.add(fileName, new zip.BlobReader(data), function () {
        zipWriter.close(function (blob) {
          saveAs(blob, 'yourMesh.zip');
        });
      });
    }, onerror);
  }

  exportSketchfab() {
    var mesh = this._main.getMesh();
    if (!mesh)
      return;

    if (!window.sketchfabOAuth2Config)
      return;

    var ctrlNotif = this._ctrlGui.getWidgetNotification();
    if (this._sketchfabXhr && ctrlNotif.sketchfab === true) {
      if (!window.confirm(TR('sketchfabAbort')))
        return;
      ctrlNotif.sketchfab = false;
      this._sketchfabXhr.abort();
    }

    var client = new SketchfabOAuth2(window.sketchfabOAuth2Config);
    client.connect().then(function onSuccess(grant) {
      this._sketchfabXhr = Export.exportSketchfab(this._main, grant, ctrlNotif);
    }.bind(this)).catch(function onError(error) {
      console.error(error);
    });
  }

  ////////////////
  // KEY EVENTS
  ////////////////
  onKeyDown(event) {
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
      this.saveFileAsOBJ();
      event.handled = true;
    }
  }
}

export default GuiFiles;
