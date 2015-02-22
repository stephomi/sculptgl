define([
  'lib/yagui',
  'gui/GuiTR',
  'gui/GuiBackground',
  'gui/GuiCamera',
  'gui/GuiConfig',
  'gui/GuiFiles',
  'gui/GuiMesh',
  'gui/GuiTopology',
  'gui/GuiRendering',
  'gui/GuiScene',
  'gui/GuiSculpting',
  'gui/GuiStates',
  'gui/GuiTablet'
], function (yagui, TR, GuiBackground, GuiCamera, GuiConfig, GuiFiles, GuiMesh, GuiTopology, GuiRendering, GuiScene, GuiSculpting, GuiStates, GuiTablet) {

  'use strict';

  var Gui = function (main) {
    this.main_ = main;

    this.guiMain_ = null;
    this.sidebar_ = null;
    this.topbar_ = null;

    this.ctrlTablet_ = null;
    this.ctrlFiles_ = null;
    this.ctrlScene_ = null;
    this.ctrlStates_ = null;
    this.ctrlCamera_ = null;
    this.ctrlBackground_ = null;

    this.ctrlSculpting_ = null;
    this.ctrlTopology_ = null;
    this.ctrlRendering_ = null;

    this.ctrlNotification_ = null;

    this.ctrls_ = []; // list of controllers
  };

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      this.deleteGui();

      this.guiMain_ = new yagui.GuiMain(this.main_.getCanvas(), this.main_.onCanvasResize.bind(this.main_));

      var ctrls = this.ctrls_;
      ctrls.length = 0;
      var idc = 0;

      // Initialize the topbar
      this.topbar_ = this.guiMain_.addTopbar();
      ctrls[idc++] = this.ctrlFiles_ = new GuiFiles(this.topbar_, this);
      ctrls[idc++] = this.ctrlScene_ = new GuiScene(this.topbar_, this);
      ctrls[idc++] = this.ctrlStates_ = new GuiStates(this.topbar_, this);
      ctrls[idc++] = this.ctrlBackground_ = new GuiBackground(this.topbar_, this);
      ctrls[idc++] = this.ctrlCamera_ = new GuiCamera(this.topbar_, this);
      ctrls[idc++] = this.ctrlTablet_ = new GuiTablet(this.topbar_, this);
      ctrls[idc++] = this.ctrlConfig_ = new GuiConfig(this.topbar_, this);
      ctrls[idc++] = this.ctrlMesh_ = new GuiMesh(this.topbar_, this);

      // Initialize the sidebar
      this.sidebar_ = this.guiMain_.addRightSidebar();
      ctrls[idc++] = this.ctrlRendering_ = new GuiRendering(this.sidebar_, this);
      ctrls[idc++] = this.ctrlTopology_ = new GuiTopology(this.sidebar_, this);
      ctrls[idc++] = this.ctrlSculpting_ = new GuiSculpting(this.sidebar_, this);

      // gui extra
      this.topbar_.addExtra();
      this.addDonateButton();

      this.updateMesh();
      this.setVisibility(true);
    },
    addDonateButton: function () {
      var ctrlDonate = this.topbar_.addMenu();
      ctrlDonate.domContainer.innerHTML = TR('donate');
      ctrlDonate.domContainer.addEventListener('mousedown', function () {
        document.getElementById('donate').submit();
      });
    },
    /** Return simple widget */
    getWidgetNotification: function () {
      if (!this.ctrlNotification_) {
        this.ctrlNotification_ = this.topbar_.addMenu();
        this.ctrlNotification_.setVisibility(false);
      }
      return this.ctrlNotification_;
    },
    /** Update information on mesh */
    updateMesh: function () {
      this.ctrlRendering_.updateMesh();
      this.ctrlTopology_.updateMesh();
      this.ctrlSculpting_.updateMesh();
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
    addEvents: function () {
      for (var i = 0, ctrls = this.ctrls_, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        if (ct && ct.addEvents)
          ct.addEvents();
      }
    },
    removeEvents: function () {
      for (var i = 0, ctrls = this.ctrls_, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        if (ct && ct.removeEvents)
          ct.removeEvents();
      }
    },
    addAlphaOptions: function (opts) {
      this.ctrlSculpting_.addAlphaOptions(opts);
    },
    /** Delete the old gui */
    deleteGui: function () {
      if (!this.guiMain_ || !this.guiMain_.domMain.parentNode)
        return;
      this.removeEvents();
      this.setVisibility(false);
      this.guiMain_.domMain.parentNode.removeChild(this.guiMain_.domMain);
    },
    setVisibility: function (bool) {
      this.guiMain_.setVisibility(bool);
    }
  };

  return Gui;
});