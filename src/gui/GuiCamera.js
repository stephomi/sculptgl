define([
  'gui/GuiTR',
  'math3d/Camera',
], function (TR, Camera) {

  'use strict';

  var GuiCamera = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this._camera = this._main.getCamera(); // the camera
    this._cameraTimer = -1; // interval id (used for zqsd/wasd/arrow moves)
    this._cbTranslation = this.cbOnTranslation.bind(this);
    this.init(guiParent);
  };

  GuiCamera.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var camera = this._camera;

      // Camera fold
      var menu = this._menu = guiParent.addMenu(TR('cameraTitle'));

      // reset camera
      menu.addTitle(TR('cameraReset'));
      menu.addDualButton(TR('cameraCenter'), TR('cameraFront'), this.resetCamera.bind(this), this.resetFront.bind(this));
      menu.addDualButton(TR('cameraLeft'), TR('cameraTop'), this.resetLeft.bind(this), this.resetTop.bind(this));

      // camera type
      var optionsType = {};
      menu.addTitle(TR('cameraProjection'));
      optionsType[Camera.projType.PERSPECTIVE] = TR('cameraPerspective');
      optionsType[Camera.projType.ORTHOGRAPHIC] = TR('cameraOrthographic');
      menu.addCombobox('', camera.getProjType(), this.onCameraTypeChange.bind(this), optionsType);

      // camera fov
      this._ctrlFov = menu.addSlider(TR('cameraFov'), camera.getFov(), this.onFovChange.bind(this), 10, 90, 1);
      this._ctrlFov.setVisibility(camera.getProjType() === Camera.projType.PERSPECTIVE);

      // camera mode
      var optionsMode = {};
      menu.addTitle(TR('cameraMode'));
      optionsMode[Camera.mode.ORBIT] = TR('cameraOrbit');
      optionsMode[Camera.mode.SPHERICAL] = TR('cameraSpherical');
      optionsMode[Camera.mode.PLANE] = TR('cameraPlane');
      menu.addCombobox('', camera.getMode(), this.onCameraModeChange.bind(this), optionsMode);
      menu.addCheckbox(TR('cameraPivot'), camera.getUsePivot(), this.onPivotChange.bind(this));

      this.addEvents();
    },
    onCameraModeChange: function (value) {
      var mode = parseInt(value, 10);
      this._camera.setMode(mode);
      this._main.render();
    },
    onCameraTypeChange: function (value) {
      var type = parseInt(value, 10);
      this._camera.setProjType(type);
      this._ctrlFov.setVisibility(type === Camera.projType.PERSPECTIVE);
      this._main.render();
    },
    onFovChange: function (value) {
      this._camera.setFov(value);
      this._main.render();
    },
    addEvents: function () {
      var cbKeyDown = this.onKeyDown.bind(this);
      var cbKeyUp = this.onKeyUp.bind(this);
      window.addEventListener('keydown', cbKeyDown, false);
      window.addEventListener('keyup', cbKeyUp, false);
      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
        window.removeEventListener('keyup', cbKeyUp, false);
      };
    },
    /** Remove events */
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    /** Key pressed event */
    onKeyDown: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (this._main._focusGui)
        return;
      event.preventDefault();
      var key = event.which;
      var main = this._main;
      var camera = main.getCamera();
      event.handled = true;
      if (event.shiftKey && main._mouseButton === 3) {
        camera.snapClosestRotation();
        main.render();
      }
      switch (key) {
      case 37: // LEFT
        camera._moveX = -1;
        break;
      case 39: // RIGHT
        camera._moveX = 1;
        break;
      case 38: // UP
        camera._moveZ = -1;
        break;
      case 40: // DOWN
        camera._moveZ = 1;
        break;
      default:
        event.handled = false;
      }
      if (event.handled === true && this._cameraTimer === -1) {
        this._cameraTimer = window.setInterval(this._cbTranslation, 16.6);
      }
    },
    cbOnTranslation: function () {
      var main = this._main;
      main.getCamera().updateTranslation();
      main.render();
    },
    /** Key released event */
    onKeyUp: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (this._main._focusGui)
        return;
      event.preventDefault();
      event.handled = true;
      var key = event.which;
      var camera = this._camera;
      switch (key) {
      case 37: // LEFT
      case 39: // RIGHT
        camera._moveX = 0;
        break;
      case 38: // UP
      case 40: // DOWN
        camera._moveZ = 0;
        break;
      case 32: // SPACE
        this.resetCamera();
        break;
      case 70: // F
        this.resetFront();
        break;
      case 84: // T
        this.resetTop();
        break;
      case 76: // L
        this.resetLeft();
        break;
      }
      if (this._cameraTimer !== -1 && camera._moveX === 0 && camera._moveZ === 0) {
        clearInterval(this._cameraTimer);
        this._cameraTimer = -1;
      }
    },
    resetCamera: function () {
      this._camera.resetView();
      this._main.render();
    },
    resetFront: function () {
      this._camera.toggleViewFront();
      this._main.render();
    },
    resetLeft: function () {
      this._camera.toggleViewLeft();
      this._main.render();
    },
    resetTop: function () {
      this._camera.toggleViewTop();
      this._main.render();
    },
    onPivotChange: function () {
      this._camera.toggleUsePivot();
      this._main.render();
    }
  };

  return GuiCamera;
});