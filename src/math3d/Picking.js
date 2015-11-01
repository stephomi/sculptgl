define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Geometry = require('math3d/Geometry');
  var Tablet = require('misc/Tablet');
  var Utils = require('misc/Utils');
  var TR = require('gui/GuiTR');

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Picking = function (main, xSym) {
    this._mesh = null; // mesh
    this._main = main; // the camera
    this._pickedFace = -1; // face picked
    this._pickedVertices = []; // vertices selected
    this._interPoint = [0.0, 0.0, 0.0]; // intersection point (mesh local space)
    this._rLocal2 = 0.0; // radius of the selection area (local/object space)
    this._rWorld2 = 0.0; // radius of the selection area (world space)
    this._eyeDir = [0.0, 0.0, 0.0]; // eye direction

    this._xSym = !!xSym;

    this._pickedNormal = [0.0, 0.0, 0.0];
    // alpha stuffs
    this._alphaOrirign = [0.0, 0.0, 0.0];
    this._alphaSide = 0.0;
    this._alphaLookAt = mat4.create();
    this._alpha = null;
  };

  // TODO update i18n strings in a dynamic way
  Picking.INIT_ALPHAS_NAMES = [TR('alphaSquare'), TR('alphaSkin')];
  Picking.INIT_ALPHAS_PATHS = ['square.jpg', 'skin.jpg'];

  var none = TR('alphaNone');
  Picking.ALPHAS_NAMES = {};
  Picking.ALPHAS_NAMES[none] = none;

  Picking.ALPHAS = {};
  Picking.ALPHAS[Picking.ALPHAS_NAMES] = null;

  Picking.addAlpha = function (u8, width, height, name) {
    var newAlpha = {};
    newAlpha._name = name;
    newAlpha._texture = u8;
    newAlpha._ratioX = Math.max(1.0, width / height);
    newAlpha._ratioY = Math.max(1.0, height / width);
    newAlpha._ratioMax = Math.max(this._ratioX, this._ratioY);
    newAlpha._width = width;
    newAlpha._height = height;
    var i = 1;
    while (Picking.ALPHAS[newAlpha._name])
      newAlpha._name = name + (i++);
    Picking.ALPHAS[newAlpha._name] = newAlpha;
    Picking.ALPHAS_NAMES[newAlpha._name] = newAlpha._name;
    return newAlpha;
  };

  Picking.prototype = {
    setIdAlpha: function (id) {
      this._alpha = Picking.ALPHAS[id];
    },
    getAlpha: function (x, y, z) {
      var alpha = this._alpha;
      if (!alpha || !alpha._texture) return 1.0;

      var m = this._alphaLookAt;
      var rs = this._alphaSide;

      var xn = alpha._ratioY * (m[0] * x + m[4] * y + m[8] * z + m[12]) / (this._xSym ? -rs : rs);
      if (Math.abs(xn) > 1.0) return 0.0;

      var yn = alpha._ratioX * (m[1] * x + m[5] * y + m[9] * z + m[13]) / rs;
      if (Math.abs(yn) > 1.0) return 0.0;

      var aw = alpha._width;
      xn = (0.5 - xn * 0.5) * aw;
      yn = (0.5 - yn * 0.5) * alpha._height;
      return alpha._texture[(xn | 0) + aw * (yn | 0)] / 255.0;
    },
    updateAlpha: (function () {
      var nor = [0.0, 0.0, 0.0];
      var dir = [0.0, 0.0, 0.0];
      return function (keepOrigin) {
        var radius = Math.sqrt(this._rLocal2);
        this._alphaSide = radius * Math.SQRT1_2;

        vec3.sub(dir, this._interPoint, this._alphaOrirign);
        if (vec3.len(dir) === 0) return;
        vec3.normalize(dir, dir);

        var normal = this._pickedNormal;
        vec3.scaleAndAdd(dir, dir, normal, -vec3.dot(dir, normal));
        vec3.normalize(dir, dir);

        if (!keepOrigin)
          vec3.copy(this._alphaOrirign, this._interPoint);

        vec3.scaleAndAdd(nor, this._alphaOrirign, normal, radius);
        mat4.lookAt(this._alphaLookAt, this._alphaOrirign, nor, dir);
      };
    })(),
    initAlpha: function () {
      this.computePickedNormal();
      this.updateAlpha();
    },
    getMesh: function () {
      return this._mesh;
    },
    setLocalRadius2: function (radius) {
      this._rLocal2 = radius;
    },
    getLocalRadius2: function () {
      return this._rLocal2;
    },
    getLocalRadius: function () {
      return Math.sqrt(this._rLocal2);
    },
    getWorldRadius2: function () {
      return this._rWorld2;
    },
    getWorldRadius: function () {
      return Math.sqrt(this._rWorld2);
    },
    setIntersectionPoint: function (inter) {
      this._interPoint = inter;
    },
    getEyeDirection: function () {
      return this._eyeDir;
    },
    getIntersectionPoint: function () {
      return this._interPoint;
    },
    getPickedVertices: function () {
      return this._pickedVertices;
    },
    getPickedFace: function () {
      return this._pickedFace;
    },
    getPickedNormal: function () {
      return this._pickedNormal;
    },
    /** Intersection between a ray the mouse position for every meshes */
    intersectionMouseMeshes: (function () {
      var vNearTransform = [0.0, 0.0, 0.0];
      var vFarTransform = [0.0, 0.0, 0.0];
      var matInverse = mat4.create();
      var nearPoint = [0.0, 0.0, 0.0];
      return function (meshes, mouseX, mouseY) {

        var main = this._main;
        if (!meshes) meshes = main.getMeshes();
        if (mouseX === undefined) mouseX = main._mouseX;
        if (mouseY === undefined) mouseY = main._mouseY;

        var vNear = this.unproject(mouseX, mouseY, 0.0);
        var vFar = this.unproject(mouseX, mouseY, 0.1);
        var nearDistance = Infinity;
        var nearMesh = null;
        var nearFace = -1;

        for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
          var mesh = meshes[i];
          mat4.invert(matInverse, mesh.getMatrix());
          vec3.transformMat4(vNearTransform, vNear, matInverse);
          vec3.transformMat4(vFarTransform, vFar, matInverse);
          if (!this.intersectionRayMesh(mesh, vNearTransform, vFarTransform))
            continue;

          var interTest = this.getIntersectionPoint();
          var testDistance = vec3.dist(vNearTransform, interTest) * mesh.getScale();
          if (testDistance < nearDistance) {
            nearDistance = testDistance;
            nearMesh = mesh;
            vec3.copy(nearPoint, interTest);
            nearFace = this.getPickedFace();
          }
        }

        this._mesh = nearMesh;
        vec3.copy(this._interPoint, nearPoint);
        this._pickedFace = nearFace;
        if (nearFace !== -1)
          this.updateLocalAndWorldRadius2();
        return !!nearMesh;
      };
    })(),
    /** Intersection between a ray the mouse position */
    intersectionMouseMesh: function (mesh, mouseX, mouseY) {
      var main = this._main;
      if (!mesh) mesh = main.getMesh();
      if (mouseX === undefined) mouseX = main._mouseX;
      if (mouseY === undefined) mouseY = main._mouseY;

      var vNear = this.unproject(mouseX, mouseY, 0.0);
      var vFar = this.unproject(mouseX, mouseY, 0.1);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      return this.intersectionRayMesh(mesh, vNear, vFar);
    },
    /** Intersection between a ray and a mesh */
    intersectionRayMesh: (function () {
      var v1 = [0.0, 0.0, 0.0];
      var v2 = [0.0, 0.0, 0.0];
      var v3 = [0.0, 0.0, 0.0];
      var vertInter = [0.0, 0.0, 0.0];
      var vNear = [0.0, 0.0, 0.0];
      var vFar = [0.0, 0.0, 0.0];
      return function (mesh, vNearOrig, vFarOrig) {
        // resest picking
        this._mesh = null;
        this._pickedFace = -1;
        // resest picking
        vec3.copy(vNear, vNearOrig);
        vec3.copy(vFar, vFarOrig);
        // apply symmetry
        if (this._xSym) {
          var ptPlane = mesh.getSymmetryOrigin();
          var nPlane = mesh.getSymmetryNormal();
          Geometry.mirrorPoint(vNear, ptPlane, nPlane);
          Geometry.mirrorPoint(vFar, ptPlane, nPlane);
        }
        var vAr = mesh.getVertices();
        var fAr = mesh.getFaces();
        // compute eye direction
        var eyeDir = this.getEyeDirection();
        vec3.sub(eyeDir, vFar, vNear);
        vec3.normalize(eyeDir, eyeDir);
        var iFacesCandidates = mesh.intersectRay(vNear, eyeDir, mesh.getNbFaces());
        var distance = Infinity;
        var nbFacesCandidates = iFacesCandidates.length;
        for (var i = 0; i < nbFacesCandidates; ++i) {
          var indFace = iFacesCandidates[i] * 4;
          var ind1 = fAr[indFace] * 3;
          var ind2 = fAr[indFace + 1] * 3;
          var ind3 = fAr[indFace + 2] * 3;
          v1[0] = vAr[ind1];
          v1[1] = vAr[ind1 + 1];
          v1[2] = vAr[ind1 + 2];
          v2[0] = vAr[ind2];
          v2[1] = vAr[ind2 + 1];
          v2[2] = vAr[ind2 + 2];
          v3[0] = vAr[ind3];
          v3[1] = vAr[ind3 + 1];
          v3[2] = vAr[ind3 + 2];
          var hitDist = Geometry.intersectionRayTriangle(vNear, eyeDir, v1, v2, v3, vertInter);
          if (hitDist < 0.0) {
            ind2 = fAr[indFace + 3] * 3;
            if (ind2 >= 0) {
              v2[0] = vAr[ind2];
              v2[1] = vAr[ind2 + 1];
              v2[2] = vAr[ind2 + 2];
              hitDist = Geometry.intersectionRayTriangle(vNear, eyeDir, v1, v3, v2, vertInter);
            }
          }
          if (hitDist >= 0.0 && hitDist < distance) {
            distance = hitDist;
            vec3.copy(this._interPoint, vertInter);
            this._pickedFace = iFacesCandidates[i];
          }
        }
        if (this._pickedFace !== -1) {
          this._mesh = mesh;
          this.updateLocalAndWorldRadius2();
          return true;
        }
        this._rLocal2 = 0.0;
        return false;
      };
    })(),
    /** Find all the vertices inside the sphere */
    pickVerticesInSphere: function (rLocal2) {
      var mesh = this._mesh;
      var vAr = mesh.getVertices();
      var vertSculptFlags = mesh.getVerticesSculptFlags();
      var leavesHit = mesh.getLeavesUpdate();
      var inter = this.getIntersectionPoint();

      var iFacesInCells = mesh.intersectSphere(inter, rLocal2, leavesHit, mesh.getNbFaces());
      var iVerts = mesh.getVerticesFromFaces(iFacesInCells);
      var nbVerts = iVerts.length;

      var sculptFlag = ++Utils.SCULPT_FLAG;
      var pickedVertices = new Uint32Array(Utils.getMemory(4 * nbVerts + 12), 0, nbVerts + 3);
      var acc = 0;
      var itx = inter[0];
      var ity = inter[1];
      var itz = inter[2];

      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i];
        var j = ind * 3;
        var dx = itx - vAr[j];
        var dy = ity - vAr[j + 1];
        var dz = itz - vAr[j + 2];
        if ((dx * dx + dy * dy + dz * dz) < rLocal2) {
          vertSculptFlags[ind] = sculptFlag;
          pickedVertices[acc++] = ind;
        }
      }

      this._pickedVertices = new Uint32Array(pickedVertices.subarray(0, acc));
      return this._pickedVertices;
    },
    /** Find all the vertices inside the sphere (with topological check) */
    pickVerticesInSphereTopological: function (rLocal2) {
      var mesh = this._mesh;
      var nbVertices = mesh.getNbVertices();
      var vAr = mesh.getVertices();
      var fAr = mesh.getFaces();

      var vrvStartCount = mesh.getVerticesRingVertStartCount();
      var vertRingVert = mesh.getVerticesRingVert();
      var ringVerts = vertRingVert instanceof Array ? vertRingVert : null;

      var vertSculptFlags = mesh.getVerticesSculptFlags();
      var sculptFlag = ++Utils.SCULPT_FLAG;

      var idf = this.getPickedFace();
      var pickedVertices = new Uint32Array(Utils.getMemory(4 * nbVertices), 0, nbVertices);
      pickedVertices[0] = fAr[idf * 4];
      var acc = 1;

      var inter = this.getIntersectionPoint();
      var itx = inter[0];
      var ity = inter[1];
      var itz = inter[2];
      for (var i = 0; i < acc; ++i) {
        var id = pickedVertices[i];
        var start, end;
        if (ringVerts) {
          vertRingVert = ringVerts[id];
          start = 0;
          end = vertRingVert.length;
        } else {
          start = vrvStartCount[id * 2];
          end = start + vrvStartCount[id * 2 + 1];
        }

        for (var j = start; j < end; ++j) {
          var idv = vertRingVert[j];
          if (vertSculptFlags[idv] === sculptFlag)
            continue;
          vertSculptFlags[idv] = sculptFlag;
          var id3 = idv * 3;
          var dx = itx - vAr[id3];
          var dy = ity - vAr[id3 + 1];
          var dz = itz - vAr[id3 + 2];
          if ((dx * dx + dy * dy + dz * dz) > rLocal2)
            continue;
          pickedVertices[acc++] = idv;
        }
      }
      this._pickedVertices = new Uint32Array(pickedVertices.subarray(1, acc));
      return this._pickedVertices;
    },
    computeWorldRadius2: (function () {
      var inter = [0.0, 0.0, 0.0];

      return function (ignorePressure) {

        vec3.transformMat4(inter, this.getIntersectionPoint(), this._mesh.getMatrix());

        var offsetX = this._main.getSculpt().getCurrentTool().getScreenRadius();
        if (!ignorePressure) offsetX *= Tablet.getPressureRadius();

        var screenInter = this.project(inter);
        return vec3.sqrDist(inter, this.unproject(screenInter[0] + offsetX, screenInter[1], screenInter[2]));
      };
    })(),
    updateLocalAndWorldRadius2: function () {
      if (!this._mesh) return;
      this._rWorld2 = this.computeWorldRadius2();
      this._rLocal2 = this._rWorld2 / this._mesh.getScale2();
    },
    unproject: function (x, y, z) {
      return this._main.getCamera().unproject(x, y, z);
    },
    project: function (vec) {
      return this._main.getCamera().project(vec);
    },
    computePickedNormal: function () {
      if (!this._mesh || this._pickedFace < 0) return;
      this.polyLerp(this._mesh.getNormals(), this._pickedNormal);
      return vec3.normalize(this._pickedNormal, this._pickedNormal);
    },
    polyLerp: function (vField, out) {
      var vAr = this._mesh.getVertices();
      var fAr = this._mesh.getFaces();
      var id = this._pickedFace * 4;
      var iv1 = fAr[id] * 3;
      var iv2 = fAr[id + 1] * 3;
      var iv3 = fAr[id + 2] * 3;
      var iv4 = fAr[id + 3] * 3;

      var len1 = 1.0 / vec3.dist(this._interPoint, vAr.subarray(iv1, iv1 + 3));
      var len2 = 1.0 / vec3.dist(this._interPoint, vAr.subarray(iv2, iv2 + 3));
      var len3 = 1.0 / vec3.dist(this._interPoint, vAr.subarray(iv3, iv3 + 3));
      var len4 = iv4 >= 0 ? 1.0 / vec3.dist(this._interPoint, vAr.subarray(iv4, iv4 + 3)) : 0.0;

      var invSum = 1.0 / (len1 + len2 + len3 + len4);
      vec3.set(out, 0.0, 0.0, 0.0);
      vec3.scaleAndAdd(out, out, vField.subarray(iv1, iv1 + 3), len1 * invSum);
      vec3.scaleAndAdd(out, out, vField.subarray(iv2, iv2 + 3), len2 * invSum);
      vec3.scaleAndAdd(out, out, vField.subarray(iv3, iv3 + 3), len3 * invSum);
      if (iv4 >= 0) vec3.scaleAndAdd(out, out, vField.subarray(iv4, iv4 + 3), len4 * invSum);
      return out;
    }
  };

  module.exports = Picking;
});