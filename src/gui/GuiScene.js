define([
  'gui/GuiTR',
  'editor/Remesh',
  'render/shaders/ShaderBase'
], function (TR, Remesh, ShaderBase) {

  'use strict';

  var GuiScene = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._hideMeshes = [];
    this._cbToggleShowHide = this.toggleShowHide.bind(this, true);
    this.init(guiParent);
  };

  GuiScene.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = guiParent.addMenu(TR('sceneTitle'));

      // scene
      menu.addButton(TR('sceneReset'), this._main, 'clearScene' /*, 'CTRL+ALT+N'*/ );
      menu.addButton(TR('sceneAddSphere'), this._main, 'addSphere');
      menu.addButton(TR('sceneAddCube'), this._main, 'addCube');

      // selection stuffs
      menu.addTitle(TR('sceneSelection'));
      menu.addCheckbox(TR('contourShow'), this._main._showContour, this.onShowContour.bind(this));
      this._ctrlIsolate = menu.addCheckbox(TR('renderingIsolate'), false, this.showHide.bind(this));
      this._ctrlIsolate.setVisibility(false);
      this._ctrlMerge = menu.addButton(TR('sceneMerge'), this, 'merge');
      this._ctrlMerge.setVisibility(false);

      // extra
      menu.addTitle(TR('renderingExtra'));
      menu.addCheckbox(TR('renderingGrid'), this._main._showGrid, this.onShowGrid.bind(this));
      menu.addCheckbox(TR('renderingSymmetryLine'), ShaderBase.showSymmetryLine, this.onShowSymmetryLine.bind(this));

      this.addEvents();
    },
    updateMesh: function () {
      var showSelect = this._main.getSelectedMeshes().length > 1;
      this._ctrlIsolate.setVisibility(showSelect);
      this._ctrlMerge.setVisibility(showSelect);
    },
    merge: function () {
      var main = this._main;
      var selMeshes = main.getSelectedMeshes();
      if (selMeshes.length < 2) return;

      var newMesh = Remesh.mergeMeshes(selMeshes, main.getMesh() || selMeshes[0]);
      main.removeMeshes(selMeshes);
      main.getStates().pushStateAddRemove(newMesh, selMeshes.slice());
      main.getMeshes().push(newMesh);
      main.setMesh(newMesh);
    },
    addEvents: function () {
      var cbKeyDown = this.onKeyDown.bind(this);
      window.addEventListener('keydown', cbKeyDown, false);
      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
      };
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    onKeyDown: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (!this._main._focusGui)
        event.preventDefault();
      var key = event.which;
      if (key === 73) { // I
        this.toggleShowHide();
        event.handled = true;
      }
    },
    toggleShowHide: function (ignoreCB) {
      this._ctrlIsolate.setValue(!this._ctrlIsolate.getValue(), !!ignoreCB);
    },
    showHide: function (bool) {
      if (bool) this.isolate();
      else this.showAll();
    },
    isolate: function () {
      var main = this._main;
      var selMeshes = main.getSelectedMeshes();
      var meshes = main.getMeshes();
      if (meshes.length === selMeshes.length || meshes.length < 2) {
        this._ctrlIsolate.setValue(false, true);
        return;
      }

      var hMeshes = this._hideMeshes;
      hMeshes.length = 0;
      for (var i = 0; i < meshes.length; ++i) {
        var id = main.getIndexSelectMesh(meshes[i]);
        if (id < 0) {
          hMeshes.push(meshes[i]);
          meshes.splice(i--, 1);
        }
      }

      main.getStates().pushStateRemove(hMeshes.slice());
      main.getStates().pushStateCustom(this._cbToggleShowHide, this._cbToggleShowHide, true);
    },
    showAll: function () {
      var main = this._main;
      var meshes = main.getMeshes();
      var hMeshes = this._hideMeshes;
      for (var i = 0, nbAdd = hMeshes.length; i < nbAdd; ++i) {
        meshes.push(hMeshes[i]);
      }
      main.getStates().pushStateAdd(hMeshes.slice());
      main.getStates().pushStateCustom(this._cbToggleShowHide, this._cbToggleShowHide, true);
      hMeshes.length = 0;
    },
    onShowSymmetryLine: function (val) {
      ShaderBase.showSymmetryLine = val;
      this._main.render();
    },
    onShowGrid: function (bool) {
      var main = this._main;
      main._showGrid = bool;
      main.render();
    },
    onShowContour: function (bool) {
      var main = this._main;
      main._showContour = bool;
      main.render();
    }
  };

  return GuiScene;
});