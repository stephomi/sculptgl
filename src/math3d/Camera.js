define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry'
], function (glm, Utils, Geometry) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var vec4 = glm.vec4;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  function Camera() {
    this.mode_ = Camera.mode.PLANE; // camera mode
    this.type_ = Camera.projType.PERSPECTIVE; // the projection type

    this.quatRot_ = quat.create(); // quaternion rotation
    this.view_ = mat4.create(); // view matrix
    this.proj_ = mat4.create(); // projection matrix

    this.lastNormalizedMouseXY_ = [0.0, 0.0]; // last mouse position ( 0..1 )
    this.width_ = 0.0; // viewport width
    this.height_ = 0.0; // viewport height

    this.speed_ = 1.0; // solve scale issue
    this.fov_ = 45.0; // vertical field of view

    // translation stuffs
    this.zoom_ = 20.0; // zoom value
    this.transX_ = 0.0; // translation in x
    this.transY_ = 0.0; // translation in y
    this.moveX_ = 0; // free look (strafe), possible values : -1, 0, 1
    this.moveZ_ = 0; // free look (strafe), possible values : -1, 0, 1

    // pivot stuffs
    this.usePivot_ = false; // if rotation is centered around the picked point
    this.center_ = [0.0, 0.0, 0.0]; // center of rotation
    this.stepCenter_ = [0.0, 0.0, 0.0]; // step vector to translate between pivots
    this.stepZoom_ = 0.0; // step zoom value
    this.stepCount_ = 0; // number of translation between pivots

    // orbit camera
    this.rotX_ = 0.0; // x rot for orbit camera
    this.rotY_ = 0.0; // y rot for orbit camera
  }

  // the camera modes
  Camera.mode = {
    ORBIT: 0,
    SPHERICAL: 1,
    PLANE: 2
  };

  // the projection type
  Camera.projType = {
    PERSPECTIVE: 0,
    ORTHOGRAPHIC: 1
  };

  Camera.prototype = {
    /** Start camera (store mouse coordinates) */
    start: function (mouseX, mouseY, picking) {
      this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
      if (this.usePivot_ && picking.getMesh()) {
        this.stepCount_ = 10;
        // target center
        vec3.transformMat4(this.stepCenter_, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
        // target zoom
        var targetZoom = vec3.dist(this.stepCenter_, this.computePosition());
        if (this.type_ === Camera.projType.PERSPECTIVE)
          this.stepZoom_ = (targetZoom - this.zoom_) / this.stepCount_;
        else
          this.stepZoom_ = 0.0;
        this.speed_ = targetZoom * 5.0;
        vec3.sub(this.stepCenter_, this.stepCenter_, this.center_);
        vec3.scale(this.stepCenter_, this.stepCenter_, 1.0 / this.stepCount_);
      }
    },
    /** Compute rotation values (by updating the quaternion) */
    rotate: (function () {
      var diff = [0.0, 0.0];
      var axisRot = [0.0, 0.0, 0.0];
      var quatTmp = [0.0, 0.0, 0.0, 0.0];

      return function (mouseX, mouseY) {
        var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
        if (this.mode_ === Camera.mode.ORBIT) {
          vec2.sub(diff, normalizedMouseXY, this.lastNormalizedMouseXY_);
          this.rotX_ = Math.max(Math.min(this.rotX_ - diff[1], Math.PI * 0.5), -Math.PI * 0.5);
          this.rotY_ = this.rotY_ + diff[0];
          quat.identity(this.quatRot_);
          quat.rotateX(this.quatRot_, this.quatRot_, this.rotX_);
          quat.rotateY(this.quatRot_, this.quatRot_, this.rotY_);
        } else if (this.mode_ === Camera.mode.PLANE) {
          var length = vec2.dist(this.lastNormalizedMouseXY_, normalizedMouseXY);
          vec2.sub(diff, normalizedMouseXY, this.lastNormalizedMouseXY_);
          vec3.normalize(axisRot, vec3.set(axisRot, -diff[1], diff[0], 0.0));
          quat.mul(this.quatRot_, quat.setAxisAngle(quatTmp, axisRot, length * 2.0), this.quatRot_);
        } else if (this.mode_ === Camera.mode.SPHERICAL) {
          var mouseOnSphereBefore = Geometry.mouseOnUnitSphere(this.lastNormalizedMouseXY_);
          var mouseOnSphereAfter = Geometry.mouseOnUnitSphere(normalizedMouseXY);
          var angle = Math.acos(Math.min(1.0, vec3.dot(mouseOnSphereBefore, mouseOnSphereAfter)));
          vec3.normalize(axisRot, vec3.cross(axisRot, mouseOnSphereBefore, mouseOnSphereAfter));
          quat.mul(this.quatRot_, quat.setAxisAngle(quatTmp, axisRot, angle * 2.0), this.quatRot_);
        }
        if (this.stepCount_ > 0) {
          --this.stepCount_;
          this.zoom_ += this.stepZoom_;
          vec3.add(this.center_, this.center_, this.stepCenter_);
        }
        this.lastNormalizedMouseXY_ = normalizedMouseXY;
      };
    })(),
    /** Update model view matrices */
    updateView: (function () {
      var up = [0.0, 1.0, 0.0];
      var eye = [0.0, 0.0, 0.0];
      var center = [0.0, 0.0, 0.0];
      var matTmp = mat4.create();
      var vecTmp = [0.0, 0.0, 0.0];

      return function () {
        var view = this.view_;
        var tx = this.transX_;
        var ty = this.transY_;
        var zoom = this.type_ === Camera.projType.PERSPECTIVE ? this.zoom_ : 1000.0;
        mat4.lookAt(view, vec3.set(eye, tx, ty, zoom), vec3.set(center, tx, ty, 0.0), up);
        mat4.mul(view, view, mat4.fromQuat(matTmp, this.quatRot_));
        mat4.translate(view, view, vec3.negate(vecTmp, this.center_));
      };
    })(),
    /** Update projection matrix */
    updateProjection: function () {
      this.proj_ = mat4.create();
      if (this.type_ === Camera.projType.PERSPECTIVE)
        mat4.perspective(this.proj_, this.fov_ * Math.PI / 180.0, this.width_ / this.height_, 0.05, 5000.0);
      else
        this.updateOrtho();
    },
    /** Update translation */
    updateTranslation: function () {
      this.transX_ += this.moveX_ * this.speed_ / 400.0;
      this.zoom_ = Math.max(0.00001, this.zoom_ + this.moveZ_ * this.speed_ / 400.0);
      if (this.type_ === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
    },
    /** Compute translation values */
    translate: function (dx, dy) {
      this.transX_ -= dx * this.speed_;
      this.transY_ += dy * this.speed_;
    },
    /** Zoom */
    zoom: function (delta) {
      this.zoom_ = Math.max(0.00001, this.zoom_ - delta * this.speed_);
      if (this.type_ === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
    },
    /** Update orthographic projection */
    updateOrtho: function () {
      var delta = Math.abs(this.zoom_) * 0.00055;
      mat4.ortho(this.proj_, -this.width_ * delta, this.width_ * delta, -this.height_ * delta, this.height_ * delta, -10000.0, 10000.0);
    },
    /** Return the position of the camera */
    computePosition: function () {
      var view = this.view_;
      var pos = [-view[12], -view[13], -view[14]];
      var rot = mat3.create();
      mat3.fromMat4(rot, view);
      return vec3.transformMat3(pos, pos, mat3.transpose(rot, rot));
    },
    /** Reset camera when we toggle usePivot */
    toggleUsePivot: function () {
      this.transX_ = 0.0;
      this.transY_ = 0.0;
    },
    /** Reset camera */
    reset: function () {
      this.transX_ = this.transY_ = this.zoom_ = this.rotX_ = this.rotY_ = 0.0;
      this.speed_ = Utils.SCALE * 0.9;
      this.quatRot_ = quat.create();
      vec3.set(this.center_, 0.0, 0.0, 0.0);
      this.zoom(-0.6);
    },
    /** Reset view front */
    resetViewFront: function () {
      this.rotX_ = this.rotY_ = 0.0;
      this.quatRot_ = quat.create();
    },
    /** Reset view top */
    resetViewTop: function () {
      this.rotX_ = Math.PI * 0.5;
      this.rotY_ = 0.0;
      this.quatRot_ = quat.rotateX(this.quatRot_, quat.create(), Math.PI * 0.5);
    },
    /** Reset view left */
    resetViewLeft: function () {
      this.rotX_ = 0.0;
      this.rotY_ = -Math.PI * 0.5;
      this.quatRot_ = quat.rotateY(this.quatRot_, quat.create(), -Math.PI * 0.5);
    },
    /** Project the mouse coordinate into the world coordinate at a given z */
    unproject: (function () {
      var mat = mat4.create();
      var n = [0.0, 0.0, 0.0, 1.0];
      return function (mouseX, mouseY, z) {
        var height = this.height_;
        n[0] = (2.0 * mouseX / this.width_) - 1.0;
        n[1] = (height - 2.0 * mouseY) / height;
        n[2] = 2.0 * z - 1.0;
        n[3] = 1.0;
        vec4.transformMat4(n, n, mat4.invert(mat, mat4.mul(mat, this.proj_, this.view_)));
        var w = n[3];
        return [n[0] / w, n[1] / w, n[2] / w];
      };
    })(),
    /** Project a vertex onto the screen */
    project: (function () {
      var vec = [0.0, 0.0, 0.0, 1.0];
      return function (vector) {
        vec[0] = vector[0];
        vec[1] = vector[1];
        vec[2] = vector[2];
        vec[3] = 1.0;
        vec4.transformMat4(vec, vec, this.view_);
        vec4.transformMat4(vec, vec, this.proj_);
        var w = vec[3];
        var height = this.height_;
        return [(vec[0] / w + 1) * this.width_ * 0.5, height - (vec[1] / w + 1.0) * height * 0.5, (vec[2] / w + 1.0) * 0.5];
      };
    })()
  };

  return Camera;
});