define(function (require, exports, module) {

  'use strict';

  var Rtt = require('drawables/Rtt');
  var Shader = require('sdf/Shader');
  require('render/ShaderLib').SDF = Shader;
  var GuiCamera = require('gui/GuiCamera');
  var Combinations = require('sdf/Combinations');
  var Primitives = require('sdf/Primitives');
  var Gui = require('sdf/Gui');
  var Gizmo = require('editing/Gizmo');
  var glm = require('lib/glMatrix');

  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  var MainSDF = function (main) {
    this._main = main;
    this._gl = main._gl;
    this._rttSDF = new Rtt(this._gl, 'SDF', null);

    this._rootSDF = undefined;
    this._lastPrim = undefined; // last selected primitive
    this._dirtyScene = true;

    this._initScene();
    this._hookSculptGL();
    this.onCanvasResize(main._canvasWidth, main._canvasHeight);
  };

  MainSDF.prototype = {
    _initScene: function () {
      var plane = new Primitives.PLANE();
      plane._matrix[13] -= 0.3;
      this._rootSDF = plane;
    },
    _hookSculptGL: function () {
      var main = this._main;
      main.clearScene();

      this._main.applyRender = this._applyRender.bind(this);
      this._main.onDeviceDown = this._onDeviceDown.bind(this);

      this._hookReadFile();
      this._hookCamera();
      this._hookGui();
      this._hookSculpt();
    },
    _hookReadFile: function () {
      var self = this;

      this._main.getFileType = function (name) {
        if (name.toLowerCase().endsWith('.json')) return 'json';
        return;
      };

      this._main.readFile = function (file, ftype) {
        if (ftype !== 'json')
          return;

        var reader = new FileReader();
        reader.onload = function (evt) {
          self.createRootFromJSON(evt.target.result);
          document.getElementById('fileopen').value = '';
        };

        reader.readAsText(file);
      };
    },
    _hookCamera: function () {
      var camera = this._main.getCamera();
      camera.setFov(53);
      camera.updateProjection();
      camera._sdfView = mat3.create();
      camera.setUsePivot(false);
    },
    _onDeviceDown: function (event) {
      var main = this._main;
      if (main._focusGui)
        return;

      main.setMousePosition(event);

      var mouseX = main._mouseX;
      var mouseY = main._mouseY;
      var button = event.which;

      main._sculpt.start(event.shiftKey);
      var pickedMesh = main._picking.getMesh();

      if (pickedMesh)
        main._action = 'SCULPT_EDIT';
      else if (event.ctrlKey)
        main._action = 'CAMERA_ZOOM';
      else if (event.altKey)
        main._action = 'CAMERA_PAN_ZOOM_ALT';
      else if (button === 2 || button === 3)
        main._action = 'CAMERA_PAN';
      else
        main._action = 'CAMERA_ROTATE';

      if (main._action === 'CAMERA_ROTATE' || main._action === 'CAMERA_ZOOM')
        main._camera.start(mouseX, mouseY);

      main._lastMouseX = mouseX;
      main._lastMouseY = mouseY;
    },
    _hookSculpt: function () {
      var main = this._main;
      var picking = main.getPicking();
      // force transform tool
      var sculpt = this._main.getSculpt();
      sculpt._tool = 'TRANSFORM';

      var transformTool = sculpt.getCurrentTool();
      transformTool._gizmo.setActivatedType(Gizmo.TRANS_XYZ | Gizmo.PLANE_XYZ | Gizmo.ROT_XYZ | Gizmo.ROT_W | Gizmo.SCALE_W);

      transformTool.start = function () {
        var mesh = this.getMesh();
        if (mesh && this._gizmo.onMouseDown()) {
          this.pushState();
          picking._mesh = mesh;
          return;
        }

        picking._mesh = null;
        this._lastMouseX = main._mouseX;
        this._lastMouseY = main._mouseY;
      };

      transformTool.end = function () {
        this._gizmo.onMouseUp();

        var dx = Math.abs(main._mouseX - this._lastMouseX);
        var dy = Math.abs(main._mouseY - this._lastMouseY);
        if (dx * dx + dy * dy < 4.0)
          return;

        var mesh = this.getMesh();
        if (!mesh)
          return;

        if (this.isIdentity(mesh.getEditMatrix()))
          return;

        mat4.mul(mesh.getMatrix(), mesh.getMatrix(), mesh.getEditMatrix());
        mat4.identity(mesh.getEditMatrix());
      };
    },
    _hookGui: function () {
      var main = this._main;
      var gui = main.getGui();
      for (var i = 0, ctrls = gui._ctrls, nb = ctrls.length; i < nb; ++i) {
        var ct = ctrls[i];
        // keep camera and config
        if (ct instanceof GuiCamera)
          continue;
        if (ct.removeEvents) ct.removeEvents();
        if (ct._menu) ct._menu.setVisibility(false);
        ctrls[i] = null;
      }

      gui.updateMesh = function () {};

      gui._ctrlCamera._ctrlProjectionTitle.setVisibility(false);
      gui._ctrlCamera._ctrlProjection.setVisibility(false);
      gui._ctrlCamera._ctrlPivot.setVisibility(false);
      gui._ctrlCamera._ctrlFov.setVisibility(false);

      this._sdfGUI = new Gui(this);
    },
    onCanvasResize: function (width, height) {
      this._rttSDF.onResize(width, height);
    },
    _applyRender: function () {
      var main = this._main;
      main._preventRender = false;

      var gl = this._gl;
      if (!gl)
        return;

      gl.disable(gl.DEPTH_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, main._rttMerge.getFramebuffer());
      this._rttSDF.render(main);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      main._rttOpaque.render(main); // fxaa
      main._selection.render(main);

      gl.enable(gl.DEPTH_TEST);
      main._sculpt.postRender();
    },
    createRootFromJSON: function (json) {
      var scene = JSON.parse(json);
      this._rootSDF = this._createNode(scene.root);
      this._dirtyScene = true;
      this._lastPrim = undefined;
      this._sdfGUI.applyPrimitive();
      this._sdfGUI._ctrlBlendColor.setValue(scene.blendColor);
      this._main.render();
    },
    _createNode: function (obj) {
      var type = obj.type;
      var node;

      if (Combinations[type]) {
        var op1 = this._createNode(obj.op1);
        var op2 = this._createNode(obj.op2);
        node = new Combinations[type](op1, op2);
        node.initObjectJSON(obj);

      } else if (Primitives[type]) {
        node = new Primitives[type]();
        node.initObjectJSON(obj);

      } else {
        console.error('Unknown type :', type);
      }

      return node;
    }
  };

  module.exports = MainSDF;
});