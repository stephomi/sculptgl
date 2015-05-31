define([
  'gui/GuiTR',
  'math3d/Camera',
], function (TR, Camera) {

  'use strict';

  var GuiCamera = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.camera_ = this.main_.getCamera(); // the camera
    this.cameraTimer_ = -1; // interval id (used for zqsd/wasd/arrow moves)
    this.cbTranslation_ = this.cbOnTranslation.bind(this);
    this.init(guiParent);
  };

  GuiCamera.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var camera = this.camera_;

      // Camera fold
      var menu = this.menu_ = guiParent.addMenu(TR('cameraTitle'));

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
      this.ctrlFov_ = menu.addSlider(TR('cameraFov'), camera.getFov(), this.onFovChange.bind(this), 10, 90, 1);
      this.ctrlFov_.setVisibility(camera.getProjType() === Camera.projType.PERSPECTIVE);

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
      this.camera_.setMode(mode);
      this.main_.render();
    },
    onCameraTypeChange: function (value) {
      var type = parseInt(value, 10);
      this.camera_.setProjType(type);
      this.ctrlFov_.setVisibility(type === Camera.projType.PERSPECTIVE);
      this.main_.render();
    },
    onFovChange: function (value) {
      this.camera_.setFov(value);
      this.main_.render();
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
      if (this.main_.focusGui_)
        return;
      event.preventDefault();
      var key = event.which;
      var main = this.main_;
      var camera = main.getCamera();
      event.handled = true;
      if (event.shiftKey && main.mouseButton_ === 3) {
        camera.snapClosestRotation();
        main.render();
      }
      switch (key) {
      case 37: // LEFT
        camera.moveX_ = -1;
        break;
      case 39: // RIGHT
        camera.moveX_ = 1;
        break;
      case 38: // UP
        camera.moveZ_ = -1;
        break;
      case 40: // DOWN
        camera.moveZ_ = 1;
        break;
      default:
        event.handled = false;
      }
      if (event.handled === true && this.cameraTimer_ === -1) {
        this.cameraTimer_ = window.setInterval(this.cbTranslation_, 16.6);
      }
    },
    cbOnTranslation: function () {
      var main = this.main_;
      main.getCamera().updateTranslation();
      main.render();
    },
    /** Key released event */
    onKeyUp: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (this.main_.focusGui_)
        return;
      event.preventDefault();
      event.handled = true;
      var key = event.which;
      var camera = this.camera_;
      switch (key) {
      case 37: // LEFT
      case 39: // RIGHT
        camera.moveX_ = 0;
        break;
      case 38: // UP
      case 40: // DOWN
        camera.moveZ_ = 0;
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
      if (this.cameraTimer_ !== -1 && camera.moveX_ === 0 && camera.moveZ_ === 0) {
        clearInterval(this.cameraTimer_);
        this.cameraTimer_ = -1;
      }
    },
    resetCamera: function () {
      this.camera_.resetView();
      this.main_.render();
    },
    resetFront: function () {
      this.camera_.toggleViewFront();
      this.main_.render();
    },
    resetLeft: function () {
      this.camera_.toggleViewLeft();
      this.main_.render();
    },
    resetTop: function () {
      this.camera_.toggleViewTop();
      this.main_.render();
    },
    onPivotChange: function () {
      this.camera_.toggleUsePivot();
      this.main_.render();
    }
  };

  return GuiCamera;
});