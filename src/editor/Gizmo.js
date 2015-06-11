define([
  'lib/glMatrix',
  'mesh/Primitive'
], function (glm, Primitive) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  var createGizmo = function (type, nbAxis) {
    return {
      _finalMatrix: mat4.create(),
      _baseMatrix: mat4.create(),
      _color: vec3.create(),
      _colorSelect: vec3.fromValues(1.0, 1.0, 0.0),
      _drawGeo: null,
      _pickGeo: null,
      _isSelected: false,
      _type: type !== undefined ? type : -1,
      _nbAxis: nbAxis !== undefined ? nbAxis : -1,
      _lastInter: [0.0, 0.0, 0.0],
      updateMatrix: function () {
        mat4.copy(this._drawGeo.getMatrix(), this._finalMatrix);
        mat4.copy(this._pickGeo.getMatrix(), this._finalMatrix);
      }
    };
  };

  // edit masks
  var TRANS_X = 1 << 0;
  var TRANS_Y = 1 << 1;
  var TRANS_Z = 1 << 2;
  var ROT_X = 1 << 3;
  var ROT_Y = 1 << 4;
  var ROT_Z = 1 << 5;
  var ROT_W = 1 << 6;
  var PLANE_XY = 1 << 7;
  var PLANE_XZ = 1 << 8;
  var PLANE_YZ = 1 << 9;
  var SCALE_X = 1 << 10;
  var SCALE_Y = 1 << 11;
  var SCALE_Z = 1 << 12;

  var TRANS_XYZ = TRANS_X | TRANS_Y | TRANS_Z;
  var ROT_XYZ = ROT_X | ROT_Y | ROT_Z;
  var PLANE_XYZ = PLANE_XY | PLANE_XZ | PLANE_YZ;
  var SCALE_XYZ = SCALE_X | SCALE_Y | SCALE_Z;

  var Gizmo = function (main) {
    this._main = main;
    this._gl = main._gl;

    // trans arrow 1 dim
    this._transX = createGizmo(TRANS_X, 0);
    this._transY = createGizmo(TRANS_Y, 1);
    this._transZ = createGizmo(TRANS_Z, 2);

    // trans plane 2 dim
    this._planeXY = createGizmo(PLANE_XY);
    this._planeXZ = createGizmo(PLANE_XZ);
    this._planeYZ = createGizmo(PLANE_YZ);

    // scale square 1 dim
    this._scaleX = createGizmo(SCALE_X, 0);
    this._scaleY = createGizmo(SCALE_Y, 1);
    this._scaleZ = createGizmo(SCALE_Z, 2);

    // rot arc 1 dim
    this._rotX = createGizmo(ROT_X, 0);
    this._rotY = createGizmo(ROT_Y, 1);
    this._rotZ = createGizmo(ROT_Z, 2);
    this._rotXYZ = createGizmo(ROT_W);

    // line helper
    this._lineHelper = Primitive.createLine2D(this._gl);
    this._lineHelper.setShader('FLAT');

    this._lastDistToEye = 0.0;
    this._isEditing = false;

    this._selected = null;
    this._pickables = [];

    // editing lines stuffs
    this._editLineOrigin = [0.0, 0.0, 0.0];
    this._editLineDirection = [0.0, 0.0, 0.0];
    this._editOffset = [0.0, 0.0, 0.0];

    // cached matrices when starting the editing operations
    this._editLocal = mat4.create();
    this._editTrans = mat4.create();
    this._editScaleRot = mat4.create();
    // same for inv
    this._editLocalInv = mat4.create();
    this._editTransInv = mat4.create();
    this._editScaleRotInv = mat4.create();

    this.initTranslate();
    this.initRotate();
    this.initPickables();
  };

  // configs
  var COLOR_X = vec3.fromValues(0.7, 0.2, 0.2);
  var COLOR_Y = vec3.fromValues(0.2, 0.7, 0.2);
  var COLOR_Z = vec3.fromValues(0.2, 0.2, 0.7);
  var COLOR_XYZ = vec3.fromValues(0.4, 0.4, 0.4);
  var GIZMO_SIZE = 0.08;
  var THICK = 0.02;
  var PICK_THICK = THICK * 5.0;
  var ARROW_LENGTH = 2.5;
  var TORUS_RADIUS = 1.5;

  Gizmo.prototype = {
    initPickables: function () {
      var pickables = this._pickables;
      pickables.push(this._transX._pickGeo);
      pickables.push(this._transY._pickGeo);
      pickables.push(this._transZ._pickGeo);
      pickables.push(this._rotX._pickGeo);
      pickables.push(this._rotY._pickGeo);
      pickables.push(this._rotZ._pickGeo);
    },
    _createArrow: function (tra, axis, color) {
      var mat = tra._baseMatrix;
      mat4.rotate(mat, mat, Math.PI * 0.5, axis);
      mat4.translate(mat, mat, [0.0, ARROW_LENGTH * 0.5, 0.0]);
      vec3.copy(tra._color, color);

      tra._pickGeo = Primitive.createArrow(this._gl, PICK_THICK, ARROW_LENGTH, 2.0, 0.2);
      tra._pickGeo._gizmo = tra;
      tra._drawGeo = Primitive.createArrow(this._gl, THICK, ARROW_LENGTH);
      tra._drawGeo.setShader('FLAT');
    },
    initTranslate: function () {
      var axis = [0.0, 0.0, 0.0];
      this._createArrow(this._transX, vec3.set(axis, 0.0, 0.0, -1.0), COLOR_X);
      this._createArrow(this._transY, vec3.set(axis, 0.0, 1.0, 0.0), COLOR_Y);
      this._createArrow(this._transZ, vec3.set(axis, 1.0, 0.0, 0.0), COLOR_Z);
    },
    _createCircle: function (rot, rad, color) {
      vec3.copy(rot._color, color);
      rot._pickGeo = Primitive.createTorus(this._gl, TORUS_RADIUS, PICK_THICK, rad, 6, 64);
      rot._pickGeo._gizmo = rot;
      rot._drawGeo = Primitive.createTorus(this._gl, TORUS_RADIUS, THICK, rad, 6, 64);
      rot._drawGeo.setShader('FLAT');
    },
    initRotate: function () {
      this._createCircle(this._rotX, Math.PI, COLOR_X);
      this._createCircle(this._rotY, Math.PI, COLOR_Y);
      this._createCircle(this._rotZ, Math.PI, COLOR_Z);
      this._createCircle(this._rotXYZ, Math.PI * 2, COLOR_XYZ);
    },
    updateArcRotation: (function () {
      var qTmp = quat.create();
      return function (eye) {
        // xyz arc
        qTmp[0] = eye[2];
        qTmp[1] = 0.0;
        qTmp[2] = -eye[0];
        qTmp[3] = 1.0 + eye[1];
        quat.normalize(qTmp, qTmp);
        mat4.fromQuat(this._rotXYZ._baseMatrix, qTmp);

        // x arc
        quat.rotateZ(qTmp, quat.identity(qTmp), Math.PI * 0.5);
        quat.rotateY(qTmp, qTmp, Math.atan2(-eye[1], -eye[2]));
        mat4.fromQuat(this._rotX._baseMatrix, qTmp);

        // y arc
        quat.rotateY(qTmp, quat.identity(qTmp), Math.atan2(-eye[0], -eye[2]));
        mat4.fromQuat(this._rotY._baseMatrix, qTmp);

        // z arc
        quat.rotateX(qTmp, quat.identity(qTmp), Math.PI * 0.5);
        quat.rotateY(qTmp, qTmp, Math.atan2(-eye[0], eye[1]));
        mat4.fromQuat(this._rotZ._baseMatrix, qTmp);
      };
    })(),
    computeCenterGizmo: function (center) {
      var mesh = this._main.getMesh();
      center = center || [0.0, 0.0, 0.0];
      if (mesh) {
        vec3.copy(center, mesh.getCenter());
        vec3.transformMat4(center, center, mesh.getEditMatrix());
        vec3.transformMat4(center, center, mesh.getMatrix());
      }
      return center;
    },
    updateMatrices: function (camera) {
      var trMesh = this.computeCenterGizmo();
      var eye = camera.computePosition();

      this._lastDistToEye = this._isEditing ? this._lastDistToEye : vec3.dist(eye, trMesh);
      var scaleFactor = this._lastDistToEye * GIZMO_SIZE / camera.getConstantScreen();

      var traScale = mat4.create();
      mat4.translate(traScale, traScale, trMesh);
      mat4.scale(traScale, traScale, [scaleFactor, scaleFactor, scaleFactor]);

      // manage arc stuffs
      this.updateArcRotation(vec3.normalize(eye, vec3.sub(eye, trMesh, eye)));

      mat4.mul(this._transX._finalMatrix, traScale, this._transX._baseMatrix);
      mat4.mul(this._transY._finalMatrix, traScale, this._transY._baseMatrix);
      mat4.mul(this._transZ._finalMatrix, traScale, this._transZ._baseMatrix);
      mat4.mul(this._rotX._finalMatrix, traScale, this._rotX._baseMatrix);

      mat4.mul(this._rotY._finalMatrix, traScale, this._rotY._baseMatrix);
      mat4.mul(this._rotZ._finalMatrix, traScale, this._rotZ._baseMatrix);
      mat4.mul(this._rotXYZ._finalMatrix, traScale, this._rotXYZ._baseMatrix);
    },
    drawGizmo: function (elt, camera) {
      elt.updateMatrix();
      var drawGeo = elt._drawGeo;
      drawGeo.setFlatColor(elt._isSelected ? elt._colorSelect : elt._color);
      drawGeo.updateMatrices(camera);
      drawGeo.render(this._main);
    },
    addGizmoToScene: function (scene) {
      scene.push(this._transX._drawGeo);
      scene.push(this._transY._drawGeo);
      scene.push(this._transZ._drawGeo);
      scene.push(this._rotX._drawGeo);
      scene.push(this._rotY._drawGeo);
      scene.push(this._rotZ._drawGeo);
      scene.push(this._rotXYZ._drawGeo);
      return scene;
    },
    updateLineHelper: function (x1, y1, x2, y2) {
      var vAr = this._lineHelper.getVertices();
      var main = this._main;
      var width = main._canvas.width;
      var height = main._canvas.height;
      vAr[0] = ((x1 / width) * 2.0) - 1.0;
      vAr[1] = (((height - y1) / height)) * 2.0 - 1.0;
      vAr[3] = ((x2 / width) * 2.0) - 1.0;
      vAr[4] = (((height - y2) / height)) * 2.0 - 1.0;
      this._lineHelper.updateVertexBuffer();
    },
    render: function () {
      var main = this._main;
      var camera = main.getCamera();
      this.updateMatrices(camera, main);

      var type = this._isEditing && this._selected ? this._selected._type : -1;

      if (type & ROT_XYZ) this.drawGizmo(this._rotXYZ, camera, main);

      if (type & TRANS_X) this.drawGizmo(this._transX, camera, main);
      if (type & TRANS_Y) this.drawGizmo(this._transY, camera, main);
      if (type & TRANS_Z) this.drawGizmo(this._transZ, camera, main);

      if (type & ROT_X) this.drawGizmo(this._rotX, camera, main);
      if (type & ROT_Y) this.drawGizmo(this._rotY, camera, main);
      if (type & ROT_Z) this.drawGizmo(this._rotZ, camera, main);

      if (this._isEditing) this._lineHelper.render(main);
    },
    onMouseOver: function () {
      if (this._isEditing) {
        var type = this._selected._type;
        if (type & ROT_XYZ) this.updateRotateEdit();
        else if (type & TRANS_XYZ) this.updateTranslateEdit();
        else if (type & PLANE_XYZ) this.updatePlaneEdit();
        else if (type & SCALE_XYZ) this.updateScaleEdit();

        return true;
      }

      var main = this._main;
      var picking = main.getPicking();
      var mx = main._mouseX;
      var my = main._mouseY;
      var pickables = this._pickables;
      picking.intersectionMouseMeshes(pickables, mx, my);

      if (this._selected)
        this._selected._isSelected = false;
      var geo = picking.getMesh();
      if (!geo) {
        this._selected = null;
        return false;
      }

      this._selected = geo._gizmo;
      this._selected._isSelected = true;
      vec3.copy(this._selected._lastInter, picking.getIntersectionPoint());
      return true;
    },
    onMouseDown: function () {
      var sel = this._selected;
      if (!sel)
        return false;

      this._isEditing = true;
      var type = sel._type;
      this.saveEditMatrices();

      if (type & ROT_XYZ) this.startRotateEdit();
      else if (type & TRANS_XYZ) this.startTranslateEdit();
      else if (type & PLANE_XYZ) this.startPlaneEdit();
      else if (type & SCALE_XYZ) this.startScaleEdit();

      return true;
    },
    onMouseUp: function () {
      this._isEditing = false;
    },
    saveEditMatrices: function () {
      // mesh local matrix
      mat4.copy(this._editLocal, this._main.getMesh().getMatrix());

      // translation part
      var center = this.computeCenterGizmo();
      mat4.translate(this._editTrans, mat4.identity(this._editTrans), center);

      // rotation + scale part
      mat4.copy(this._editScaleRot, this._editLocal);
      this._editScaleRot[12] = this._editScaleRot[13] = this._editScaleRot[14] = 0.0;

      // precomputes the invert
      mat4.invert(this._editLocalInv, this._editLocal);
      mat4.invert(this._editTransInv, this._editTrans);
      mat4.invert(this._editScaleRotInv, this._editScaleRot);
    },
    startRotateEdit: function () {
      var main = this._main;
      var camera = main.getCamera();

      // 3d origin (center of gizmo)
      var projCenter = [0.0, 0.0, 0.0];
      this.computeCenterGizmo(projCenter);
      vec3.copy(projCenter, camera.project(projCenter));

      // compute tangent direction and project it on screen
      var dir = this._editLineDirection;
      var sign = this._selected._nbAxis === 0 ? -1.0 : 1.0;
      var lastInter = this._selected._lastInter;
      vec3.set(dir, -sign * lastInter[2], -sign * lastInter[1], sign * lastInter[0]);
      vec3.transformMat4(dir, dir, this._selected._finalMatrix);
      vec3.copy(dir, camera.project(dir));

      vec2.normalize(dir, vec2.sub(dir, dir, projCenter));

      vec2.set(this._editLineOrigin, main._mouseX, main._mouseY);
    },
    startTranslateEdit: function () {
      var main = this._main;
      var camera = main.getCamera();

      var origin = this._editLineOrigin;
      var dir = this._editLineDirection;

      // 3d origin (center of gizmo)
      this.computeCenterGizmo(origin);

      // 3d direction
      vec3.set(dir, 0.0, 0.0, 0.0)[this._selected._nbAxis] = 1.0;
      vec3.add(dir, origin, dir);

      // project on canvas and get a 2D line
      vec3.copy(origin, camera.project(origin));
      vec3.copy(dir, camera.project(dir));

      vec2.normalize(dir, vec2.sub(dir, dir, origin));

      var offset = this._editOffset;
      offset[0] = main._mouseX - origin[0];
      offset[1] = main._mouseY - origin[1];
    },
    startPlaneEdit: function () {},
    startScaleEdit: function () {},
    updateRotateEdit: function () {
      var main = this._main;
      var mesh = main.getMesh();

      var origin = this._editLineOrigin;
      var dir = this._editLineDirection;

      var vec = [main._mouseX, main._mouseY, 0.0];
      vec2.sub(vec, vec, origin);
      var dist = vec2.dot(vec, dir);

      // helper line
      this.updateLineHelper(origin[0], origin[1], origin[0] + dir[0] * dist, origin[1] + dir[1] * dist);

      var angle = 7 * dist / Math.min(main._canvas.width, main._canvas.height);
      angle %= (Math.PI * 2);
      var nbAxis = this._selected._nbAxis;

      var mrot = mesh.getEditMatrix();
      mat4.identity(mrot);
      if (nbAxis === 0) mat4.rotateX(mrot, mrot, -angle);
      else if (nbAxis === 1) mat4.rotateY(mrot, mrot, -angle);
      else if (nbAxis === 2) mat4.rotateZ(mrot, mrot, -angle);

      mat4.mul(mrot, this._editTrans, mrot);
      mat4.mul(mrot, mrot, this._editTransInv);

      mat4.mul(mrot, this._editLocalInv, mrot);
      mat4.mul(mrot, mrot, this._editLocal);

      main.render();
    },
    updateTranslateEdit: function () {
      var main = this._main;
      var camera = main.getCamera();
      var mesh = main.getMesh();

      var origin = this._editLineOrigin;
      var dir = this._editLineDirection;

      var vec = [main._mouseX, main._mouseY, 0.0];
      vec2.sub(vec, vec, origin);
      vec2.sub(vec, vec, this._editOffset);
      vec2.scaleAndAdd(vec, origin, dir, vec2.dot(vec, dir));

      // helper line
      this.updateLineHelper(origin[0], origin[1], vec[0], vec[1]);

      var near = camera.unproject(vec[0], vec[1], 0.0);
      var far = camera.unproject(vec[0], vec[1], 0.1);

      vec3.transformMat4(near, near, this._editTransInv);
      vec3.transformMat4(far, far, this._editTransInv);

      // intersection line line
      vec3.normalize(vec, vec3.sub(vec, far, near));

      var inter = [0.0, 0.0, 0.0];
      inter[this._selected._nbAxis] = 1.0;

      var a01 = -vec3.dot(vec, inter);
      var b0 = vec3.dot(near, vec);
      var det = Math.abs(1.0 - a01 * a01);

      var b1 = -vec3.dot(near, inter);
      inter[this._selected._nbAxis] = (a01 * b0 - b1) / det;

      vec3.transformMat4(inter, inter, this._editScaleRotInv);
      var edim = mesh.getEditMatrix();
      mat4.identity(edim);
      mat4.translate(edim, edim, inter);

      main.render();
    },
    updatePlaneEdit: function () {},
    updateScaleEdit: function () {},
    //     startSculpt: (function () {
    //       var tmp = [0.0, 0.0, 0.0];
    //       return function () {
    //         var matrix = this._mesh.getMatrix();
    //         mat4.invert(this._matrixInv, matrix);
    //         vec3.transformMat4(tmp, this._mesh.getCenter(), matrix);
    //         mat4.translate(this._preTranslate, mat4.identity(this._preTranslate), tmp);
    //         mat4.translate(this._postTranslate, mat4.identity(this._postTranslate), vec3.negate(tmp, tmp));

    //         var main = this._main;
    //         this._refMX = main._mouseX;
    //         this._refMY = main._mouseY;
    //       };
    //     })(),
    //     update: (function () {
    //       var tmp = [0.0, 0.0, 0.0];
    //       return function () {
    //         var main = this._main;
    //         tmp[0] = tmp[1] = tmp[2] = 1.0 + (main._mouseX - this._refMX + main._mouseY - this._refMY) / 400;
    //         var mEdit = this._mesh.getEditMatrix();
    //         mat4.identity(mEdit);
    //         mat4.scale(mEdit, mEdit, tmp);

    //         mat4.mul(mEdit, this._preTranslate, mEdit);
    //         mat4.mul(mEdit, mEdit, this._postTranslate);

    //         mat4.mul(mEdit, this._matrixInv, mEdit);
    //         mat4.mul(mEdit, mEdit, this._mesh.getMatrix());

    //         main.render();
    //         main.getCanvas().style.cursor = 'default';
    //       };
    //     })()
  };

  return Gizmo;
});