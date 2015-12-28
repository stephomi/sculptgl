define(function (require, exports, module) {

  'use strict';

  require('misc/Polyfill');
  var glm = require('lib/glMatrix');
  var Hammer = require('lib/Hammer');
  var Utils = require('misc/Utils');
  var Scene = require('Scene');
  var Multimesh = require('mesh/multiresolution/Multimesh');

  var vec3 = glm.vec3;

  // Manage events
  var SculptGL = function () {
    Scene.call(this);

    // all x and y position are canvas based

    // controllers stuffs
    this._mouseX = 0;
    this._mouseY = 0;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._lastScale = 0;
    // NOTHING, MASK_EDIT, SCULPT_EDIT, CAMERA_ZOOM, CAMERA_ROTATE, CAMERA_PAN, CAMERA_PAN_ZOOM_ALT
    this._action = 'NOTHING';
    this._lastNbPointers = 0;
    this._isWheelingIn = false;

    // masking
    this._maskX = 0;
    this._maskY = 0;
    this._hammer = new Hammer.Manager(this._canvas);

    this._eventProxy = {};

    this.initHammer();
    this.addEvents();
  };

  var MOUSE_LEFT = 1;
  var MOUSE_MIDDLE = 2;
  var MOUSE_RIGHT = 3;

  SculptGL.prototype = {
    addEvents: function () {
      var canvas = this._canvas;

      var cbMouseWheel = this.onMouseWheel.bind(this);
      // mouse
      canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
      canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
      canvas.addEventListener('mouseout', this.onMouseOut.bind(this), false);
      canvas.addEventListener('mouseover', this.onMouseOver.bind(this), false);
      canvas.addEventListener('mousemove', Utils.throttle(this.onMouseMove.bind(this), 16.66), false);
      canvas.addEventListener('mousewheel', cbMouseWheel, false);
      canvas.addEventListener('DOMMouseScroll', cbMouseWheel, false);

      //key
      window.addEventListener('keydown', this.onKeyDown.bind(this), false);
      window.addEventListener('keyup', this.onKeyUp.bind(this), false);

      var cbLoadFiles = this.loadFiles.bind(this);
      var cbStopAndPrevent = this.stopAndPrevent.bind(this);
      // misc
      canvas.addEventListener('webglcontextlost', this.onContextLost.bind(this), false);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored.bind(this), false);
      window.addEventListener('dragenter', cbStopAndPrevent, false);
      window.addEventListener('dragover', cbStopAndPrevent, false);
      window.addEventListener('drop', cbLoadFiles, false);
      document.getElementById('fileopen').addEventListener('change', cbLoadFiles, false);
    },
    initHammer: function () {
      this._hammer.options.enable = true;
      this._initHammerRecognizers();
      this._initHammerEvents();
    },
    _initHammerRecognizers: function () {
      var hm = this._hammer;
      // double tap
      hm.add(new Hammer.Tap({
        event: 'doubletap',
        pointers: 1,
        taps: 2,
        time: 250, // def : 250.  Maximum press time in ms.
        interval: 450, // def : 300. Maximum time in ms between multiple taps.
        threshold: 5, // def : 2. While doing a tap some small movement is allowed.
        posThreshold: 50 // def : 30. The maximum position difference between multiple taps.
      }));

      // double tap 2 fingers
      hm.add(new Hammer.Tap({
        event: 'doubletap2fingers',
        pointers: 2,
        taps: 2,
        time: 250,
        interval: 450,
        threshold: 5,
        posThreshold: 50
      }));

      // pan
      hm.add(new Hammer.Pan({
        event: 'pan',
        pointers: 0,
        threshold: 0,
      }));

      // pinch
      hm.add(new Hammer.Pinch({
        event: 'pinch',
        pointers: 2,
        threshold: 0.1 // Set a minimal thresold on pinch event, to be detected after pan
      }));
      hm.get('pinch').recognizeWith(hm.get('pan'));
    },
    _initHammerEvents: function () {
      var hm = this._hammer;
      hm.on('panstart', this.onPanStart.bind(this));
      hm.on('panmove', this.onPanMove.bind(this));
      hm.on('panend pancancel', this.onPanEnd.bind(this));

      hm.on('doubletap', this.onDoubleTap.bind(this));
      hm.on('doubletap2fingers', this.onDoubleTap2Fingers.bind(this));
      hm.on('pinchstart', this.onPinchStart.bind(this));
      hm.on('pinchin pinchout', this.onPinchInOut.bind(this));
    },
    stopAndPrevent: function (event) {
      event.stopPropagation();
      event.preventDefault();
    },
    onContextLost: function () {
      window.alert('Oops... WebGL context lost.');
    },
    onContextRestored: function () {
      window.alert('Wow... Context is restored.');
    },
    ////////////////
    // KEY EVENTS
    ////////////////
    onKeyDown: function (e) {
      this._gui.callFunc('onKeyDown', e);
    },
    onKeyUp: function (e) {
      this._gui.callFunc('onKeyUp', e);
    },
    ////////////////
    // MOBILE EVENTS
    ////////////////
    onPanStart: function (e) {
      if (e.pointerType === 'mouse')
        return;
      this._focusGui = false;
      var evProxy = this._eventProxy;
      evProxy.pageX = e.center.x;
      evProxy.pageY = e.center.y;
      this._lastNbPointers = evProxy.which = Math.min(2, e.pointers.length);
      this.onDeviceDown(evProxy);
    },
    onPanMove: function (e) {
      if (e.pointerType === 'mouse')
        return;
      var evProxy = this._eventProxy;
      evProxy.pageX = e.center.x;
      evProxy.pageY = e.center.y;
      var nbPointers = Math.min(2, e.pointers.length);
      if (nbPointers !== this._lastNbPointers) {
        this.onDeviceUp();
        evProxy.which = nbPointers;
        this.onDeviceDown(evProxy);
        this._lastNbPointers = nbPointers;
      }
      this.onDeviceMove(evProxy);
    },
    onPanEnd: function (e) {
      if (e.pointerType === 'mouse')
        return;
      this.onDeviceUp();
    },
    onDoubleTap: function (e) {
      if (this._focusGui)
        return;
      var evProxy = this._eventProxy;
      evProxy.pageX = e.center.x;
      evProxy.pageY = e.center.y;
      this.setMousePosition(evProxy);

      var picking = this._picking;
      var res = picking.intersectionMouseMeshes();
      var cam = this._camera;
      var pivot = [0.0, 0.0, 0.0];
      if (!res)
        return this.resetCameraScene();

      vec3.transformMat4(pivot, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
      var zoom = cam._trans[2];
      if (!cam.isOrthographic())
        zoom = Math.min(zoom, vec3.dist(pivot, cam.computePosition()));

      cam.setAndFocusOnPivot(pivot, zoom);
      this.render();
    },
    onDoubleTap2Fingers: function () {
      if (this._focusGui)
        return;
      this.resetCameraScene();
    },
    onPinchStart: function (e) {
      this._focusGui = false;
      this._lastScale = e.scale;
    },
    onPinchInOut: function (e) {
      var dir = (e.scale - this._lastScale) * 25;
      this._lastScale = e.scale;
      this.onDeviceWheel(dir);
    },
    resetCameraScene: function () {
      if (this._meshes.length > 0) {
        var pivot = [0.0, 0.0, 0.0];
        var box = this.computeBoundingBoxMeshes(this._meshes);
        var zoom = 0.3 * vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
        zoom *= this._camera.computeFrustumFit();
        vec3.set(pivot, (box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5);
        this._camera.setAndFocusOnPivot(pivot, zoom);
      } else {
        this._camera.resetView();
      }

      this.render();
    },
    ////////////////
    // LOAD FILES
    ////////////////
    getFileType: function (name) {
      var lower = name.toLowerCase();
      if (lower.endsWith('.obj')) return 'obj';
      if (lower.endsWith('.sgl')) return 'sgl';
      if (lower.endsWith('.stl')) return 'stl';
      if (lower.endsWith('.ply')) return 'ply';
      return;
    },
    loadFiles: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
      for (var i = 0, nb = files.length; i < nb; ++i) {
        var file = files[i];
        var fileType = this.getFileType(file.name);
        this.readFile(file, fileType);
      }
    },
    readFile: function (file, ftype) {
      var fileType = ftype || this.getFileType(file.name);
      if (!fileType)
        return;

      var reader = new FileReader();
      var self = this;
      reader.onload = function (evt) {
        self.loadScene(evt.target.result, fileType);
        document.getElementById('fileopen').value = '';
      };

      if (fileType === 'obj')
        reader.readAsText(file);
      else
        reader.readAsArrayBuffer(file);
    },
    ////////////////
    // MOUSE EVENTS
    ////////////////
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();

      this._gui.callFunc('onMouseDown', event);
      this.onDeviceDown(event);
    },
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();

      this._gui.callFunc('onMouseMove', event);
      this.onDeviceMove(event);
    },
    onMouseOver: function (event) {
      this._focusGui = false;
      this._gui.callFunc('onMouseOver', event);
    },
    onMouseOut: function (event) {
      this._focusGui = true;
      this._gui.callFunc('onMouseOut', event);
      this.onMouseUp(event);
    },
    onMouseUp: function (event) {
      event.preventDefault();

      this._gui.callFunc('onMouseUp', event);
      this.onDeviceUp();
    },
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();

      this._gui.callFunc('onMouseWheel', event);
      var dir = event.wheelDelta === undefined ? -event.detail : event.wheelDelta;
      this.onDeviceWheel(dir > 0 ? 1 : -1);
    },
    ////////////////
    // HANDLES EVENTS
    ////////////////
    onDeviceUp: function () {
      this.setCanvasCursor('default');
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this._sculpt.end();

      if (this._action === 'MASK_EDIT' && this._mesh) {

        if (this._lastMouseX === this._maskX && this._lastMouseY === this._maskY)
          this.getSculpt().getTool('MASKING').invert();
        else
          this.getSculpt().getTool('MASKING').clear();

      }

      this._action = 'NOTHING';
      this.render();
      this._states.cleanNoop();
    },
    onDeviceWheel: function (dir) {
      if (dir > 0.0 && !this._isWheelingIn) {
        this._isWheelingIn = true;
        this._camera.start(this._mouseX, this._mouseY);
      }
      this._camera.zoom(dir * 0.02);
      Multimesh.RENDER_HINT = Multimesh.CAMERA;
      this.render();
      // workaround for "end mouse wheel" event
      if (this._timerEndWheel)
        window.clearTimeout(this._timerEndWheel);
      this._timerEndWheel = window.setTimeout(this._endWheel.bind(this), 300);
    },
    _endWheel: function () {
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this._isWheelingIn = false;
      this.render();
    },
    setMousePosition: function (event) {
      this._mouseX = this._pixelRatio * (event.pageX - this._canvasOffsetLeft);
      this._mouseY = this._pixelRatio * (event.pageY - this._canvasOffsetTop);
    },
    onDeviceDown: function (event) {
      if (this._focusGui)
        return;

      this.setMousePosition(event);

      var mouseX = this._mouseX;
      var mouseY = this._mouseY;
      var button = event.which;

      var canEdit = false;
      if (button === MOUSE_LEFT)
        canEdit = this._sculpt.start(event.shiftKey);

      if (button === MOUSE_LEFT && canEdit)
        this.setCanvasCursor('none');

      if (button === MOUSE_RIGHT && event.ctrlKey)
        this._action = 'CAMERA_ZOOM';
      else if (button === MOUSE_MIDDLE)
        this._action = 'CAMERA_PAN';
      else if (!canEdit && event.ctrlKey) {
        this._maskX = mouseX;
        this._maskY = mouseY;
        this._action = 'MASK_EDIT';
      } else if ((!canEdit || button === MOUSE_RIGHT) && event.altKey)
        this._action = 'CAMERA_PAN_ZOOM_ALT';
      else if (button === MOUSE_RIGHT || (button === MOUSE_LEFT && !canEdit))
        this._action = 'CAMERA_ROTATE';
      else
        this._action = 'SCULPT_EDIT';

      if (this._action === 'CAMERA_ROTATE' || this._action === 'CAMERA_ZOOM')
        this._camera.start(mouseX, mouseY);

      this._lastMouseX = mouseX;
      this._lastMouseY = mouseY;
    },
    onDeviceMove: function (event) {
      if (this._focusGui)
        return;
      this.setMousePosition(event);

      var mouseX = this._mouseX;
      var mouseY = this._mouseY;
      var action = this._action;

      if (action === 'CAMERA_ZOOM' || (action === 'CAMERA_PAN_ZOOM_ALT' && !event.altKey)) {

        Multimesh.RENDER_HINT = Multimesh.CAMERA;
        this._camera.zoom((mouseX - this._lastMouseX + mouseY - this._lastMouseY) / 1000);
        this.render();

      } else if (action === 'CAMERA_PAN_ZOOM_ALT' || action === 'CAMERA_PAN') {

        Multimesh.RENDER_HINT = Multimesh.CAMERA;
        this._camera.translate((mouseX - this._lastMouseX) / 1000, (mouseY - this._lastMouseY) / 1000);
        this.render();

      } else if (action === 'CAMERA_ROTATE') {

        Multimesh.RENDER_HINT = Multimesh.CAMERA;
        if (!event.shiftKey)
          this._camera.rotate(mouseX, mouseY);
        this.render();

      } else {

        Multimesh.RENDER_HINT = Multimesh.PICKING;
        this._sculpt.preUpdate();

        if (action === 'SCULPT_EDIT') {
          Multimesh.RENDER_HINT = Multimesh.SCULPT;
          this._sculpt.update(this);
          if (this.getMesh().getDynamicTopology)
            this._gui.updateMeshInfo();
        }
      }

      this._lastMouseX = mouseX;
      this._lastMouseY = mouseY;
      this.renderSelectOverRtt();
    }
  };

  Utils.makeProxy(Scene, SculptGL);

  module.exports = SculptGL;
});