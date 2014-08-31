define([
  'gui/GuiTR',
  'math3d/Camera',
], function (TR, Camera) {

  'use strict';

  function GuiCamera(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.scene_ = ctrlGui.sculptgl_.scene_; // the scene
    this.cameraTimer_ = -1; // interval id (used for zqsd/wasd/arrow moves)
    this.init(guiParent);
  }

  GuiCamera.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var scene = this.scene_;
      var camera = scene.camera_;

      // Camera fold
      var menu = guiParent.addMenu(TR('cameraTitle'));

      // reset camera
      menu.addTitle(TR('Reset'));
      menu.addDualButton(TR('cameraCenter'), TR('cameraFront'), this.resetCamera.bind(this), this.resetFront.bind(this));
      menu.addDualButton(TR('cameraLeft'), TR('cameraTop'), this.resetLeft.bind(this), this.resetTop.bind(this));

      // camera type
      var optionsType = {};
      menu.addTitle(TR('cameraProjection'));
      optionsType[Camera.projType.PERSPECTIVE] = TR('cameraPerspective');
      optionsType[Camera.projType.ORTHOGRAPHIC] = TR('cameraOrthographic');
      menu.addCombobox('', camera.type_, this.onCameraTypeChange.bind(this), optionsType);

      // camera mode
      var optionsMode = {};
      menu.addTitle(TR('cameraMode'));
      optionsMode[Camera.mode.ORBIT] = TR('cameraOrbit');
      optionsMode[Camera.mode.SPHERICAL] = TR('cameraSpherical');
      optionsMode[Camera.mode.PLANE] = TR('cameraPlane');
      menu.addCombobox('', camera.mode_, this.onCameraModeChange.bind(this), optionsMode);
      menu.addCheckbox(TR('cameraPivot'), camera.usePivot_, this.onPivotChange.bind(this));

      // camera fov
      this.fovTitle_ = menu.addTitle(TR('cameraFov'));
      this.ctrlFov_ = menu.addSlider('', camera.fov_, this.onFovChange.bind(this), 10, 150, 1);

      this.addEvents();
    },
    /** On camera mode change */
    onCameraModeChange: function (value) {
      var camera = this.scene_.camera_;
      camera.mode_ = parseInt(value, 10);
      if (camera.mode_ === Camera.mode.ORBIT) {
        camera.resetViewFront();
        this.scene_.render();
      }
    },
    /** On camera type change */
    onCameraTypeChange: function (value) {
      var camera = this.scene_.camera_;
      camera.type_ = parseInt(value, 10);
      this.ctrlFov_.setVisibility(camera.type_ === Camera.projType.PERSPECTIVE);
      this.fovTitle_.setVisibility(camera.type_ === Camera.projType.PERSPECTIVE);
      camera.updateProjection();
      this.scene_.render();
    },
    /** On fov change */
    onFovChange: function (value) {
      this.scene_.camera_.fov_ = value;
      this.scene_.camera_.updateProjection();
      this.scene_.render();
    },
    /** On pivot change */
    onPivotChange: function (value) {
      this.scene_.camera_.usePivot_ = value;
      this.scene_.camera_.toggleUsePivot();
      this.scene_.render();
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
      if (!this.sculptgl_.focusGui_)
        event.preventDefault();
      var key = event.which;
      var scene = this.scene_;
      var camera = scene.camera_;
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
          scene.render();
        }, 20);
      }
    },
    /** Key released event */
    onKeyUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var key = event.which;
      var camera = this.scene_.camera_;
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
      this.scene_.camera_.reset();
      this.scene_.render();
    },
    /** Reset to front view */
    resetFront: function () {
      this.scene_.camera_.resetViewFront();
      this.scene_.render();
    },
    /** Reset to left view */
    resetLeft: function () {
      this.scene_.camera_.resetViewLeft();
      this.scene_.render();
    },
    /** Reset to top view */
    resetTop: function () {
      this.scene_.camera_.resetViewTop();
      this.scene_.render();
    }
  };

  return GuiCamera;
});