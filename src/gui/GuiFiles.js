import TR from 'gui/GuiTR';
import { saveAs } from 'file-saver';
import { zip } from 'zip';
import Export from 'files/Export';

import Rtt from 'drawables/Rtt';
import ShaderPaintUV from 'render/shaders/ShaderPaintUV';
import ShaderBlur from 'render/shaders/ShaderBlur';
import Enums from 'misc/Enums';

class GuiFiles {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this._parent = guiParent;
    this._exportAll = true;

    this._objColorZbrush = true;
    this._objColorAppended = false;
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
    menu.addCheckbox('OBJ color zbrush', this, '_objColorZbrush');
    menu.addCheckbox('OBJ color append', this, '_objColorAppended');
    menu.addButton(TR('sketchfabTitle'), this._ctrlGui, 'exportSketchfab');

    // export texture
    menu.addTitle(TR('fileExportTextureTitle'));
    this._guiTexSize = menu.addSlider(TR('fileExportTextureSize'), 10, this.onTextureSize.bind(this), 8, 12, 1);
    this._guiTexSize.setValue(10);
    menu.addButton(TR('fileExportColor'), this, 'saveColor');
    menu.addButton(TR('fileExportRoughness'), this, 'saveRoughness');
    menu.addButton(TR('fileExportMetalness'), this, 'saveMetalness');
  }

  addFile() {
    document.getElementById('fileopen').click();
  }

  onTextureSize(value) {
    this._texSize = 1 << value;
    this._guiTexSize.domInputText.value = this._texSize;
  }

  _getExportMeshes() {
    if (this._exportAll) return this._main.getMeshes();
    var selected = this._main.getSelectedMeshes();
    return selected.length ? selected : undefined;
  }

  _extractTexture(gl, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    var pixels = new Uint8Array(4 * width * height);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('FRAMEBUFFER not complete');
      return canvas;
    }

    gl.flush();
    gl.finish();
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // copy pixels to canvas pixels (inverted image)
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  _getRttPaint(gl) {
    if (!this._rttPaint) {
      this._rttPaint = new Rtt(gl, Enums.Shader.PAINTUV, null);
      this._rttPaint.setWrapRepeat(true);
      this._rttPaint.setFilterNearest(true);
      ShaderBlur.INPUT_TEXTURE = this._getRttPaint();
    }
    return this._rttPaint;
  }

  _getRttBlur(gl) {
    if (!this._rttBlur) {
      this._rttBlur = new Rtt(gl, Enums.Shader.BLUR, null);
    }
    return this._rttBlur;
  }

  _saveTexture(filename) {
    var mesh = this._main.getMesh();
    if (!mesh) {
      return;
    }

    if (!mesh.getTexCoords()) {
      window.alert('The selected mesh has no UV!');
      return;
    }

    var gl = mesh.getGL();

    var width = this._texSize;
    var height = this._texSize;

    var tmpShaderType = mesh.getShaderType();
    mesh.setShaderType(Enums.Shader.PAINTUV);

    var rttPaint = this._getRttPaint(gl);
    rttPaint.onResize(width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttPaint.getFramebuffer());
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, width, height);
    mesh.render();

    mesh.setShaderType(tmpShaderType);

    this._blurImage(gl, width, height);

    var canvas = this._extractTexture(gl, width, height);
    canvas.toBlob(function (blob) {
      saveAs(blob, filename + '.png');
    }.bind(this));

    // reset viewport size
    this._main.onCanvasResize();
  }

  _blurImage(gl, width, height) {
    var rttBlur = this._getRttBlur(gl);
    rttBlur.onResize(width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttBlur.getFramebuffer());
    gl.clear(gl.COLOR_BUFFER_BIT);

    rttBlur.render(this._main);
  }

  saveColor() {
    ShaderPaintUV.CHANNEL_VALUE = 0;
    this._saveTexture('diffuse');
  }

  saveRoughness() {
    ShaderPaintUV.CHANNEL_VALUE = 1;
    this._saveTexture('roughness');
  }

  saveMetalness() {
    ShaderPaintUV.CHANNEL_VALUE = 2;
    this._saveTexture('metalness');
  }

  saveFileAsSGL() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportSGL(meshes, this._main), 'yourMesh.sgl');
  }

  saveFileAsOBJ() {
    var meshes = this._getExportMeshes();
    if (!meshes) return;
    this._save(Export.exportOBJ(meshes, this._objColorZbrush, this._objColorAppended), 'yourMesh.obj');
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
