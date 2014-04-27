define([
  'lib/jQuery',
  'editor/Sculpt',
  'gui/Gui',
  'scene/Scene',
  'states/States',
  'render/Render'
], function ($, Sculpt, Gui, Scene, States, Render) {

  'use strict';

  function SculptGL() {
    this.gl_ = null; //webgl context

    //controllers stuffs
    this.mouseX_ = 0; //the x position
    this.mouseY_ = 0; //the y position
    this.lastMouseX_ = 0; //the last x position
    this.lastMouseY_ = 0; //the last y position
    this.sumDisplacement_ = 0; //sum of the displacement mouse
    this.mouseButton_ = 0; //which mouse button is pressed

    //core of the app
    this.states_ = new States(); //for undo-redo
    this.sculpt_ = new Sculpt(this.states_); //sculpting management
    this.scene_ = null;
    this.mesh_ = null; //the multiresolution mesh

    //ui stuffs
    this.gui_ = new Gui(this); //gui
    this.focusGui_ = false; //gui
  }

  SculptGL.prototype = {
    /** Initialization */
    start: function () {
      this.initWebGL();
      this.scene_ = new Scene(this, this.gl_);
      this.gui_.initGui();
      this.initEvents();
    },
    /** Initialize */
    initEvents: function () {
      var $canvas = $('#canvas');
      $canvas.mousedown(this.onMouseDown.bind(this));
      $canvas.mouseup(this.onMouseUp.bind(this));
      $canvas.mouseout(this.onMouseOut.bind(this));
      $canvas.mousewheel(this.onMouseWheel.bind(this));
      $canvas.mousemove(this.onMouseMove.bind(this));
      $canvas[0].addEventListener('webglcontextlost', this.onContextLost, false);
      $canvas[0].addEventListener('webglcontextrestored', this.onContextRestored, false);
    },
    /** Load webgl context */
    initWebGL: function () {
      // TODO : add an option to toggle antialias if possible ?
      var attributes = {
        antialias: true,
        stencil: true
      };
      var gl = this.gl_ = $('#canvas')[0].getContext('webgl', attributes) || $('#canvas')[0].getContext('experimental-webgl', attributes);
      if (!gl) {
        window.alert('Could not initialise WebGL. You should try Chrome or Firefox.');
      }
      if (gl) {
        if (!gl.getExtension('OES_element_index_uint')) {
          Render.ONLY_DRAW_ARRAYS = true;
        }
        gl.viewportWidth = $(window).width();
        gl.viewportHeight = $(window).height();
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
      this.mouseButton_ = 0;
    },
    /** Mouse out event */
    onMouseOut: function (event) {
      this.onMouseUp(event);
    },
    /** Mouse wheel event */
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var dy = event.deltaY;
      dy = dy > 1.0 ? 1.0 : dy < -1.0 ? -1.0 : dy;
      this.scene_.camera_.zoom(dy * 0.02);
      this.scene_.render();
    },
    /** Mouse pressed event */
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var mouseX = this.mouseX_ = event.pageX;
      var mouseY = this.mouseY_ = event.pageY;
      var button = this.mouseButton_ = event.which;
      if (button === 1 && !event.altKey) {
        if (this.mesh_) {
          this.sumDisplacement_ = 0;
          this.sculpt_.start(this);
        }
      }
      if (button === 3 || (button === 1 && this.scene_.picking_.mesh_ === null) || (event.altKey && button !== 0)) {
        this.mouseButton_ = 3;
        if (this.scene_.camera_.usePivot_)
          this.scene_.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
        this.scene_.camera_.start(mouseX, mouseY, this.scene_.picking_);
      }
    },
    /** Mouse move event */
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var mouseX = this.mouseX_ = event.pageX;
      var mouseY = this.mouseY_ = event.pageY;
      var button = this.mouseButton_;
      var camera = this.scene_.camera_;
      if (this.mesh_ && (button !== 1 || this.sculpt_.allowPicking()))
        this.scene_.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
      if (button === 1 && !event.altKey)
        this.sculpt_.update(this);
      else if (button === 2 || (event.altKey && event.shiftKey && button !== 0))
        camera.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
      else if (event.altKey && event.ctrlKey && button !== 0)
        camera.zoom((mouseY - this.lastMouseY_) / 3000);
      else if (button === 3 || (event.altKey && !event.shiftKey && !event.ctrlKey && button !== 0))
        camera.rotate(mouseX, mouseY);
      this.lastMouseX_ = mouseX;
      this.lastMouseY_ = mouseY;
      this.scene_.render();
    }
  };

  return SculptGL;
});