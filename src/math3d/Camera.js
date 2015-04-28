define([
  'lib/glMatrix',
  'misc/getUrlOptions',
  'misc/Utils',
  'math3d/Geometry'
], function (glm, getUrlOptions, Utils, Geometry) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var vec4 = glm.vec4;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  var Camera = function () {
    var opts = getUrlOptions();
    this.mode_ = Camera.mode[opts.cameramode] || Camera.mode.ORBIT;
    this.projType_ = Camera.projType[opts.projection] || Camera.projType.PERSPECTIVE;

    this.quatRot_ = quat.create(); // quaternion rotation
    this.view_ = mat4.create(); // view matrix
    this.proj_ = mat4.create(); // projection matrix

    this.lastNormalizedMouseXY_ = [0.0, 0.0]; // last mouse position ( 0..1 )
    this.width_ = 0.0; // viewport width
    this.height_ = 0.0; // viewport height

    this.speed_ = 0.0; // solve scale issue
    this.fov_ = Math.min(opts.fov, 150); // vertical field of view

    // translation stuffs
    this.zoom_ = 30.0; // zoom value
    this.transX_ = 0.0; // translation in x
    this.transY_ = 0.0; // translation in y
    this.moveX_ = 0; // free look (strafe), possible values : -1, 0, 1
    this.moveZ_ = 0; // free look (strafe), possible values : -1, 0, 1

    // pivot stuffs
    this.usePivot_ = opts.pivot; // if rotation is centered around the picked point
    this.center_ = [0.0, 0.0, 0.0]; // center of rotation
    this.offset_ = [0.0, 0.0, 0.0];

    // orbit camera
    this.rotX_ = 0.0; // x rot for orbit camera
    this.rotY_ = 0.0; // y rot for orbit camera

    // near far
    this.near_ = 0.05;
    this.far_ = 5000.0;

    this.resetView();
  };

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
    setProjType: function (type) {
      this.projType_ = type;
      this.updateProjection();
      this.updateView();
    },
    setMode: function (mode) {
      this.mode_ = mode;
      if (mode === Camera.mode.ORBIT)
        this.resetViewFront();
    },
    setFov: function (fov) {
      this.fov_ = fov;
      this.updateView();
      this.optimizeNearFar();
    },
    setUsePivot: function (bool) {
      this.usePivot_ = bool;
    },
    getProjType: function () {
      return this.projType_;
    },
    isOrthographic: function () {
      return this.projType_ === Camera.projType.ORTHOGRAPHIC;
    },
    getMode: function () {
      return this.mode_;
    },
    getFov: function () {
      return this.fov_;
    },
    getUsePivot: function () {
      return this.usePivot_;
    },
    /** Start camera (store mouse coordinates) */
    start: (function () {
      var qTemp = quat.create();

      return function (mouseX, mouseY, picking) {
        this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
        if (this.usePivot_ && picking.getMesh()) {
          vec3.transformQuat(this.offset_, this.offset_, quat.invert(qTemp, this.quatRot_));
          vec3.sub(this.offset_, this.offset_, this.center_);

          // set new pivot
          vec3.transformMat4(this.center_, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
          vec3.add(this.offset_, this.offset_, this.center_);
          vec3.transformQuat(this.offset_, this.offset_, this.quatRot_);

          // adjust zoom
          if (this.projType_ === Camera.projType.PERSPECTIVE) {
            var oldZoom = this.getTransZ();
            this.zoom_ = vec3.dist(this.computePosition(), this.center_) * this.fov_ / 45;
            var newZoom = this.getTransZ();
            this.offset_[2] += newZoom - oldZoom;
          }
        }
      };
    })(),
    /** Compute rotation values (by updating the quaternion) */
    rotate: (function () {
      var diff = [0.0, 0.0];
      var axisRot = [0.0, 0.0, 0.0];
      var quatTmp = [0.0, 0.0, 0.0, 0.0];

      return function (mouseX, mouseY, snap) {
        if (snap) return this.snapClosestRotation();
        var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
        if (this.mode_ === Camera.mode.ORBIT) {
          vec2.sub(diff, normalizedMouseXY, this.lastNormalizedMouseXY_);
          this.rotX_ = Math.max(Math.min(this.rotX_ - diff[1] * 2, Math.PI * 0.5), -Math.PI * 0.5);
          this.rotY_ = this.rotY_ + diff[0] * 2;
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
        this.lastNormalizedMouseXY_ = normalizedMouseXY;
        this.updateView();
      };
    })(),
    getTransZ: function () {
      return this.projType_ === Camera.projType.PERSPECTIVE ? this.zoom_ * 45 / this.fov_ : 1000.0;
    },
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

        var off = this.offset_;
        // vec3.set(eye, tx, ty, this.getTransZ());
        vec3.set(eye, tx - off[0], ty - off[1], this.getTransZ() - off[2]);
        // vec3.set(center, tx, ty, 0.0);
        vec3.set(center, tx - off[0], ty - off[1], -off[2]);

        // eye[2] = this.getTransZ();
        mat4.lookAt(view, eye, center, up);

        mat4.mul(view, view, mat4.fromQuat(matTmp, this.quatRot_));
        mat4.translate(view, view, vec3.negate(vecTmp, this.center_));
      };
    })(),

    // Mo  = Mr Mt-1 Mr-1

    optimizeNearFar: (function () {
      var eye = [0.0, 0.0, 0.0];
      var tmp = [0.0, 0.0, 0.0];
      return function (bb) {
        if (!bb) bb = this.lastBBox_;
        if (!bb) return;
        this.lastBBox_ = bb;
        vec3.set(eye, this.transX_, this.transY_, this.getTransZ());
        var diag = vec3.dist(bb, vec3.set(tmp, bb[3], bb[4], bb[5]));
        var dist = vec3.dist(eye, vec3.set(tmp, (bb[0] + bb[3]) * 0.5, (bb[1] + bb[4]) * 0.5, (bb[2] + bb[5]) * 0.5));
        this.near_ = Math.max(0.01, dist - diag);
        this.far_ = diag + dist;
        this.updateProjection();
      };
    })(),
    /** Update projection matrix */
    updateProjection: function () {
      if (this.projType_ === Camera.projType.PERSPECTIVE) {
        mat4.perspective(this.proj_, this.fov_ * Math.PI / 180.0, this.width_ / this.height_, this.near_, this.far_);
        this.proj_[10] = -1.0;
        this.proj_[14] = -2 * this.near_;
      } else {
        this.updateOrtho();
      }
    },
    /** Update translation */
    updateTranslation: function () {
      this.transX_ += this.moveX_ * this.speed_ * this.zoom_ / 50 / 400.0;
      this.zoom_ = Math.max(0.00001, this.zoom_ + this.moveZ_ * this.speed_ / 400.0);
      if (this.projType_ === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
      this.updateView();
    },
    /** Compute translation values */
    translate: function (dx, dy) {
      this.transX_ -= dx * this.speed_ * this.zoom_ / 50;
      this.transY_ += dy * this.speed_ * this.zoom_ / 50;
      this.updateView();
    },
    /** Zoom */
    zoom: function (delta) {
      this.zoom_ = Math.max(0.00001, this.zoom_ * (1.0 - delta * this.speed_ / 54));

      var focus = Math.abs(delta) * 5.0;
      this.transX_ -= (this.transX_ - this.offset_[0]) * focus;
      this.transY_ -= (this.transY_ - this.offset_[1]) * focus;

      if (this.projType_ === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
      this.updateView();
    },
    /** Update orthographic projection */
    updateOrtho: function () {
      var delta = Math.abs(this.zoom_) * 0.00055;
      mat4.ortho(this.proj_, -this.width_ * delta, this.width_ * delta, -this.height_ * delta, this.height_ * delta, -this.near_, this.far_);
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
      this.usePivot_ = !this.usePivot_;
      this.transX_ = 0.0;
      this.transY_ = 0.0;
    },
    /** Reset camera */
    resetView: function () {
      this.transX_ = this.transY_ = this.rotX_ = this.rotY_ = 0.0;
      this.speed_ = Utils.SCALE * 0.9;
      quat.identity(this.quatRot_);
      vec3.set(this.center_, 0.0, 0.0, 0.0);
      vec3.set(this.offset_, 0.0, 0.0, 0.0);
      this.zoom_ = 30;
      this.zoom(-0.6);
    },
    resetViewFront: function () {
      this.rotX_ = this.rotY_ = 0.0;
      quat.set(this.quatRot_, 0, 0, 0, 1);
      this.updateView();
    },
    resetViewBack: function () {
      this.rotX_ = 0.0;
      this.rotY_ = Math.PI;
      quat.set(this.quatRot_, 0, 1, 0, 0);
      this.updateView();
    },
    resetViewTop: function () {
      this.rotX_ = Math.PI * 0.5;
      this.rotY_ = 0.0;
      quat.set(this.quatRot_, Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewBottom: function () {
      this.rotX_ = -Math.PI * 0.5;
      this.rotY_ = 0.0;
      quat.set(this.quatRot_, -Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewLeft: function () {
      this.rotX_ = 0.0;
      this.rotY_ = -Math.PI * 0.5;
      quat.set(this.quatRot_, 0, -Math.SQRT1_2, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewRight: function () {
      this.rotX_ = 0.0;
      this.rotY_ = Math.PI * 0.5;
      quat.set(this.quatRot_, 0, Math.SQRT1_2, 0, Math.SQRT1_2);
      this.updateView();
    },
    toggleViewFront: function () {
      if (this.quatRot_[3] > 0.99) this.resetViewBack();
      else this.resetViewFront();
    },
    toggleViewTop: function () {
      var dot = this.quatRot_[0] * Math.SQRT1_2 + this.quatRot_[3] * Math.SQRT1_2;
      if (dot * dot > 0.99) this.resetViewBottom();
      else this.resetViewTop();
    },
    toggleViewLeft: function () {
      var dot = -this.quatRot_[1] * Math.SQRT1_2 + this.quatRot_[3] * Math.SQRT1_2;
      if (dot * dot > 0.99) this.resetViewRight();
      else this.resetViewLeft();
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
    })(),
    snapClosestRotation: (function () {
      var sq = Math.SQRT1_2;
      var d = 0.5;
      var qComp = [
        quat.fromValues(1, 0, 0, 0),
        quat.fromValues(0, 1, 0, 0),
        quat.fromValues(0, 0, 1, 0),
        quat.fromValues(0, 0, 0, 1),
        quat.fromValues(sq, sq, 0, 0),
        quat.fromValues(sq, -sq, 0, 0),
        quat.fromValues(sq, 0, sq, 0),
        quat.fromValues(sq, 0, -sq, 0),
        quat.fromValues(sq, 0, 0, sq),
        quat.fromValues(sq, 0, 0, -sq),
        quat.fromValues(0, sq, sq, 0),
        quat.fromValues(0, sq, -sq, 0),
        quat.fromValues(0, sq, 0, sq),
        quat.fromValues(0, sq, 0, -sq),
        quat.fromValues(0, 0, sq, sq),
        quat.fromValues(0, 0, sq, -sq),
        quat.fromValues(d, d, d, d),
        quat.fromValues(d, d, d, -d),
        quat.fromValues(d, d, -d, d),
        quat.fromValues(d, d, -d, -d),
        quat.fromValues(d, -d, d, d),
        quat.fromValues(d, -d, d, -d),
        quat.fromValues(d, -d, -d, d),
        quat.fromValues(-d, d, d, d),
      ];
      var nbQComp = qComp.length;
      return function () {
        // probably not the fastest way to do this thing :)
        var qrot = this.quatRot_;
        var min = 50;
        var id = 0;
        for (var i = 0; i < nbQComp; ++i) {
          var dot = quat.dot(qrot, qComp[i]);
          dot = 1 - dot * dot;
          if (min < dot)
            continue;
          min = dot;
          id = i;
        }
        quat.copy(qrot, qComp[id]);
        if (this.mode_ === Camera.mode.ORBIT) {
          var qx = qrot[3];
          var qy = qrot[1];
          var qz = qrot[2];
          var qw = qrot[0];
          // find back euler values
          this.rotY_ = Math.atan2(2 * (qx * qy + qz * qw), 1 - 2 * (qy * qy + qz * qz));
          this.rotX_ = Math.atan2(2 * (qx * qw + qy * qz), 1 - 2 * (qz * qz + qw * qw));
        }
        this.updateView();
      };
    })(),
    copyCamera: function (cam) {
      mat4.copy(this.view_, cam.view_);
      quat.copy(this.quatRot_, cam.quatRot_);
      vec3.copy(this.center_, cam.center_);
      vec3.copy(this.offset_, cam.offset_);

      this.transX_ = cam.transX_;
      this.transY_ = cam.transY_;
      this.rotX_ = cam.rotX_;
      this.rotY_ = cam.rotY_;
      this.zoom_ = cam.zoom_;

      if (this.getMode() !== cam.getMode())
        this.setMode(cam.getMode());
      if (this.getProjType() !== cam.getProjType())
        this.setProjType(cam.getProjType());
      if (this.getFov() !== cam.getFov())
        this.setFov(cam.getFov());
    }
  };

  return Camera;
});