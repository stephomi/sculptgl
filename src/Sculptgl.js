define([
  'lib/glMatrix',
  'lib/Hammer',
  'misc/Utils',
  'Scene',
  'mesh/multiresolution/Multimesh'
], function (glm, Hammer, Utils, Scene, Multimesh) {

  'use strict';

  // Manage events
  var SculptGL = function () {
    Scene.call(this);

    // controllers stuffs
    this._mouseX = 0;
    this._mouseY = 0;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._lastScale = 0;
    this._mouseButton = 0;
    this._lastNbPointers = 0;
    this._isWheelingIn = false;

    // masking
    this._checkMask = false;
    this._maskX = 0;
    this._maskY = 0;
    this._hammer = new Hammer.Manager(this._canvas);

    this._eventProxy = {};

    this.initHammer();
    this.addEvents();
  };

  SculptGL.prototype = {
    initHammer: function () {
      this.initHammerRecognizers();
      this.initHammerEvents();
    },
    initHammerRecognizers: function () {
      var hm = this._hammer;
      // double tap
      hm.add(new Hammer.Tap({
        event: 'doubletap',
        taps: 2,
        time: 250, // def : 250.  Maximum press time in ms.
        interval: 450, // def : 300. Maximum time in ms between multiple taps.
        threshold: 5, // def : 2. While doing a tap some small movement is allowed.
        posThreshold: 50 // def : 30. The maximum position difference between multiple taps.
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
    initHammerEvents: function () {
      var hm = this._hammer;
      hm.on('panstart', this.onPanStart.bind(this));
      hm.on('panmove', this.onPanMove.bind(this));
      hm.on('panend pancancel', this.onPanEnd.bind(this));

      hm.on('doubletap', this.onDoubleTap.bind(this));
      hm.on('pinchstart', this.onPinchStart.bind(this));
      hm.on('pinchin pinchout', this.onPinchInOut.bind(this));
    },
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
      var res = picking.intersectionMouseMeshes(this._meshes, this._mouseX, this._mouseY);
      var cam = this._camera;
      var pivot = [0.0, 0.0, 0.0];
      if (!res) {
        var diag = 70.0;
        if (this._meshes.length > 0) {
          var box = this.computeBoundingBoxMeshes(this._meshes);
          diag = 0.8 * glm.vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
        }
        cam.setPivot(pivot);
        cam.moveToDelay(cam._offset[0], cam._offset[1], diag);
      } else {
        glm.vec3.transformMat4(pivot, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
        cam.setPivot(pivot);
        cam.moveToDelay(cam._offset[0], cam._offset[1], 20.0);
      }
      this.render();
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
    addEvents: function () {
      this._hammer.options.enable = true;
      var canvas = this._canvas;

      var cbMouseMove = Utils.throttle(this.onMouseMove.bind(this), 16.66);
      var cbMouseDown = this.onMouseDown.bind(this);
      var cbMouseUp = this.onMouseUp.bind(this);
      var cbMouseOut = this.onMouseOut.bind(this);
      var cbMouseOver = this.onMouseOver.bind(this);
      var cbMouseWheel = this.onMouseWheel.bind(this);

      // mouse
      canvas.addEventListener('mousedown', cbMouseDown, false);
      canvas.addEventListener('mouseup', cbMouseUp, false);
      canvas.addEventListener('mouseout', cbMouseOut, false);
      canvas.addEventListener('mouseover', cbMouseOver, false);
      canvas.addEventListener('mousemove', cbMouseMove, false);
      canvas.addEventListener('mousewheel', cbMouseWheel, false);
      canvas.addEventListener('DOMMouseScroll', cbMouseWheel, false);

      var cbContextLost = this.onContextLost.bind(this);
      var cbContextRestored = this.onContextRestored.bind(this);
      var cbLoadFiles = this.loadFiles.bind(this);
      var cbStopAndPrevent = this.stopAndPrevent.bind(this);

      // misc
      canvas.addEventListener('webglcontextlost', cbContextLost, false);
      canvas.addEventListener('webglcontextrestored', cbContextRestored, false);
      window.addEventListener('dragenter', cbStopAndPrevent, false);
      window.addEventListener('dragover', cbStopAndPrevent, false);
      window.addEventListener('drop', cbLoadFiles, false);
      document.getElementById('fileopen').addEventListener('change', cbLoadFiles, false);

      this.removeCallback = function () {
        this._hammer.options.enable = false;

        // mouse
        canvas.removeEventListener('mousedown', cbMouseDown, false);
        canvas.removeEventListener('mouseup', cbMouseUp, false);
        canvas.removeEventListener('mouseout', cbMouseOut, false);
        canvas.removeEventListener('mouseover', cbMouseOver, false);
        canvas.removeEventListener('mousemove', cbMouseMove, false);
        canvas.removeEventListener('mousewheel', cbMouseWheel, false);
        canvas.removeEventListener('DOMMouseScroll', cbMouseWheel, false);

        // misc
        canvas.removeEventListener('webglcontextlost', cbContextLost, false);
        canvas.removeEventListener('webglcontextrestored', cbContextRestored, false);
        window.removeEventListener('dragenter', cbStopAndPrevent, false);
        window.removeEventListener('dragover', cbStopAndPrevent, false);
        window.removeEventListener('drop', cbLoadFiles, false);
        document.getElementById('fileopen').removeEventListener('change', cbLoadFiles, false);
      };
    },
    stopAndPrevent: function (event) {
      event.stopPropagation();
      event.preventDefault();
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    /** Return the file type */
    getFileType: function (name) {
      var lower = name.toLowerCase();
      if (lower.endsWith('.obj')) return 'obj';
      if (lower.endsWith('.sgl')) return 'sgl';
      if (lower.endsWith('.stl')) return 'stl';
      if (lower.endsWith('.ply')) return 'ply';
      return;
    },
    /** Load file */
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
        self.loadScene(evt.target.result, fileType, self._autoMatrix);
        document.getElementById('fileopen').value = '';
      };

      if (fileType === 'obj')
        reader.readAsText(file);
      else
        reader.readAsArrayBuffer(file);
    },
    onContextLost: function () {
      window.alert('Oops... WebGL context lost.');
    },
    onContextRestored: function () {
      window.alert('Wow... Context is restored.');
    },
    onMouseOver: function () {
      this._focusGui = false;
    },
    onMouseOut: function (event) {
      this._focusGui = true;
      this.onMouseUp(event);
    },
    onMouseUp: function (event) {
      event.preventDefault();
      this.onDeviceUp();
    },
    onDeviceUp: function () {
      this._canvas.style.cursor = 'default';
      this._mouseButton = 0;
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this._sculpt.end();
      if (this._checkMask) {
        this._checkMask = false;
        if (this._mesh) {
          if (this._lastMouseX === this._maskX && this._lastMouseY === this._maskY)
            this.getSculpt().getTool('MASKING').invert();
          else
            this.getSculpt().getTool('MASKING').clear();
        }
      }
      this.render();
    },
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var dir = event.wheelDelta === undefined ? -event.detail : event.wheelDelta;
      this.onDeviceWheel(dir > 0 ? 1 : -1);
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
      this._timerEndWheel = window.setTimeout(this.endWheel.bind(this), 300);
    },
    endWheel: function () {
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this._isWheelingIn = false;
      this.render();
    },
    setMousePosition: function (event) {
      this._mouseX = event.pageX - this._canvas.offsetLeft;
      this._mouseY = event.pageY - this._canvas.offsetTop;
    },
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.onDeviceDown(event);
    },
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.onDeviceMove(event);
    },
    onDeviceDown: function (event) {
      if (this._focusGui)
        return;
      this.setMousePosition(event);

      var mouseX = this._mouseX;
      var mouseY = this._mouseY;
      var button = this._mouseButton = event.which;

      if (button === 1)
        this._sculpt.start(event.shiftKey);
      var picking = this._picking;
      var pickedMesh = picking.getMesh();
      if (button === 1 && pickedMesh)
        this._canvas.style.cursor = 'none';

      this._checkMask = false;
      if (button === 3 && event.ctrlKey)
        this._mouseButton = 4; // zoom camera
      else if (button === 2)
        this._mouseButton = 5; // pan camera (wheel mode)
      else if (!pickedMesh && event.ctrlKey) {
        this._maskX = mouseX;
        this._maskY = mouseY;
        this._checkMask = true;
        this._mouseButton = 0; // mask edit mode
      } else if ((!pickedMesh || button === 3) && event.altKey)
        this._mouseButton = 2; // pan camera
      else if (button === 3 || (button === 1 && !pickedMesh)) {
        this._mouseButton = 3; // rotate camera
      }
      // zoom or rotate camera
      if (this._mouseButton === 3 || this._mouseButton === 4)
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
      var button = this._mouseButton;

      if (button !== 1 || this._sculpt.allowPicking()) {
        Multimesh.RENDER_HINT = Multimesh.PICKING;
        if (this._mesh && button === 1)
          this._picking.intersectionMouseMesh(this._mesh, mouseX, mouseY);
        else
          this._picking.intersectionMouseMeshes(this._meshes, mouseX, mouseY);
        if (this._sculpt.getSymmetry() && this._mesh)
          this._pickingSym.intersectionMouseMesh(this._mesh, mouseX, mouseY);
      }
      if (button !== 0) {
        if (button === 4 || (button === 2 && !event.altKey)) {
          this._camera.zoom((mouseX - this._lastMouseX + mouseY - this._lastMouseY) / 1000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
          this.render();
        } else if (button === 2 || button === 5) {
          this._camera.translate((mouseX - this._lastMouseX) / 1000, (mouseY - this._lastMouseY) / 1000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
          this.render();
        } else if (button === 3) {
          if (event.shiftKey) this._camera.snapClosestRotation();
          else this._camera.rotate(mouseX, mouseY);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
          this.render();
        } else if (button === 1) {
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

  return SculptGL;
});