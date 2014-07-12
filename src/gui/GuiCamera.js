define([
  'math3d/Camera',
], function (Camera) {

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
      var cameraFold = guiParent.addFolder('Camera');
      // reset camera
      cameraFold.add(this, 'resetCamera').name('Reset');
      cameraFold.add(this, 'resetFront').name('Front view (F)');
      cameraFold.add(this, 'resetLeft').name('Left view (L)');
      cameraFold.add(this, 'resetTop').name('Top view (T)');
      // camera mode
      var ctrlCameraMode = cameraFold.add(camera, 'mode_', {
        'Orbit': Camera.mode.ORBIT,
        'Spherical': Camera.mode.SPHERICAL,
        'Plane': Camera.mode.PLANE
      }).name('Mode');
      // camera type
      var ctrlCameraType = cameraFold.add(camera, 'type_', {
        'Perspective': Camera.projType.PERSPECTIVE,
        'Orthographic': Camera.projType.ORTHOGRAPHIC
      }).name('Type');
      // camera fov
      var ctrlFov = cameraFold.add(camera, 'fov_', 10, 150).name('Fov');
      // camera pivo
      var ctrlPivot = cameraFold.add(camera, 'usePivot_').name('Picking pivot');

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

      window.addEventListener('keydown', this.onKeyDown.bind(this), false);
      window.addEventListener('keyup', this.onKeyUp.bind(this), false);
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