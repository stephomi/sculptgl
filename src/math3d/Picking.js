define([
  'lib/glMatrix',
  'math3d/Geometry',
  'mesh/Mesh',
  'misc/Tablet',
  'misc/Utils'
], function (glm, Geometry, Mesh, Tablet, Utils) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Picking(camera) {
    this.mesh_ = null; // mesh
    this.pickedFace_ = -1; // face picked
    this.pickedVertices_ = []; // vertices selected
    this.interPoint_ = [0.0, 0.0, 0.0]; // intersection point (mesh local space)
    this.rDisplay_ = 50.0; // radius of the selection area (screen space)
    this.rLocal2_ = 0.0; // radius of the selection area (local/object space)
    this.rWorld2_ = 0.0; // radius of the selection area (world space)
    this.camera_ = camera; // the camera
    this.eyeDir_ = [0.0, 0.0, 0.0]; // eye direction
  }

  Picking.prototype = {
    setLocalRadius2: function (radius) {
      this.rLocal2_ = radius;
    },
    setIntersectionPoint: function (inter) {
      this.interPoint_ = inter;
    },
    getScreenRadius: function () {
      return this.rDisplay_;
    },
    getEyeDirection: function () {
      return this.eyeDir_;
    },
    getLocalRadius2: function () {
      return this.rLocal2_;
    },
    getWorldRadius2: function () {
      return this.rWorld2_;
    },
    getIntersectionPoint: function () {
      return this.interPoint_;
    },
    getPickedVertices: function () {
      return this.pickedVertices_;
    },
    getPickedFace: function () {
      return this.pickedFace_;
    },
    /** Intersection between a ray the mouse position for every meshes */
    intersectionMouseMeshes: (function () {
      var vNearTransform = [0.0, 0.0, 0.0];
      var vFarTransform = [0.0, 0.0, 0.0];
      var matInverse = mat4.create();
      var nearPoint = [0.0, 0.0, 0.0];
      return function (meshes, mouseX, mouseY) {
        var vNear = this.camera_.unproject(mouseX, mouseY, 0.0);
        var vFar = this.camera_.unproject(mouseX, mouseY, 1.0);
        var nearDistance = Infinity;
        var nearMesh = null;
        var nearFace = -1;
        for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
          var mesh = meshes[i];
          mat4.invert(matInverse, mesh.getMatrix());
          vec3.transformMat4(vNearTransform, vNear, matInverse);
          vec3.transformMat4(vFarTransform, vFar, matInverse);
          this.intersectionRayMesh(mesh, vNearTransform, vFarTransform, mouseX, mouseY);
          if (this.mesh_ === null)
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
        this.mesh_ = nearMesh;
        vec3.copy(this.interPoint_, nearPoint);
        this.pickedFace_ = nearFace;
        if (nearFace !== -1)
          this.computeRadiusWorld2(mouseX, mouseY);
      };
    })(),
    /** Intersection between a ray the mouse position */
    intersectionMouseMesh: function (mesh, mouseX, mouseY, useSymmetry) {
      var vNear = this.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = this.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      this.intersectionRayMesh(mesh, vNear, vFar, mouseX, mouseY, useSymmetry);
    },
    /** Intersection between a ray and a mesh */
    intersectionRayMesh: (function () {
      var v1 = [0.0, 0.0, 0.0];
      var v2 = [0.0, 0.0, 0.0];
      var v3 = [0.0, 0.0, 0.0];
      var vertInter = [0.0, 0.0, 0.0];
      var vNear = [0.0, 0.0, 0.0];
      var vFar = [0.0, 0.0, 0.0];
      return function (mesh, vNearOrig, vFarOrig, mouseX, mouseY, useSymmetry) {
        // resest picking
        this.mesh_ = null;
        this.pickedFace_ = -1;
        // resest picking
        vec3.copy(vNear, vNearOrig);
        vec3.copy(vFar, vFarOrig);
        // apply symmetry
        if (useSymmetry) {
          var ptPlane = mesh.getCenter();
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
          var hit = Geometry.intersectionRayTriangle(vNear, eyeDir, v1, v2, v3, vertInter);
          if (hit === false) {
            ind2 = fAr[indFace + 3] * 3;
            if (ind2 >= 0) {
              v2[0] = vAr[ind2];
              v2[1] = vAr[ind2 + 1];
              v2[2] = vAr[ind2 + 2];
              hit = Geometry.intersectionRayTriangle(vNear, eyeDir, v1, v3, v2, vertInter);
            }
          }
          if (hit) {
            var testDistance = vec3.sqrDist(vNear, vertInter);
            if (testDistance < distance) {
              distance = testDistance;
              vec3.copy(this.interPoint_, vertInter);
              this.pickedFace_ = iFacesCandidates[i];
            }
          }
        }
        if (this.pickedFace_ !== -1) {
          this.mesh_ = mesh;
          this.computeRadiusWorld2(mouseX, mouseY);
        } else {
          this.rLocal2_ = 0.0;
        }
      };
    })(),
    /** Find all the vertices inside the sphere */
    pickVerticesInSphere: function (rLocal2) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var vertSculptFlags = mesh.getVerticesSculptFlags();
      var leavesHit = mesh.getLeavesUpdate();
      var inter = this.getIntersectionPoint();
      var iTrisInCells = mesh.intersectSphere(inter, rLocal2, leavesHit, mesh.getNbFaces());
      var iVerts = mesh.getVerticesFromFaces(iTrisInCells);
      var nbVerts = iVerts.length;
      var sculptFlag = ++Utils.SCULPT_FLAG;
      var pickedVertices = new Uint32Array(Utils.getMemory(4 * nbVerts + 12), 0, nbVerts + 3);
      var acc = 0;
      var itx = inter[0];
      var ity = inter[1];
      var itz = inter[2];
      var j = 0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i];
        j = ind * 3;
        var dx = itx - vAr[j];
        var dy = ity - vAr[j + 1];
        var dz = itz - vAr[j + 2];
        if ((dx * dx + dy * dy + dz * dz) < rLocal2) {
          vertSculptFlags[ind] = sculptFlag;
          pickedVertices[acc++] = ind;
        }
      }
      if (pickedVertices.length === 0 && this.pickedFace_ !== -1) {
        // no vertices inside the brush radius (big face or small radius)
        var fAr = mesh.getFaces();
        j = this.pickedFace_ * 3;
        vertSculptFlags[fAr[j]] = sculptFlag;
        vertSculptFlags[fAr[j + 1]] = sculptFlag;
        vertSculptFlags[fAr[j + 2]] = sculptFlag;
        pickedVertices[acc++] = fAr[j];
        pickedVertices[acc++] = fAr[j + 1];
        pickedVertices[acc++] = fAr[j + 2];
        if (fAr[j + 3] >= 0) {
          vertSculptFlags[fAr[j + 3]] = sculptFlag;
          pickedVertices[acc++] = fAr[j + 3];
        }
      }
      this.pickedVertices_ = new Uint32Array(pickedVertices.subarray(0, acc));
      return this.pickedVertices_;
    },
    /** Compute the selection radius in world space */
    computeRadiusWorld2: function (mouseX, mouseY) {
      var mesh = this.mesh_;
      var interPointTransformed = [0.0, 0.0, 0.0];
      vec3.transformMat4(interPointTransformed, this.getIntersectionPoint(), mesh.getMatrix());
      var z = this.camera_.project(interPointTransformed)[2];
      var vCircle = this.camera_.unproject(mouseX + (this.rDisplay_ * Tablet.getPressureRadius()), mouseY, z);
      this.rWorld2_ = vec3.sqrDist(interPointTransformed, vCircle);
      vec3.scale(interPointTransformed, interPointTransformed, 1 / mesh.getScale());
      vec3.scale(vCircle, vCircle, 1 / mesh.getScale());
      this.rLocal2_ = vec3.sqrDist(interPointTransformed, vCircle);
    }
  };

  return Picking;
});