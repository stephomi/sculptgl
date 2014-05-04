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
    this.rot_ = quat.create(); // quaternion
    this.view_ = mat4.create(); // view matrix
    this.proj_ = mat4.create(); // projection matrix
    this.lastNormalizedMouseXY_ = [0.0, 0.0]; // last mouse position ( 0..1 )
    this.width_ = 0.0; // viewport width
    this.height_ = 0.0; // viewport height
    this.zoom_ = 20.0; // zoom value
    this.transX_ = 0.0; // translation in x
    this.transY_ = 0.0; // translation in y
    this.speed_ = 1.0; // solve scale issue
    this.moveX_ = 0; // free look (strafe), possible values : -1, 0, 1
    this.moveZ_ = 0; // free look (strafe), possible values : -1, 0, 1
    this.fov_ = 45.0; // vertical field of view
    this.center_ = [0.0, 0.0, 0.0]; // center of rotation
    this.stepCenter_ = [0.0, 0.0, 0.0]; // step vector to translate between pivots
    this.stepZoom_ = 0.0; // step zoom value
    this.stepCount_ = 0; // number of translation between pivots
    this.usePivot_ = false; // if rotation is centered around the picked point
  }

  // the camera modes
  Camera.mode = {
    SPHERICAL: 0,
    PLANE: 1
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
      if (this.usePivot_ && picking.mesh_) {
        this.stepCount_ = 10;
        // target center
        vec3.transformMat4(this.stepCenter_, picking.getIntersectionPoint(), picking.mesh_.getMatrix());
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
    rotate: function (mouseX, mouseY) {
      var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
      if (this.mode_ === Camera.mode.PLANE) {
        var length = vec2.dist(this.lastNormalizedMouseXY_, normalizedMouseXY);
        var diff = [0.0, 0.0];
        vec2.sub(diff, normalizedMouseXY, this.lastNormalizedMouseXY_);
        var axe = [-diff[1], diff[0], 0.0];
        vec3.normalize(axe, axe);
        quat.mul(this.rot_, quat.setAxisAngle([0.0, 0.0, 0.0, 0.0], axe, length * 2.0), this.rot_);
      } else if (this.mode_ === Camera.mode.SPHERICAL) {
        var mouseOnSphereBefore = Geometry.mouseOnUnitSphere(this.lastNormalizedMouseXY_);
        var mouseOnSphereAfter = Geometry.mouseOnUnitSphere(normalizedMouseXY);
        var angle = Math.acos(Math.min(1.0, vec3.dot(mouseOnSphereBefore, mouseOnSphereAfter)));
        var axeRot = [0.0, 0.0, 0.0];
        vec3.normalize(axeRot, vec3.cross(axeRot, mouseOnSphereBefore, mouseOnSphereAfter));
        quat.mul(this.rot_, quat.setAxisAngle([0.0, 0.0, 0.0, 0.0], axeRot, angle * 2.0), this.rot_);
      }
      if (this.stepCount_ > 0) {
        --this.stepCount_;
        this.zoom_ += this.stepZoom_;
        vec3.add(this.center_, this.center_, this.stepCenter_);
      }
      this.lastNormalizedMouseXY_ = normalizedMouseXY;
    },
    /** Update model view matrices */
    updateView: function () {
      var view = this.view_;
      var tx = this.transX_;
      var ty = this.transY_;
      if (this.type_ === Camera.projType.PERSPECTIVE)
        mat4.lookAt(view, [tx, ty, this.zoom_], [tx, ty, 0.0], [0.0, 1.0, 0.0]);
      else
        mat4.lookAt(view, [tx, ty, 1000.0], [tx, ty, 0.0], [0.0, 1.0, 0.0]);
      mat4.mul(view, view, mat4.fromQuat(mat4.create(), this.rot_));
      var center = this.center_;
      mat4.translate(view, view, [-center[0], -center[1], -center[2]]);
    },
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
      this.transX_ = 0.0;
      this.transY_ = 0.0;
      this.speed_ = Utils.SCALE * 0.9;
      this.rot_ = quat.create();
      this.center_ = [0.0, 0.0, 0.0];
      this.zoom_ = 0.0;
      this.zoom(-0.6);
    },
    /** Reset view front */
    resetViewFront: function () {
      this.rot_ = quat.create();
    },
    /** Reset view top */
    resetViewTop: function () {
      this.rot_ = quat.rotateX(this.rot_, quat.create(), Math.PI * 0.5);
    },
    /** Reset view left */
    resetViewLeft: function () {
      this.rot_ = quat.rotateY(this.rot_, quat.create(), -Math.PI * 0.5);
    },
    /** Project the mouse coordinate into the world coordinate at a given z */
    unproject: function (mouseX, mouseY, z) {
      var height = this.height_;
      var winx = (2.0 * mouseX / this.width_) - 1.0,
        winy = (height - 2.0 * mouseY) / height,
        winz = 2.0 * z - 1.0;
      var n = [winx, winy, winz, 1];
      var mat = mat4.create();
      vec4.transformMat4(n, n, mat4.invert(mat, mat4.mul(mat, this.proj_, this.view_)));
      var w = n[3];
      return [n[0] / w, n[1] / w, n[2] / w];
    },
    /** Project a vertex onto the screen */
    project: function (vector) {
      var vec = [vector[0], vector[1], vector[2], 1];
      vec4.transformMat4(vec, vec, this.view_);
      vec4.transformMat4(vec, vec, this.proj_);
      var w = vec[3];
      var height = this.height_;
      return [(vec[0] / w + 1) * this.width_ * 0.5, height - (vec[1] / w + 1.0) * height * 0.5, (vec[2] / w + 1.0) * 0.5];
    }
  };

  return Camera;
});