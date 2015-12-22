define(function (require, exports, module) {

  'use strict';

  var yagui = require('lib/yagui');
  var TR = require('gui/GuiTR');
  var GuiBackground = require('gui/GuiBackground');
  var GuiCamera = require('gui/GuiCamera');
  var GuiConfig = require('gui/GuiConfig');
  var GuiFiles = require('gui/GuiFiles');
  var GuiMesh = require('gui/GuiMesh');
  var GuiTopology = require('gui/GuiTopology');
  var GuiRendering = require('gui/GuiRendering');
  var GuiScene = require('gui/GuiScene');
  var GuiSculpting = require('gui/GuiSculpting');
  var GuiStates = require('gui/GuiStates');
  var GuiTablet = require('gui/GuiTablet');
  var ShaderContour = require('render/shaders/ShaderContour');
  var getOptionsURL = require('misc/getOptionsURL');

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
    initGui: function () {
      this.deleteGui();

      this._guiMain = new yagui.GuiMain(this._main.getViewport(), this._main.onCanvasResize.bind(this._main));

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
      if (getOptionsURL().wacom) ctrls[idc++] = this._ctrlTablet = new GuiTablet(this._topbar, this);
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

      extra.addTitle(TR('resolution'));
      extra.addSlider('', this._main._pixelRatio, this.onPixelRatio.bind(this), 0.5, 2.0, 0.02);

      this.addAboutButton();

      this.updateMesh();
      this.setVisibility(true);
    },
    onPixelRatio: function (val) {
      this._main._pixelRatio = val;
      this._main.onCanvasResize();
    },
    onContourColor: function (col) {
      ShaderContour.color[0] = col[0];
      ShaderContour.color[1] = col[1];
      ShaderContour.color[2] = col[2];
      ShaderContour.color[3] = col[3];
      this._main.render();
    },
    addAboutButton: function () {
      var ctrlAbout = this._topbar.addMenu();
      ctrlAbout.domContainer.innerHTML = TR('about');
      ctrlAbout.domContainer.addEventListener('mousedown', function () {
        window.open('http://stephaneginier.com', '_blank');
      });
    },
    getWidgetNotification: function () {
      if (!this._ctrlNotification) {
        this._ctrlNotification = this._topbar.addMenu();
        this._ctrlNotification.setVisibility(false);
      }
      return this._ctrlNotification;
    },
    updateMesh: function () {
      this._ctrlRendering.updateMesh();
      this._ctrlTopology.updateMesh();
      this._ctrlSculpting.updateMesh();
      this._ctrlScene.updateMesh();
      this.updateMeshInfo();
    },
    updateMeshInfo: function () {
      this._ctrlMesh.updateMeshInfo();
    },
    getFlatShading: function () {
      return this._ctrlRendering.getFlatShading();
    },
    getWireframe: function () {
      return this._ctrlRendering.getWireframe();
    },
    getShaderName: function () {
      return this._ctrlRendering.getShaderName();
    },
    addAlphaOptions: function (opts) {
      this._ctrlSculpting.addAlphaOptions(opts);
    },
    deleteGui: function () {
      if (!this._guiMain || !this._guiMain.domMain.parentNode)
        return;
      this.callFunc('removeEvents');
      this.setVisibility(false);
      this._guiMain.domMain.parentNode.removeChild(this._guiMain.domMain);
    },
    setVisibility: function (bool) {
      this._guiMain.setVisibility(bool);
    },
    callFunc: function (func, event) {
      for (var i = 0, ctrls = this._ctrls, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        if (ct && ct[func])
          ct[func](event);
      }
    }
  };

  module.exports = Gui;
});