define([
  'gui/GuiTR',
  'math3d/Camera',
], function (TR, Camera) {

  'use strict';

  function GuiCamera(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.camera_ = this.main_.getCamera(); // the camera
    this.cameraTimer_ = -1; // interval id (used for zqsd/wasd/arrow moves)
    this.cbTranslation_ = this.cbOnTranslation.bind(this);
    this.init(guiParent);
  }

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
      this.ctrlFov_ = menu.addSlider(TR('cameraFov'), camera.getFov(), this.onFovChange.bind(this), 10, 150, 1);

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
    /** On camera mode change */
    onCameraModeChange: function (value) {
      var mode = parseInt(value, 10);
      if (!this.main_.isReplayed())
        this.main_.getReplayWriter().pushAction('CAMERA_MODE', mode);

      this.camera_.setMode(mode);
      this.main_.render();
    },
    /** On camera type change */
    onCameraTypeChange: function (value) {
      var type = parseInt(value, 10);
      if (!this.main_.isReplayed())
        this.main_.getReplayWriter().pushAction('CAMERA_PROJ_TYPE', type);

      this.camera_.setProjType(type);
      this.ctrlFov_.setVisibility(type === Camera.projType.PERSPECTIVE);
      this.main_.render();
    },
    /** On fov change */
    onFovChange: function (value) {
      if (!this.main_.isReplayed())
        this.main_.getReplayWriter().pushCameraFov(value);

      this.camera_.setFov(value);
      this.main_.render();
    },
    /** Add events */
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
      if (!this.main_.focusGui_)
        event.preventDefault();
      else
        return;
      var key = event.which;
      var main = this.main_;
      var camera = main.getCamera();
      event.handled = true;
      switch (key) {
      case 37: // LEFT
      case 81: // Q
      case 65: // A
        camera.moveX_ = -1;
        break;
      case 39: // RIGHT
      case 68: // D
        camera.moveX_ = 1;
        break;
      case 38: // UP
      case 90: // Z
      case 87: // W
        camera.moveZ_ = -1;
        break;
      case 40: // DOWN
      case 83: // S
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
      var cam = main.getCamera();
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('CAMERA_FPS', cam.moveX_, cam.moveZ_);

      cam.updateTranslation();
      main.render();
    },
    /** Key released event */
    onKeyUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var key = event.which;
      var camera = this.camera_;
      switch (key) {
      case 37: // LEFT
      case 81: // Q
      case 65: // A
      case 39: // RIGHT
      case 68: // D
        camera.moveX_ = 0;
        break;
      case 38: // UP
      case 90: // Z
      case 87: // W
      case 40: // DOWN
      case 83: // S
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
    cameraAction: function (key, akey) {
      var main = this.main_;
      if (!main.isReplayed()) main.getReplayWriter().pushAction(akey);
      this.camera_[key]();
      main.render();
    },
    resetCamera: function () {
      this.cameraAction('resetView', 'CAMERA_RESET');
    },
    resetFront: function () {
      this.cameraAction('resetFront', 'CAMERA_RESET_FRONT');
    },
    resetLeft: function () {
      this.cameraAction('resetViewLeft', 'CAMERA_RESET_LEFT');
    },
    resetTop: function () {
      this.cameraAction('resetViewTop', 'CAMERA_RESET_TOP');
    },
    onPivotChange: function () {
      this.cameraAction('toggleUsePivot', 'CAMERA_TOGGLE_PIVOT');
    }
  };

  return GuiCamera;
});