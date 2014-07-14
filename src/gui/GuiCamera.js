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
      var cameraFold = guiParent.addFolder(TR('cameraTitle'));

      // reset camera
      cameraFold.add(this, 'resetCamera').name(TR('cameraReset'));
      cameraFold.add(this, 'resetFront').name(TR('cameraFront'));
      cameraFold.add(this, 'resetLeft').name(TR('cameraLeft'));
      cameraFold.add(this, 'resetTop').name(TR('cameraTop'));

      // camera mode
      var optionsMode = {};
      optionsMode[TR('cameraOrbit')] = Camera.mode.ORBIT;
      optionsMode[TR('cameraSpherical')] = Camera.mode.SPHERICAL;
      optionsMode[TR('cameraPlane')] = Camera.mode.PLANE;
      var ctrlCameraMode = cameraFold.add(camera, 'mode_', optionsMode).name(TR('cameraMode'));

      // camera type
      var optionsType = {};
      optionsType[TR('cameraPerspective')] = Camera.projType.PERSPECTIVE;
      optionsType[TR('cameraOrthographic')] = Camera.projType.ORTHOGRAPHIC;
      var ctrlCameraType = cameraFold.add(camera, 'type_', optionsType).name(TR('cameraType'));

      // camera fov
      var ctrlFov = cameraFold.add(camera, 'fov_', 10, 150).name(TR('cameraFov'));

      // camera pivo
      var ctrlPivot = cameraFold.add(camera, 'usePivot_').name(TR('cameraPivot'));

      ctrlCameraMode.onChange(function (value) {
        camera.mode_ = parseInt(value, 10);
        if (camera.mode_ === Camera.mode.ORBIT) {
          camera.resetViewFront();
          scene.render();
        }
      });
      ctrlCameraType.onChange(function (value) {
        camera.type_ = parseInt(value, 10);
        ctrlFov.__li.hidden = camera.type_ === Camera.projType.ORTHOGRAPHIC;
        camera.updateProjection();
        scene.render();
      });
      ctrlFov.onChange(function () {
        camera.updateProjection();
        scene.render();
      });
      ctrlPivot.onChange(function () {
        camera.toggleUsePivot();
        scene.render();
      });

      cameraFold.close();

      this.addEvents();
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