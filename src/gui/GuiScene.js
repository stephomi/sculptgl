define([
  'gui/GuiTR',
  'render/shaders/ShaderBase'
], function (TR, ShaderBase) {

  'use strict';

  var GuiScene = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.hideMeshes_ = [];
    this.cbToggleShowHide_ = this.toggleShowHide.bind(this, true);
    this.init(guiParent);
  };

  GuiScene.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = guiParent.addMenu(TR('sceneTitle'));

      // scene
      menu.addButton(TR('sceneReset'), this.main_, 'clearScene' /*, 'CTRL+ALT+N'*/ );
      menu.addButton(TR('sceneAddSphere'), this.main_, 'addSphere');
      menu.addButton(TR('sceneAddCube'), this.main_, 'addCube');

      menu.addTitle(TR('renderingExtra'));
      menu.addCheckbox(TR('renderingGrid'), this.main_.showGrid_, this.onShowGrid.bind(this));
      menu.addCheckbox(TR('renderingSymmetryLine'), ShaderBase.showSymmetryLine, this.onShowSymmetryLine.bind(this));
      menu.addCheckbox(TR('renderingContour'), this.main_.showContour_, this.onShowContour.bind(this));
      this.ctrlIsolate_ = menu.addCheckbox(TR('renderingIsolate'), false, this.showHide.bind(this));
      this.addEvents();
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
      if (!this.main_.focusGui_)
        event.preventDefault();
      var key = event.which;
      if (event.ctrlKey && event.altKey && key === 72) { // H
        this.toggleShowHide();
        event.handled = true;
      }
    },
    toggleShowHide: function (ignoreCB) {
      console.log(ignoreCB);
      this.ctrlIsolate_.setValue(!this.ctrlIsolate_.getValue(), !!ignoreCB);
    },
    showHide: function (bool) {
      if (bool) this.isolate();
      else this.showAll();
    },
    isolate: function () {
      var main = this.main_;
      var selMeshes = main.getSelectedMeshes();
      var meshes = main.getMeshes();
      if (meshes.length === selMeshes.length || meshes.length < 2) {
        this.ctrlIsolate_.setValue(false, true);
        return;
      }

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('ISOLATE_SELECTION');

      var hMeshes = this.hideMeshes_;
      hMeshes.length = 0;
      for (var i = 0; i < meshes.length; ++i) {
        var id = main.getIndexSelectMesh(meshes[i]);
        if (id < 0) {
          hMeshes.push(meshes[i]);
          meshes.splice(i--, 1);
        }
      }

      main.getStates().pushStateRemove(hMeshes.slice());
      main.getStates().pushStateCustom(this.cbToggleShowHide_, this.cbToggleShowHide_, true);
    },
    showAll: function () {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('SHOW_ALL');

      var meshes = main.getMeshes();
      var hMeshes = this.hideMeshes_;
      for (var i = 0, nbAdd = hMeshes.length; i < nbAdd; ++i) {
        meshes.push(hMeshes[i]);
      }
      main.getStates().pushStateAdd(hMeshes.slice());
      main.getStates().pushStateCustom(this.cbToggleShowHide_, this.cbToggleShowHide_, true);
      hMeshes.length = 0;
    },
    onShowSymmetryLine: function (val) {
      // TODO push in the replayer...
      ShaderBase.showSymmetryLine = val;
      this.main_.render();
    },
    onShowGrid: function (bool) {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('SHOW_GRID', bool);
      main.showGrid_ = bool;
      main.render();
    },
    onShowContour: function (bool) {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('SHOW_CONTOUR', bool);
      main.showContour_ = bool;
      main.render();
    }
  };

  return GuiScene;
});