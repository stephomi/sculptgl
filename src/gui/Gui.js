define([
  'lib/Dat',
  'gui/GuiBackground',
  'gui/GuiCamera',
  'gui/GuiConfig',
  'gui/GuiFiles',
  'gui/GuiMesh',
  'gui/GuiMultiresolution',
  'gui/GuiRendering',
  'gui/GuiRemesh',
  'gui/GuiSculpting',
  'gui/GuiStates',
  'gui/GuiTablet'
], function (Dat, GuiBackground, GuiCamera, GuiConfig, GuiFiles, GuiMesh, GuiMultiresolution, GuiRendering, GuiRemesh, GuiSculpting, GuiStates, GuiTablet) {

  'use strict';

  function Gui(sculptgl) {
    this.sculptgl_ = sculptgl; // main application

    this.ctrlTablet_ = null; // tablet controller
    this.ctrlFiles_ = null; // files controller
    this.ctrlStates_ = null; // history controller
    this.ctrlCamera_ = null; // camera controller
    this.ctrlBackground_ = null; // background controller

    this.ctrlMesh_ = null; // mesh controller
    this.ctrlSculpting_ = null; // sculpting controller
    this.ctrlRemesh_ = null; // remesh controller
    this.ctrlMultiresolution_ = null; // multiresolution controller
    this.ctrlRendering_ = null; // rendering controller

    this.guiGeneral_ = null; // gui general
    this.guiEditing_ = null; // gui editing
  }

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      this.deleteGui();

      var guiGeneral = this.guiGeneral_ = new Dat.GUI();
      // put it on the left
      var style = guiGeneral.domElement.style;
      if (style.float !== undefined) style.float = 'left';
      else if (style.cssFloat !== undefined) style.cssFloat = 'left';
      this.initGeneralGui(guiGeneral);

      var guiEditing = this.guiEditing_ = new Dat.GUI();
      this.initEditingGui(guiEditing);

      var main = this.sculptgl_;
      guiGeneral.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, true);
      guiEditing.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, true);
      guiGeneral.domElement.addEventListener('mouseover', function () {
        main.focusGui_ = true;
      }, true);
      guiEditing.domElement.addEventListener('mouseover', function () {
        main.focusGui_ = true;
      }, true);
      this.updateMesh();
    },
    /** Initialize the general gui (on the left) */
    initGeneralGui: function (gui) {
      this.ctrlConfig_ = new GuiConfig(gui, this);
      this.ctrlTablet_ = new GuiTablet(gui);
      this.ctrlFiles_ = new GuiFiles(gui, this);
      this.ctrlStates_ = new GuiStates(gui, this);
      this.ctrlCamera_ = new GuiCamera(gui, this);
      this.ctrlBackground_ = new GuiBackground(gui, this);
      this.ctrlMesh_ = new GuiMesh(gui, this);
    },
    /** Initialize the mesh editing gui (on the right) */
    initEditingGui: function (gui) {
      this.ctrlRemesh_ = new GuiRemesh(gui, this);
      this.ctrlMultiresolution_ = new GuiMultiresolution(gui, this);
      this.ctrlSculpting_ = new GuiSculpting(gui, this);
      this.ctrlRendering_ = new GuiRendering(gui, this);
    },
    /** Update information on mesh */
    updateMesh: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      this.ctrlRendering_.updateMesh(mesh);
      this.ctrlMultiresolution_.updateMeshResolution(mesh);
      this.updateMeshInfo(mesh);
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function (mesh) {
      this.ctrlMesh_.updateMeshInfo(mesh);
    },
    /** Return true if flat shading is enabled */
    getFlatShading: function () {
      return this.ctrlRendering_.getFlatShading();
    },
    /** Return true if wireframe is displayed */
    getWireframe: function () {
      return this.ctrlRendering_.getWireframe();
    },
    /** Return the value of the shader */
    getShader: function () {
      return this.ctrlRendering_.getShader();
    },
    /** Delete the old gui */
    deleteGui: function () {
      if (!this.guiGeneral_ && !this.guiEditing_)
        return;
      if (this.guiGeneral_) this.guiGeneral_.destroy();
      if (this.guiEditing_) this.guiEditing_.destroy();

      if (this.ctrlTablet_ && this.ctrlTablet_.removeEvents) this.ctrlTablet_.removeEvents();
      if (this.ctrlFiles_ && this.ctrlFiles_.removeEvents) this.ctrlFiles_.removeEvents();
      if (this.ctrlStates_ && this.ctrlStates_.removeEvents) this.ctrlStates_.removeEvents();
      if (this.ctrlCamera_ && this.ctrlCamera_.removeEvents) this.ctrlCamera_.removeEvents();
      if (this.ctrlBackground_ && this.ctrlBackground_.removeEvents) this.ctrlBackground_.removeEvents();

      if (this.ctrlMesh_ && this.ctrlMesh_.removeEvents) this.ctrlMesh_.removeEvents();
      if (this.ctrlSculpting_ && this.ctrlSculpting_.removeEvents) this.ctrlSculpting_.removeEvents();
      if (this.ctrlRemesh_ && this.ctrlRemesh_.removeEvents) this.ctrlRemesh_.removeEvents();
      if (this.ctrlMultiresolution_ && this.ctrlMultiresolution_.removeEvents) this.ctrlMultiresolution_.removeEvents();
      if (this.ctrlRendering_ && this.ctrlRendering_.removeEvents) this.ctrlRendering_.removeEvents();
    }
  };

  return Gui;
});