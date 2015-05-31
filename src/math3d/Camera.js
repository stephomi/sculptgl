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
    this._mode = Camera.mode[opts.cameramode] || Camera.mode.ORBIT;
    this._projType = Camera.projType[opts.projection] || Camera.projType.PERSPECTIVE;

    this._quatRot = quat.create(); // quaternion rotation
    this._view = mat4.create(); // view matrix
    this._proj = mat4.create(); // projection matrix

    this._lastNormalizedMouseXY = [0.0, 0.0]; // last mouse position ( 0..1 )
    this._width = 0.0; // viewport width
    this._height = 0.0; // viewport height

    this._speed = 0.0; // solve scale issue
    this._fov = Math.min(opts.fov, 150); // vertical field of view

    // translation stuffs
    this._trans = [0.0, 0.0, 30.0];
    this._moveX = 0; // free look (strafe), possible values : -1, 0, 1
    this._moveZ = 0; // free look (strafe), possible values : -1, 0, 1

    // pivot stuffs
    this._usePivot = opts.pivot; // if rotation is centered around the picked point
    this._center = [0.0, 0.0, 0.0]; // center of rotation
    this._offset = [0.0, 0.0, 0.0];

    // orbit camera
    this._rotX = 0.0; // x rot for orbit camera
    this._rotY = 0.0; // y rot for orbit camera

    // near far
    this._near = 0.05;
    this._far = 5000.0;

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
      this._projType = type;
      this.updateProjection();
      this.updateView();
    },
    setMode: function (mode) {
      this._mode = mode;
      if (mode === Camera.mode.ORBIT)
        this.resetViewFront();
    },
    setFov: function (fov) {
      this._fov = fov;
      this.updateView();
      this.optimizeNearFar();
    },
    setUsePivot: function (bool) {
      this._usePivot = bool;
    },
    toggleUsePivot: function () {
      this._usePivot = !this._usePivot;
    },
    getProjType: function () {
      return this._projType;
    },
    isOrthographic: function () {
      return this._projType === Camera.projType.ORTHOGRAPHIC;
    },
    getMode: function () {
      return this._mode;
    },
    getFov: function () {
      return this._fov;
    },
    getUsePivot: function () {
      return this._usePivot;
    },
    start: (function () {
      var pivot = [0.0, 0.0, 0.0];
      return function (mouseX, mouseY, main) {
        this._lastNormalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this._width, this._height);
        if (!this._usePivot)
          return;
        var picking = main.getPicking();
        picking.intersectionMouseMeshes(main.getMeshes(), mouseX, mouseY);
        if (picking.getMesh()) {
          vec3.transformMat4(pivot, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
          this.setPivot(pivot);
        }
      };
    })(),
    setPivot: (function () {
      var qTemp = quat.create();
      return function (pivot) {
        vec3.transformQuat(this._offset, this._offset, quat.invert(qTemp, this._quatRot));
        vec3.sub(this._offset, this._offset, this._center);

        // set new pivot
        vec3.copy(this._center, pivot);
        vec3.add(this._offset, this._offset, this._center);
        vec3.transformQuat(this._offset, this._offset, this._quatRot);

        // adjust zoom
        if (this._projType === Camera.projType.PERSPECTIVE) {
          var oldZoom = this.getTransZ();
          this._trans[2] = vec3.dist(this.computePosition(), this._center) * this._fov / 45;
          var newZoom = this.getTransZ();
          this._offset[2] += newZoom - oldZoom;
        }
      };
    })(),
    /** Compute rotation values (by updating the quaternion) */
    rotate: (function () {
      var diff = [0.0, 0.0];
      var axisRot = [0.0, 0.0, 0.0];
      var quatTmp = [0.0, 0.0, 0.0, 0.0];

      return function (mouseX, mouseY, snap) {
        if (snap)
          return this.snapClosestRotation();
        var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this._width, this._height);
        if (this._mode === Camera.mode.ORBIT) {
          vec2.sub(diff, normalizedMouseXY, this._lastNormalizedMouseXY);
          this._rotX = Math.max(Math.min(this._rotX - diff[1] * 2, Math.PI * 0.5), -Math.PI * 0.5);
          this._rotY = this._rotY + diff[0] * 2;
          quat.identity(this._quatRot);
          quat.rotateX(this._quatRot, this._quatRot, this._rotX);
          quat.rotateY(this._quatRot, this._quatRot, this._rotY);
        } else if (this._mode === Camera.mode.PLANE) {
          var length = vec2.dist(this._lastNormalizedMouseXY, normalizedMouseXY);
          vec2.sub(diff, normalizedMouseXY, this._lastNormalizedMouseXY);
          vec3.normalize(axisRot, vec3.set(axisRot, -diff[1], diff[0], 0.0));
          quat.mul(this._quatRot, quat.setAxisAngle(quatTmp, axisRot, length * 2.0), this._quatRot);
        } else if (this._mode === Camera.mode.SPHERICAL) {
          var mouseOnSphereBefore = Geometry.mouseOnUnitSphere(this._lastNormalizedMouseXY);
          var mouseOnSphereAfter = Geometry.mouseOnUnitSphere(normalizedMouseXY);
          var angle = Math.acos(Math.min(1.0, vec3.dot(mouseOnSphereBefore, mouseOnSphereAfter)));
          vec3.normalize(axisRot, vec3.cross(axisRot, mouseOnSphereBefore, mouseOnSphereAfter));
          quat.mul(this._quatRot, quat.setAxisAngle(quatTmp, axisRot, angle * 2.0), this._quatRot);
        }
        this._lastNormalizedMouseXY = normalizedMouseXY;
        this.updateView();
      };
    })(),
    getTransZ: function () {
      return this._projType === Camera.projType.PERSPECTIVE ? this._trans[2] * 45 / this._fov : 1000.0;
    },
    updateView: (function () {
      var up = [0.0, 1.0, 0.0];
      var eye = [0.0, 0.0, 0.0];
      var center = [0.0, 0.0, 0.0];
      var matTmp = mat4.create();
      var vecTmp = [0.0, 0.0, 0.0];

      return function () {
        var view = this._view;
        var tx = this._trans[0];
        var ty = this._trans[1];

        var off = this._offset;
        vec3.set(eye, tx - off[0], ty - off[1], this.getTransZ() - off[2]);
        vec3.set(center, tx - off[0], ty - off[1], -off[2]);
        mat4.lookAt(view, eye, center, up);

        mat4.mul(view, view, mat4.fromQuat(matTmp, this._quatRot));
        mat4.translate(view, view, vec3.negate(vecTmp, this._center));
      };
    })(),
    optimizeNearFar: (function () {
      var eye = [0.0, 0.0, 0.0];
      var tmp = [0.0, 0.0, 0.0];
      return function (bb) {
        if (!bb) bb = this._lastBBox;
        if (!bb) return;
        this._lastBBox = bb;
        vec3.set(eye, this._trans[0], this._trans[1], this.getTransZ());
        var diag = vec3.dist(bb, vec3.set(tmp, bb[3], bb[4], bb[5]));
        var dist = vec3.dist(eye, vec3.set(tmp, (bb[0] + bb[3]) * 0.5, (bb[1] + bb[4]) * 0.5, (bb[2] + bb[5]) * 0.5));
        this._near = Math.max(0.01, dist - diag);
        this._far = diag + dist;
        this.updateProjection();
      };
    })(),
    updateProjection: function () {
      if (this._projType === Camera.projType.PERSPECTIVE) {
        mat4.perspective(this._proj, this._fov * Math.PI / 180.0, this._width / this._height, this._near, this._far);
        this._proj[10] = -1.0;
        this._proj[14] = -2 * this._near;
      } else {
        this.updateOrtho();
      }
    },
    updateTranslation: function () {
      var trans = this._trans;
      trans[0] += this._moveX * this._speed * trans[2] / 50 / 400.0;
      trans[2] = Math.max(0.00001, trans[2] + this._moveZ * this._speed / 400.0);
      if (this._projType === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
      this.updateView();
    },
    translate: function (dx, dy) {
      var factor = this._speed * this._trans[2] / 50;
      this._trans[0] -= dx * factor;
      this._trans[1] += dy * factor;
      this.updateView();
    },
    zoom: function (delta) {
      var off = this._offset;
      var factor = delta * this._speed / 54;
      this._trans[0] += (off[0] - this._trans[0]) * Math.max(factor, 0.0);
      this._trans[1] += (off[1] - this._trans[1]) * Math.max(factor, 0.0);
      this._trans[2] += (off[2] - this._trans[2]) * factor;

      if (this._projType === Camera.projType.ORTHOGRAPHIC)
        this.updateOrtho();
      this.updateView();
    },
    updateOrtho: function () {
      var delta = Math.abs(this._trans[2]) * 0.00055;
      mat4.ortho(this._proj, -this._width * delta, this._width * delta, -this._height * delta, this._height * delta, -this._near, this._far);
    },
    computePosition: function () {
      var view = this._view;
      var pos = [-view[12], -view[13], -view[14]];
      var rot = mat3.create();
      mat3.fromMat4(rot, view);
      return vec3.transformMat3(pos, pos, mat3.transpose(rot, rot));
    },
    resetView: function () {
      this._rotX = this._rotY = 0.0;
      this._speed = Utils.SCALE * 0.9;
      quat.identity(this._quatRot);
      vec3.set(this._center, 0.0, 0.0, 0.0);
      vec3.set(this._offset, 0.0, 0.0, 0.0);
      vec3.set(this._trans, 0.0, 0.0, 30.0);
      this.zoom(-0.6);
    },
    resetViewFront: function () {
      this._rotX = this._rotY = 0.0;
      quat.set(this._quatRot, 0, 0, 0, 1);
      this.updateView();
    },
    resetViewBack: function () {
      this._rotX = 0.0;
      this._rotY = Math.PI;
      quat.set(this._quatRot, 0, 1, 0, 0);
      this.updateView();
    },
    resetViewTop: function () {
      this._rotX = Math.PI * 0.5;
      this._rotY = 0.0;
      quat.set(this._quatRot, Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewBottom: function () {
      this._rotX = -Math.PI * 0.5;
      this._rotY = 0.0;
      quat.set(this._quatRot, -Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewLeft: function () {
      this._rotX = 0.0;
      this._rotY = -Math.PI * 0.5;
      quat.set(this._quatRot, 0, -Math.SQRT1_2, 0, Math.SQRT1_2);
      this.updateView();
    },
    resetViewRight: function () {
      this._rotX = 0.0;
      this._rotY = Math.PI * 0.5;
      quat.set(this._quatRot, 0, Math.SQRT1_2, 0, Math.SQRT1_2);
      this.updateView();
    },
    toggleViewFront: function () {
      if (this._quatRot[3] > 0.99) this.resetViewBack();
      else this.resetViewFront();
    },
    toggleViewTop: function () {
      var dot = this._quatRot[0] * Math.SQRT1_2 + this._quatRot[3] * Math.SQRT1_2;
      if (dot * dot > 0.99) this.resetViewBottom();
      else this.resetViewTop();
    },
    toggleViewLeft: function () {
      var dot = -this._quatRot[1] * Math.SQRT1_2 + this._quatRot[3] * Math.SQRT1_2;
      if (dot * dot > 0.99) this.resetViewRight();
      else this.resetViewLeft();
    },
    /** Project the mouse coordinate into the world coordinate at a given z */
    unproject: (function () {
      var mat = mat4.create();
      var n = [0.0, 0.0, 0.0, 1.0];
      return function (mouseX, mouseY, z) {
        var height = this._height;
        n[0] = (2.0 * mouseX / this._width) - 1.0;
        n[1] = (height - 2.0 * mouseY) / height;
        n[2] = 2.0 * z - 1.0;
        n[3] = 1.0;
        vec4.transformMat4(n, n, mat4.invert(mat, mat4.mul(mat, this._proj, this._view)));
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
        vec4.transformMat4(vec, vec, this._view);
        vec4.transformMat4(vec, vec, this._proj);
        var w = vec[3];
        var height = this._height;
        return [(vec[0] / w + 1) * this._width * 0.5, height - (vec[1] / w + 1.0) * height * 0.5, (vec[2] / w + 1.0) * 0.5];
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
        var qrot = this._quatRot;
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
        if (this._mode === Camera.mode.ORBIT) {
          var qx = qrot[3];
          var qy = qrot[1];
          var qz = qrot[2];
          var qw = qrot[0];
          // find back euler values
          this._rotY = Math.atan2(2 * (qx * qy + qz * qw), 1 - 2 * (qy * qy + qz * qz));
          this._rotX = Math.atan2(2 * (qx * qw + qy * qz), 1 - 2 * (qz * qz + qw * qw));
        }
        this.updateView();
      };
    })(),
    moveAnimationTo: function (x, y, z, main) {
      if (this._timer)
        window.clearInterval(this._timer);

      var duration = 1000;
      var trans = this._trans;
      var delta = [x, y, z];
      vec3.sub(delta, delta, trans);
      var lastR = 0;

      var tStart = (new Date()).getTime();
      this._timer = window.setInterval(function () {
        var r = ((new Date()).getTime() - tStart) / duration;
        r = Math.min(1.0, r);
        // ease out quart
        r = r - 1;
        r = -(r * r * r * r - 1);

        var dr = r - lastR;
        lastR = r;
        vec3.scaleAndAdd(trans, trans, delta, dr);
        if (this._projType === Camera.projType.ORTHOGRAPHIC)
          this.updateOrtho();
        this.updateView();

        main.render();
        if (r >= 1.0)
          window.clearInterval(this._timer);
      }.bind(this), 16.6);
    }
  };

  return Camera;
});