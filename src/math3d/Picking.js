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
    this.mesh_ = null; //mesh
    this.pickedTriangle_ = -1; //triangle picked
    this.pickedVertices_ = []; //vertices selected
    this.interPoint_ = [0.0, 0.0, 0.0]; //intersection point
    this.rDisplay_ = 50.0; //radius of the selection area (screen space)
    this.rLocal2_ = 0.0; //radius of the selection area (local/object space)
    this.rWorld2_ = 0.0; //radius of the selection area (world space)
    this.camera_ = camera; //the camera
    this.eyeDir_ = [0.0, 0.0, 0.0]; //eye direction
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
      var rayInv = [0.0, 0.0, 0.0];
      var vertInter = [0.0, 0.0, 0.0];
      var vNear = [0.0, 0.0, 0.0];
      var vFar = [0.0, 0.0, 0.0];
      return function (mesh, vNearOrig, vFarOrig, mouseX, mouseY, useSymmetry) {
        //resest picking
        this.mesh_ = null;
        this.pickedTriangle_ = -1;
        //resest picking
        vec3.copy(vNear, vNearOrig);
        vec3.copy(vFar, vFarOrig);
        //apply symmetry
        if (useSymmetry) {
          var ptPlane = mesh.getCenter();
          var nPlane = mesh.getSymmetryNormal();
          Geometry.mirrorPoint(vNear, ptPlane, nPlane);
          Geometry.mirrorPoint(vFar, ptPlane, nPlane);
        }
        var vAr = mesh.getVertices();
        var iAr = mesh.getIndices();
        //compute eye direction
        var eyeDir = this.getEyeDirection();
        vec3.sub(eyeDir, vFar, vNear);
        vec3.normalize(eyeDir, eyeDir);
        rayInv[0] = 1 / eyeDir[0];
        rayInv[1] = 1 / eyeDir[1];
        rayInv[2] = 1 / eyeDir[2];
        var iTrisCandidates = mesh.intersectRay(vNear, rayInv, mesh.getNbTriangles());
        var distance = Infinity;
        var nbTrisCandidates = iTrisCandidates.length;
        for (var i = 0; i < nbTrisCandidates; ++i) {
          var indTri = iTrisCandidates[i] * 3;
          var ind1 = iAr[indTri] * 3;
          var ind2 = iAr[indTri + 1] * 3;
          var ind3 = iAr[indTri + 2] * 3;
          v1[0] = vAr[ind1];
          v1[1] = vAr[ind1 + 1];
          v1[2] = vAr[ind1 + 2];
          v2[0] = vAr[ind2];
          v2[1] = vAr[ind2 + 1];
          v2[2] = vAr[ind2 + 2];
          v3[0] = vAr[ind3];
          v3[1] = vAr[ind3 + 1];
          v3[2] = vAr[ind3 + 2];
          if (Geometry.intersectionRayTriangle(vNear, eyeDir, v1, v2, v3, vertInter)) {
            var testDistance = vec3.sqrDist(vNear, vertInter); {
              if (testDistance < distance) {
                distance = testDistance;
                vec3.copy(this.interPoint_, vertInter);
                this.pickedTriangle_ = iTrisCandidates[i];
              }
            }
          }
        }
        if (this.pickedTriangle_ !== -1) {
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
      var iTrisInCells = mesh.intersectSphere(inter, rLocal2, leavesHit, mesh.getNbTriangles());
      var iVerts = mesh.getVerticesFromTriangles(iTrisInCells);
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
      if (pickedVertices.length === 0 && this.pickedTriangle_ !== -1) {
        //no vertices inside the brush radius (big triangle or small radius)
        var iAr = mesh.getIndices();
        j = this.pickedTriangle_ * 3;
        vertSculptFlags[iAr[j]] = sculptFlag;
        vertSculptFlags[iAr[j] + 1] = sculptFlag;
        vertSculptFlags[iAr[j] + 2] = sculptFlag;
        pickedVertices[acc++] = iAr[j];
        pickedVertices[acc++] = iAr[j + 1];
        pickedVertices[acc++] = iAr[j + 2];
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