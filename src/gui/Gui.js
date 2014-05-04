define([
  'lib/Dat',
  'gui/GuiBackground',
  'gui/GuiCamera',
  'gui/GuiFiles',
  'gui/GuiStates',
  'gui/GuiTablet',
  'gui/GuiMultiresolution',
  'gui/GuiRendering',
  'gui/GuiSculpting'
], function (Dat, GuiBackground, GuiCamera, GuiFiles, GuiStates, GuiTablet, GuiMultiresolution, GuiRendering, GuiSculpting) {

  'use strict';

  function Gui(sculptgl) {
    this.sculptgl_ = sculptgl; // main application

    this.ctrlTablet_ = null; // tablet controller
    this.ctrlFiles_ = null; // files controller
    this.ctrlStates_ = null; // history controller
    this.ctrlCamera_ = null; // camera controller
    this.ctrlBackground_ = null; // background controller

    this.ctrlSculpting_ = null; // sculpting controller
    this.ctrlMultiresolution_ = null; // multiresolution controller
    this.ctrlRendering_ = null; // rendering controller
  }

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      var guiGeneral = new Dat.GUI();
      guiGeneral.domElement.style.position = 'absolute';
      guiGeneral.domElement.style.height = '650px';
      this.initGeneralGui(guiGeneral);

      var guiEditing = new Dat.GUI();
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
    },
    /** Initialize the general gui (on the left) */
    initGeneralGui: function (gui) {
      this.ctrlTablet_ = new GuiTablet(gui);
      this.ctrlFiles_ = new GuiFiles(gui, this);
      this.ctrlStates_ = new GuiStates(gui, this);
      this.ctrlCamera_ = new GuiCamera(gui, this);
      this.ctrlBackground_ = new GuiBackground(gui, this);
    },
    /** Initialize the mesh editing gui (on the right) */
    initEditingGui: function (gui) {
      this.ctrlSculpting_ = new GuiSculpting(gui, this);
      this.ctrlMultiresolution_ = new GuiMultiresolution(gui, this);
      this.ctrlRendering_ = new GuiRendering(gui, this);
    },
    /** Update information on mesh */
    updateMesh: function () {
      var mesh = this.sculptgl_.mesh_;
      if (!mesh)
        return;
      this.ctrlRendering_.updateMesh(mesh);
      this.updateMeshInfo(mesh);
      this.ctrlMultiresolution_.updateMeshResolution(mesh);
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function (mesh) {
      this.ctrlRendering_.ctrlNbVertices_.name('Ver : ' + mesh.getNbVertices());
      this.ctrlRendering_.ctrlNbTriangles_.name('Tri : ' + mesh.getNbTriangles());
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
    }
  };

  return Gui;
});