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
  'gui/GuiTablet',
  'render/shaders/ShaderContour',
  'misc/getUrlOptions'
], function (yagui, TR, GuiBackground, GuiCamera, GuiConfig, GuiFiles, GuiMesh, GuiTopology, GuiRendering, GuiScene, GuiSculpting, GuiStates, GuiTablet, ShaderContour, getUrlOptions) {

  'use strict';

  var Gui = function (main) {
    this._main = main;

    this._guiMain = null;
    this._sidebar = null;
    this._topbar = null;

    this._ctrlTablet = null;
    this._ctrlFiles = null;
    this._ctrlScene = null;
    this._ctrlStates = null;
    this._ctrlCamera = null;
    this._ctrlBackground = null;

    this._ctrlSculpting = null;
    this._ctrlTopology = null;
    this._ctrlRendering = null;

    this._ctrlNotification = null;

    this._ctrls = []; // list of controllers
  };

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      this.deleteGui();

      this._guiMain = new yagui.GuiMain(this._main.getCanvas(), this._main.onCanvasResize.bind(this._main));

      var ctrls = this._ctrls;
      ctrls.length = 0;
      var idc = 0;

      // Initialize the topbar
      this._topbar = this._guiMain.addTopbar();
      ctrls[idc++] = this._ctrlFiles = new GuiFiles(this._topbar, this);
      ctrls[idc++] = this._ctrlScene = new GuiScene(this._topbar, this);
      ctrls[idc++] = this._ctrlStates = new GuiStates(this._topbar, this);
      ctrls[idc++] = this._ctrlBackground = new GuiBackground(this._topbar, this);
      ctrls[idc++] = this._ctrlCamera = new GuiCamera(this._topbar, this);
      // TODO find a way to get pressure event
      if (getUrlOptions().wacom)
        ctrls[idc++] = this._ctrlTablet = new GuiTablet(this._topbar, this);
      ctrls[idc++] = this._ctrlConfig = new GuiConfig(this._topbar, this);
      ctrls[idc++] = this._ctrlMesh = new GuiMesh(this._topbar, this);

      // Initialize the sidebar
      this._sidebar = this._guiMain.addRightSidebar();
      ctrls[idc++] = this._ctrlRendering = new GuiRendering(this._sidebar, this);
      ctrls[idc++] = this._ctrlTopology = new GuiTopology(this._sidebar, this);
      ctrls[idc++] = this._ctrlSculpting = new GuiSculpting(this._sidebar, this);

      // gui extra
      var extra = this._topbar.addExtra();
      // Extra : Настройка интерфейса
      extra.addTitle(TR('contour'));
      extra.addColor(TR('contourColor'), ShaderContour.color, this.onContourColor.bind(this));

      this.addDonateButton();

      this.updateMesh();
      this.setVisibility(true);
    },
    onContourColor: function (col) {
      ShaderContour.color[0] = col[0];
      ShaderContour.color[1] = col[1];
      ShaderContour.color[2] = col[2];
      ShaderContour.color[3] = col[3];
      this._main.render();
    },
    addDonateButton: function () {
      var ctrlDonate = this._topbar.addMenu();
      ctrlDonate.domContainer.innerHTML = TR('donate');
      ctrlDonate.domContainer.addEventListener('mousedown', function () {
        document.getElementById('donate').submit();
      });
    },
    /** Return simple widget */
    getWidgetNotification: function () {
      if (!this._ctrlNotification) {
        this._ctrlNotification = this._topbar.addMenu();
        this._ctrlNotification.setVisibility(false);
      }
      return this._ctrlNotification;
    },
    /** Update information on mesh */
    updateMesh: function () {
      this._ctrlRendering.updateMesh();
      this._ctrlTopology.updateMesh();
      this._ctrlSculpting.updateMesh();
      this._ctrlScene.updateMesh();
      this.updateMeshInfo();
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function () {
      this._ctrlMesh.updateMeshInfo();
    },
    /** Return true if flat shading is enabled */
    getFlatShading: function () {
      return this._ctrlRendering.getFlatShading();
    },
    /** Return true if wireframe is displayed */
    getWireframe: function () {
      return this._ctrlRendering.getWireframe();
    },
    /** Return the value of the shader */
    getShader: function () {
      return this._ctrlRendering.getShader();
    },
    addEvents: function () {
      for (var i = 0, ctrls = this._ctrls, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        if (ct && ct.addEvents)
          ct.addEvents();
      }
    },
    removeEvents: function () {
      for (var i = 0, ctrls = this._ctrls, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        if (ct && ct.removeEvents)
          ct.removeEvents();
      }
    },
    addAlphaOptions: function (opts) {
      this._ctrlSculpting.addAlphaOptions(opts);
    },
    /** Delete the old gui */
    deleteGui: function () {
      if (!this._guiMain || !this._guiMain.domMain.parentNode)
        return;
      this.removeEvents();
      this.setVisibility(false);
      this._guiMain.domMain.parentNode.removeChild(this._guiMain.domMain);
    },
    setVisibility: function (bool) {
      this._guiMain.setVisibility(bool);
    }
  };

  return Gui;
});