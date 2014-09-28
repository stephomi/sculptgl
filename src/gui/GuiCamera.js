define([
  'gui/GuiTR',
  'math3d/Camera',
], function (TR, Camera) {

  'use strict';

  function GuiCamera(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.camera_ = this.main_.getCamera(); // the camera
    this.cameraTimer_ = -1; // interval id (used for zqsd/wasd/arrow moves)
    this.init(guiParent);
  }

  GuiCamera.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var camera = this.camera_;

      // Camera fold
      var menu = guiParent.addMenu(TR('cameraTitle'));

      // reset camera
      menu.addTitle(TR('cameraReset'));
      menu.addDualButton(TR('cameraCenter'), TR('cameraFront'), this.resetCamera.bind(this), this.resetFront.bind(this));
      menu.addDualButton(TR('cameraLeft'), TR('cameraTop'), this.resetLeft.bind(this), this.resetTop.bind(this));

      // camera type
      var optionsType = {};
      menu.addTitle(TR('cameraProjection'));
      optionsType[Camera.projType.PERSPECTIVE] = TR('cameraPerspective');
      optionsType[Camera.projType.ORTHOGRAPHIC] = TR('cameraOrthographic');
      menu.addCombobox('', camera.type_, this.onCameraTypeChange.bind(this), optionsType);

      // camera fov
      this.ctrlFov_ = menu.addSlider(TR('cameraFov'), camera.fov_, this.onFovChange.bind(this), 10, 150, 1);

      // camera mode
      var optionsMode = {};
      menu.addTitle(TR('cameraMode'));
      optionsMode[Camera.mode.ORBIT] = TR('cameraOrbit');
      optionsMode[Camera.mode.SPHERICAL] = TR('cameraSpherical');
      optionsMode[Camera.mode.PLANE] = TR('cameraPlane');
      menu.addCombobox('', camera.mode_, this.onCameraModeChange.bind(this), optionsMode);
      menu.addCheckbox(TR('cameraPivot'), camera.usePivot_, this.onPivotChange.bind(this));

      this.addEvents();
    },
    /** On camera mode change */
    onCameraModeChange: function (value) {
      var camera = this.camera_;
      camera.mode_ = parseInt(value, 10);
      if (camera.mode_ === Camera.mode.ORBIT) {
        camera.resetViewFront();
        this.main_.render();
      }
    },
    /** On camera type change */
    onCameraTypeChange: function (value) {
      var camera = this.camera_;
      camera.type_ = parseInt(value, 10);
      this.ctrlFov_.setVisibility(camera.type_ === Camera.projType.PERSPECTIVE);
      camera.updateProjection();
      this.main_.render();
    },
    /** On fov change */
    onFovChange: function (value) {
      this.camera_.fov_ = value;
      this.camera_.updateProjection();
      this.main_.render();
    },
    /** On pivot change */
    onPivotChange: function (value) {
      this.camera_.usePivot_ = value;
      this.camera_.toggleUsePivot();
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
      if (this.cameraTimer_ === -1) {
        this.cameraTimer_ = setInterval(function () {
          camera.updateTranslation();
          main.render();
        }, 20);
      }
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
    /** Reset camera */
    resetCamera: function () {
      this.camera_.reset();
      this.main_.render();
    },
    /** Reset to front view */
    resetFront: function () {
      this.camera_.resetViewFront();
      this.main_.render();
    },
    /** Reset to left view */
    resetLeft: function () {
      this.camera_.resetViewLeft();
      this.main_.render();
    },
    /** Reset to top view */
    resetTop: function () {
      this.camera_.resetViewTop();
      this.main_.render();
    }
  };

  return GuiCamera;
});