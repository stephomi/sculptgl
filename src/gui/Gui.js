define([
  'lib/yagui',
  'gui/GuiBackground',
  'gui/GuiCamera',
  'gui/GuiConfig',
  'gui/GuiFiles',
  'gui/GuiMesh',
  'gui/GuiTopology',
  'gui/GuiRendering',
  'gui/GuiSculpting',
  'gui/GuiStates',
  'gui/GuiTablet'
], function (yagui, GuiBackground, GuiCamera, GuiConfig, GuiFiles, GuiMesh, GuiTopology, GuiRendering, GuiSculpting, GuiStates, GuiTablet) {

  'use strict';

  function Gui(main) {
    this.main_ = main; // main application

    this.guiMain_ = null; // the main gui
    this.sidebar_ = null; // the side bar
    this.topbar_ = null; // the top bar

    this.ctrlTablet_ = null; // tablet controller
    this.ctrlFiles_ = null; // files controller
    this.ctrlStates_ = null; // history controller
    this.ctrlCamera_ = null; // camera controller
    this.ctrlBackground_ = null; // background controller

    this.ctrlSculpting_ = null; // sculpting controller
    this.ctrlTopology_ = null; // topology controller
    this.ctrlRendering_ = null; // rendering controller
  }

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      this.deleteGui();

      this.guiMain_ = new yagui.GuiMain(this.main_.getCanvas(), this.main_.onCanvasResize.bind(this.main_));

      // Initialize the topbar
      this.topbar_ = this.guiMain_.addTopbar();
      this.ctrlFiles_ = new GuiFiles(this.topbar_, this);
      this.ctrlStates_ = new GuiStates(this.topbar_, this);
      this.ctrlBackground_ = new GuiBackground(this.topbar_, this);
      this.ctrlCamera_ = new GuiCamera(this.topbar_, this);
      this.ctrlTablet_ = new GuiTablet(this.topbar_, this);
      this.ctrlConfig_ = new GuiConfig(this.topbar_, this);
      this.ctrlMesh_ = new GuiMesh(this.topbar_, this);

      // Initialize the sidebar
      this.sidebar_ = this.guiMain_.addRightSidebar();
      this.ctrlRendering_ = new GuiRendering(this.sidebar_, this);
      this.ctrlTopology_ = new GuiTopology(this.sidebar_, this);
      this.ctrlSculpting_ = new GuiSculpting(this.sidebar_, this);

      // gui extra
      this.topbar_.addExtra();

      this.updateMesh();
    },
    /** Update information on mesh */
    updateMesh: function () {
      this.ctrlRendering_.updateMesh();
      this.ctrlTopology_.updateMeshTopology();
      this.updateMeshInfo();
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function () {
      this.ctrlMesh_.updateMeshInfo();
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
      if (!this.guiMain_)
        return;
      this.guiMain_.domMain.parentNode.removeChild(this.guiMain_.domMain);

      if (this.ctrlTablet_ && this.ctrlTablet_.removeEvents) this.ctrlTablet_.removeEvents();
      if (this.ctrlFiles_ && this.ctrlFiles_.removeEvents) this.ctrlFiles_.removeEvents();
      if (this.ctrlStates_ && this.ctrlStates_.removeEvents) this.ctrlStates_.removeEvents();
      if (this.ctrlCamera_ && this.ctrlCamera_.removeEvents) this.ctrlCamera_.removeEvents();
      if (this.ctrlBackground_ && this.ctrlBackground_.removeEvents) this.ctrlBackground_.removeEvents();

      if (this.ctrlSculpting_ && this.ctrlSculpting_.removeEvents) this.ctrlSculpting_.removeEvents();
      if (this.ctrlTopology_ && this.ctrlTopology_.removeEvents) this.ctrlTopology_.removeEvents();
      if (this.ctrlRendering_ && this.ctrlRendering_.removeEvents) this.ctrlRendering_.removeEvents();
    }
  };

  return Gui;
});