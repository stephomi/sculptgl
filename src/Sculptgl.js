define([
  'misc/Utils',
  'editor/Sculpt',
  'gui/Gui',
  'scene/Scene',
  'states/States',
  'render/Render',
  'mesh/multiresolution/Multimesh'
], function (Utils, Sculpt, Gui, Scene, States, Render, Multimesh) {

  'use strict';

  function SculptGL() {
    this.gl_ = null; // webgl context
    this.canvas_ = document.getElementById('canvas');

    // controllers stuffs
    this.mouseX_ = 0; // the x position
    this.mouseY_ = 0; // the y position
    this.lastMouseX_ = 0; // the last x position
    this.lastMouseY_ = 0; // the last y position
    this.sumDisplacement_ = 0; // sum of the displacement mouse
    this.mouseButton_ = 0; // which mouse button is pressed

    // core of the app
    this.states_ = new States(); // for undo-redo
    this.sculpt_ = new Sculpt(this.states_); // sculpting management
    this.scene_ = null; // the scene
    this.mesh_ = null; // the selected mesh

    // ui stuffs
    this.gui_ = new Gui(this); // gui
    this.focusGui_ = false; // gui
  }

  SculptGL.prototype = {
    /** Initialization */
    start: function () {
      this.initWebGL();
      this.scene_ = new Scene(this, this.gl_);
      this.gui_.initGui();
      this.scene_.onCanvasResize();
      this.initEvents();
    },
    /** Set the canvas position */
    setCanvasPosition: function () {
      if (this.scene_) this.scene_.onCanvasResize();
    },
    /** Initialize */
    initEvents: function () {
      var canvas = document.getElementById('canvas');
      var mouseThrottled = Utils.throttle(this.onMouseMove.bind(this), 16.66);
      canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
      canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
      canvas.addEventListener('mouseout', this.onMouseUp.bind(this), false);
      canvas.addEventListener('mousemove', mouseThrottled, false);
      canvas.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);
      canvas.addEventListener('DOMMouseScroll', this.onMouseWheel.bind(this), false);
      canvas.addEventListener('webglcontextlost', this.onContextLost, false);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
    },
    /** Load webgl context */
    initWebGL: function () {
      // TODO : add an option to toggle antialias if possible ?
      var attributes = {
        antialias: true,
        stencil: true
      };
      var canvas = document.getElementById('canvas');
      var gl = this.gl_ = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
      if (!gl) {
        window.alert('Could not initialise WebGL. You should try Chrome or Firefox.');
      }
      if (gl) {
        if (!gl.getExtension('OES_element_index_uint')) {
          Render.ONLY_DRAW_ARRAYS = true;
        }
        gl.viewportWidth = window.innerWidth;
        gl.viewportHeight = window.innerHeight;
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
    },
    /** WebGL context is lost */
    onContextLost: function () {
      window.alert('shit happens : context lost');
    },
    /** WebGL context is restored */
    onContextRestored: function () {
      window.alert('context is restored');
    },
    /** Mouse released event */
    onMouseUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.canvas_.style.cursor = 'default';
      this.mouseButton_ = 0;
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this.scene_.render();
    },
    /** Mouse wheel event */
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var delta = Math.max(-1.0, Math.min(1.0, (event.wheelDelta || -event.detail)));
      this.scene_.getCamera().zoom(delta * 0.02);
      Multimesh.RENDER_HINT = Multimesh.CAMERA;
      this.scene_.render();
    },
    /** Set mouse position from event */
    setMousePosition: function (event) {
      this.mouseX_ = event.offsetX === undefined ? event.layerX : event.offsetX;
      this.mouseY_ = event.offsetY === undefined ? event.layerY : event.offsetY;
    },
    /** Mouse pressed event */
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.setMousePosition(event);
      var mouseX = this.mouseX_;
      var mouseY = this.mouseY_;
      var button = this.mouseButton_ = event.which;
      if (button === 1 && !event.altKey) {
        if (this.mesh_) {
          this.sumDisplacement_ = 0;
          this.sculpt_.start(this);
        }
      }
      var scene = this.scene_;
      var picking = scene.getPicking();
      if (button === 1 && picking.mesh_)
        this.canvas_.style.cursor = 'none';
      if (button === 3 || (button === 1 && picking.mesh_ === null) || (event.altKey && button !== 0)) {
        this.mouseButton_ = 3;
        var camera = scene.getCamera();
        if (camera.usePivot_)
          picking.intersectionMouseMeshes(scene.meshes_, mouseX, mouseY);
        camera.start(mouseX, mouseY, picking);
      }
    },
    /** Mouse move event */
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.setMousePosition(event);
      var mouseX = this.mouseX_;
      var mouseY = this.mouseY_;
      var button = this.mouseButton_;
      var scene = this.scene_;
      var sculpt = this.sculpt_;
      var camera = scene.getCamera();
      var meshes = this.scene_.meshes_;
      if (this.mesh_ && (button !== 1 || sculpt.allowPicking())) {
        Multimesh.RENDER_HINT = Multimesh.PICKING;
        if (button === 1)
          scene.getPicking().intersectionMouseMesh(this.mesh_, mouseX, mouseY);
        else
          scene.getPicking().intersectionMouseMeshes(meshes, mouseX, mouseY);
        if (this.sculpt_.getSymmetry() && this.mesh_)
          scene.getSymmetryPicking().intersectionMouseMesh(this.mesh_, mouseX, mouseY, true);
      }
      if (button === 1 && !event.altKey) {
        Multimesh.RENDER_HINT = Multimesh.SCULPT;
        sculpt.update(this);
      } else {
        if (button === 2 || (event.altKey && event.shiftKey && button !== 0)) {
          camera.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        } else if (event.altKey && event.ctrlKey && button !== 0) {
          camera.zoom((mouseY - this.lastMouseY_) / 3000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        } else if (button === 3 || (event.altKey && !event.shiftKey && !event.ctrlKey && button !== 0)) {
          camera.rotate(mouseX, mouseY);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        }
      }
      this.lastMouseX_ = mouseX;
      this.lastMouseY_ = mouseY;
      scene.render();
    },
    /** Replace a mesh in the scene */
    replaceMesh: function (mesh, newMesh) {
      var meshes = this.scene_.meshes_;
      for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
        var testMesh = meshes[i];
        // a bit ugly... but when we convert a Mesh to a Multimesh
        // we should consider the mesh as equal (an uniqueID would be cleaner...)
        if (testMesh === mesh || (testMesh.getMeshOrigin && testMesh.getMeshOrigin() === mesh)) {
          meshes[i] = newMesh;
          break;
        }
      }
      this.mesh_ = newMesh;
    }
  };

  return SculptGL;
});