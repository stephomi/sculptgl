define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var getOptionsURL = require('misc/getOptionsURL');
  var Utils = require('misc/Utils');
  var Geometry = require('math3d/Geometry');

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  var easeOutQuart = function (r) {
    r = Math.min(1.0, r) - 1.0;
    return -(r * r * r * r - 1.0);
  };

  var DELAY_SNAP = 200;
  var DELAY_ROTATE = -1;
  var DELAY_TRANSLATE = -1;
  var DELAY_MOVE_TO = 200;

  var Camera = function (main) {
    this._main = main;

    var opts = getOptionsURL();
    this._mode = opts.cameramode || 'ORBIT'; // SPHERICAL / PLANE
    this._projectionType = opts.projection || 'PERSPECTIVE'; // ORTHOGRAPHIC

    this._quatRot = [0.0, 0.0, 0.0, 1.0]; // quaternion rotation
    this._view = mat4.create(); // view matrix
    this._proj = mat4.create(); // projection matrix
    this._viewport = mat4.create(); // viewport matrix

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

    this._timers = {}; // animation timers

    this.resetView();
  };

  Camera.prototype = {
    setProjectionType: function (type) {
      this._projectionType = type;
      this.updateProjection();
      this.updateView();
    },
    setMode: function (mode) {
      this._mode = mode;
      if (mode === 'ORBIT')
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
    getView: function () {
      return this._view;
    },
    getProjection: function () {
      return this._proj;
    },
    getProjectionType: function () {
      return this._projectionType;
    },
    isOrthographic: function () {
      return this._projectionType === 'ORTHOGRAPHIC';
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
    getConstantScreen: function () {
      if (this._projectionType === 'ORTHOGRAPHIC')
        return 1.0 / this.getOrthoZoom();
      return Math.min(this._proj[0], this._proj[5] * 0.5);
    },
    start: (function () {
      var pivot = [0.0, 0.0, 0.0];
      return function (mouseX, mouseY) {
        this._lastNormalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this._width, this._height);
        if (!this._usePivot)
          return;
        var main = this._main;
        var picking = main.getPicking();
        picking.intersectionMouseMeshes(main.getMeshes(), mouseX, mouseY);
        if (picking.getMesh()) {
          vec3.transformMat4(pivot, picking.getIntersectionPoint(), picking.getMesh().getMatrix());
          this.setPivot(pivot);
        }
      };
    })(),
    setPivot: (function () {
      var qTmp = [0.0, 0.0, 0.0, 1.0];
      return function (pivot) {
        vec3.transformQuat(this._offset, this._offset, quat.invert(qTmp, this._quatRot));
        vec3.sub(this._offset, this._offset, this._center);

        // set new pivot
        vec3.copy(this._center, pivot);
        vec3.add(this._offset, this._offset, this._center);
        vec3.transformQuat(this._offset, this._offset, this._quatRot);

        // adjust zoom
        if (this._projectionType === 'PERSPECTIVE') {
          var oldZoom = this.getTransZ();
          this._trans[2] = vec3.dist(this.computePosition(), this._center) * this._fov / 45;
          this._offset[2] += this.getTransZ() - oldZoom;
        } else {
          this._offset[2] = 0.0;
        }
      };
    })(),
    /** Compute rotation values (by updating the quaternion) */
    rotate: (function () {
      var diff = [0.0, 0.0];
      var axisRot = [0.0, 0.0, 0.0];
      var quatTmp = [0.0, 0.0, 0.0, 0.0];

      return function (mouseX, mouseY) {

        var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this._width, this._height);
        if (this._mode === 'ORBIT') {
          vec2.sub(diff, normalizedMouseXY, this._lastNormalizedMouseXY);
          this.setOrbit(this._rotX - diff[1] * 2, this._rotY + diff[0] * 2);

          this.rotateDelay([-diff[1] * 6, diff[0] * 6], DELAY_ROTATE);
        } else if (this._mode === 'PLANE') {
          var length = vec2.dist(this._lastNormalizedMouseXY, normalizedMouseXY);
          vec2.sub(diff, normalizedMouseXY, this._lastNormalizedMouseXY);
          vec3.normalize(axisRot, vec3.set(axisRot, -diff[1], diff[0], 0.0));
          quat.mul(this._quatRot, quat.setAxisAngle(quatTmp, axisRot, length * 2.0), this._quatRot);

          this.rotateDelay([axisRot[0], axisRot[1], axisRot[2], length * 6], DELAY_ROTATE);
        } else if (this._mode === 'SPHERICAL') {
          var mouseOnSphereBefore = Geometry.mouseOnUnitSphere(this._lastNormalizedMouseXY);
          var mouseOnSphereAfter = Geometry.mouseOnUnitSphere(normalizedMouseXY);
          var angle = Math.acos(Math.min(1.0, vec3.dot(mouseOnSphereBefore, mouseOnSphereAfter)));
          vec3.normalize(axisRot, vec3.cross(axisRot, mouseOnSphereBefore, mouseOnSphereAfter));
          quat.mul(this._quatRot, quat.setAxisAngle(quatTmp, axisRot, angle * 2.0), this._quatRot);

          this.rotateDelay([axisRot[0], axisRot[1], axisRot[2], angle * 6], DELAY_ROTATE);
        }
        this._lastNormalizedMouseXY = normalizedMouseXY;
        this.updateView();
      };
    })(),
    setOrbit: function (rx, ry) {
      var radLimit = Math.PI * 0.49;
      this._rotX = Math.max(Math.min(rx, radLimit), -radLimit);
      this._rotY = ry;
      var qrt = this._quatRot;
      quat.identity(qrt);
      quat.rotateX(qrt, qrt, this._rotX);
      quat.rotateY(qrt, qrt, this._rotY);
    },
    getTransZ: function () {
      return this._projectionType === 'PERSPECTIVE' ? this._trans[2] * 45 / this._fov : 1000.0;
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
      if (this._projectionType === 'PERSPECTIVE') {
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
      if (this._projectionType === 'ORTHOGRAPHIC')
        this.updateOrtho();
      this.updateView();
    },
    translate: function (dx, dy) {
      var factor = this._speed * this._trans[2] / 54;
      var delta = [-dx * factor, dy * factor, 0.0];
      this.setTrans(vec3.add(this._trans, this._trans, delta));

      vec3.scale(delta, delta, 5);
      this.translateDelay(delta, DELAY_TRANSLATE);
    },
    zoom: function (df) {
      var delta = [0.0, 0.0, 0.0];
      vec3.sub(delta, this._offset, this._trans);
      vec3.scale(delta, delta, df * this._speed / 54);
      if (df < 0.0)
        delta[0] = delta[1] = 0.0;
      this.setTrans(vec3.add(this._trans, this._trans, delta));

      vec3.scale(delta, delta, 5);
      this.translateDelay(delta, DELAY_TRANSLATE);
    },
    setAndFocusOnPivot: function (pivot, zoom) {
      this.setPivot(pivot);
      this.moveToDelay(this._offset[0], this._offset[1], this._offset[2] + zoom);
    },
    moveToDelay: function (x, y, z) {
      var delta = [x, y, z];
      this.translateDelay(vec3.sub(delta, delta, this._trans), DELAY_MOVE_TO);
    },
    setTrans: function (trans) {
      vec3.copy(this._trans, trans);
      if (this._projectionType === 'ORTHOGRAPHIC')
        this.updateOrtho();
      this.updateView();
    },
    getOrthoZoom: function () {
      return Math.abs(this._trans[2]) * 0.00055;
    },
    updateOrtho: function () {
      var delta = this.getOrthoZoom();
      var w = this._width * delta;
      var h = this._height * delta;
      mat4.ortho(this._proj, -w, w, -h, h, -this._near, this._far);
    },
    computePosition: function () {
      var view = this._view;
      var pos = [-view[12], -view[13], -view[14]];
      var rot = mat3.create();
      mat3.fromMat4(rot, view);
      return vec3.transformMat3(pos, pos, mat3.transpose(rot, rot));
    },
    resetView: function () {
      this._speed = Utils.SCALE * 0.9;
      this.centerDelay([0.0, 0.0, 0.0], DELAY_MOVE_TO);
      this.offsetDelay([0.0, 0.0, 0.0], DELAY_MOVE_TO);
      var delta = [0.0, 0.0, 30.0 + this._speed / 3.0];
      vec3.sub(delta, delta, this._trans);
      this.translateDelay(delta, DELAY_MOVE_TO);
      this.quatDelay([0.0, 0.0, 0.0, 1.0], DELAY_MOVE_TO);
    },
    resetViewFront: function () {
      this.quatDelay([0.0, 0.0, 0.0, 1.0], DELAY_SNAP);
    },
    resetViewBack: function () {
      this.quatDelay([0.0, 1.0, 0.0, 0.0], DELAY_SNAP);
    },
    resetViewTop: function () {
      this.quatDelay([Math.SQRT1_2, 0.0, 0.0, Math.SQRT1_2], DELAY_SNAP);
    },
    resetViewBottom: function () {
      this.quatDelay([-Math.SQRT1_2, 0.0, 0.0, Math.SQRT1_2], DELAY_SNAP);
    },
    resetViewLeft: function () {
      this.quatDelay([0.0, -Math.SQRT1_2, 0.0, Math.SQRT1_2], DELAY_SNAP);
    },
    resetViewRight: function () {
      this.quatDelay([0.0, Math.SQRT1_2, 0.0, Math.SQRT1_2], DELAY_SNAP);
    },
    toggleViewFront: function () {
      if (Math.abs(this._quatRot[3]) > 0.99) this.resetViewBack();
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
    computeWorldToScreenMatrix: function (mat) {
      mat = mat || mat4.create();
      return mat4.mul(mat, mat4.mul(mat, this._viewport, this._proj), this._view);
    },
    /** Project the mouse coordinate into the world coordinate at a given z */
    unproject: (function () {
      var mat = mat4.create();
      return function (mouseX, mouseY, z) {
        var out = [0.0, 0.0, 0.0];
        mat4.invert(mat, this.computeWorldToScreenMatrix(mat));
        return vec3.transformMat4(out, vec3.set(out, mouseX, this._height - mouseY, z), mat);
      };
    })(),
    /** Project a vertex onto the screen */
    project: (function () {
      var mat = mat4.create();
      return function (vector) {
        var out = [0.0, 0.0, 0.0];
        vec3.transformMat4(out, vector, this.computeWorldToScreenMatrix(mat));
        out[1] = this._height - out[1];
        return out;
      };
    })(),
    onResize: (function () {
      var tmp = [0.0, 0.0, 0.0];
      return function (width, height) {
        this._width = width;
        this._height = height;

        var vp = this._viewport;
        mat4.identity(vp);
        mat4.scale(vp, vp, vec3.set(tmp, 0.5 * width, 0.5 * height, 0.5));
        mat4.translate(vp, vp, vec3.set(tmp, 1.0, 1.0, 1.0));

        this.updateProjection();
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
        var qrot = this._quatRot;
        var min = Infinity;
        var id = 0;
        for (var i = 0; i < nbQComp; ++i) {
          var dot = quat.dot(qrot, qComp[i]);
          dot = 1 - dot * dot;
          if (min < dot)
            continue;
          min = dot;
          id = i;
        }
        this.quatDelay(qComp[id], DELAY_SNAP);
      };
    })(),
    clearTimerN: function (n) {
      window.clearInterval(this._timers[n]);
      this._timers[n] = 0;
    },
    delay: function (cb, duration, name) {
      var nTimer = name || 'default';
      if (this._timers[nTimer])
        this.clearTimerN(nTimer);

      if (duration === 0.0)
        return cb(1.0);
      else if (duration < 0.0)
        return;

      var lastR = 0;
      var tStart = (new Date()).getTime();
      this._timers[nTimer] = window.setInterval(function () {
        var r = ((new Date()).getTime() - tStart) / duration;
        r = easeOutQuart(r);
        cb(r - lastR, r);
        lastR = r;
        if (r >= 1.0)
          this.clearTimerN(nTimer);
      }.bind(this), 16.6);
    },
    _translateDelta: function (delta, dr) {
      var trans = this._trans;
      vec3.scaleAndAdd(trans, trans, delta, dr);
      this.setTrans(trans);
      this._main.render();
    },
    translateDelay: function (delta, duration) {
      var cb = this._translateDelta.bind(this, delta);
      this.delay(cb, duration, 'translate');
    },
    _rotDelta: (function () {
      var qTmp = [0.0, 0.0, 0.0, 0.0];
      return function (delta, dr) {
        if (this._mode === 'ORBIT') {
          var rx = this._rotX + delta[0] * dr;
          var ry = this._rotY + delta[1] * dr;
          this.setOrbit(rx, ry);
        } else {
          quat.mul(this._quatRot, quat.setAxisAngle(qTmp, delta, delta[3] * dr), this._quatRot);
        }
        this.updateView();
        this._main.render();
      };
    })(),
    rotateDelay: function (delta, duration) {
      var cb = this._rotDelta.bind(this, delta);
      this.delay(cb, duration, 'rotate');
    },
    _quatDelta: (function () {
      var qr = [0.0, 0.0, 0.0, 0.0];
      return function (qDelta, dr) {
        quat.identity(qr);
        quat.slerp(qr, qr, qDelta, dr);
        var qrt = this._quatRot;
        quat.mul(this._quatRot, this._quatRot, qr);

        if (this._mode === 'ORBIT') {
          var qx = qrt[0];
          var qy = qrt[1];
          var qz = qrt[2];
          var qw = qrt[3];
          // find back euler values
          this._rotY = Math.atan2(2 * (qw * qy + qz * qx), 1 - 2 * (qy * qy + qz * qz));
          this._rotX = Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qz * qz + qx * qx));
        }

        this.updateView();
        this._main.render();
      };
    })(),
    quatDelay: function (target, duration) {
      var qDelta = [0.0, 0.0, 0.0, 0.0];
      quat.conjugate(qDelta, this._quatRot);
      quat.mul(qDelta, qDelta, target);
      quat.normalize(qDelta, qDelta);

      var cb = this._quatDelta.bind(this, qDelta);
      this.delay(cb, duration, 'quat');
    },
    _centerDelta: function (delta, dr) {
      vec3.scaleAndAdd(this._center, this._center, delta, dr);
      this.updateView();
      this._main.render();
    },
    centerDelay: function (target, duration) {
      var delta = [0.0, 0.0, 0.0];
      vec3.sub(delta, target, this._center);
      var cb = this._centerDelta.bind(this, delta);
      this.delay(cb, duration, 'center');
    },
    _offsetDelta: function (delta, dr) {
      vec3.scaleAndAdd(this._offset, this._offset, delta, dr);
      this.updateView();
      this._main.render();
    },
    offsetDelay: function (target, duration) {
      var delta = [0.0, 0.0, 0.0];
      vec3.sub(delta, target, this._offset);
      var cb = this._offsetDelta.bind(this, delta);
      this.delay(cb, duration, 'offset');
    },
    computeFrustumFit: function () {
      var near = this._near;
      var x;

      if (this._projectionType === 'ORTHOGRAPHIC') {
        x = Math.min(this._width, this._height) / near * 0.5;
        return Math.sqrt(1.0 + x * x) / x;
      }

      var proj = this._proj;
      var left = near * (proj[8] - 1.0) / proj[0];
      var right = near * (1.0 + proj[8]) / proj[0];
      var top = near * (1.0 + proj[9]) / proj[5];
      var bottom = near * (proj[9] - 1.0) / proj[5];
      var vertical2 = Math.abs(right - left);
      var horizontal2 = Math.abs(top - bottom);

      x = Math.min(horizontal2, vertical2) / near * 0.5;
      return (this._fov / 45.0) * Math.sqrt(1.0 + x * x) / x;
    }
  };

  module.exports = Camera;
});