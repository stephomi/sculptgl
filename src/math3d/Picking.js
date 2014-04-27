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
    this.rLocalSqr_ = 0.0; //radius of the selection area (local/object space)
    this.rWorldSqr_ = 0.0; //radius of the selection area (world space)
    this.camera_ = camera; //the camera
    this.eyeDir_ = [0.0, 0.0, 0.0]; //eye direction
  }

  Picking.prototype = {
    /** Intersection between a ray the mouse position */
    intersectionMouseMesh: function (mesh, mouseX, mouseY, ptPlane, nPlane) {
      var vNear = this.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = this.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      if (ptPlane) {
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      this.intersectionRayMesh(mesh, vNear, vFar, mouseX, mouseY);
      var eyeDir = this.eyeDir_;
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    },
    /** Intersection between a ray and a mesh */
    intersectionRayMesh: (function () {
      var v1 = [0.0, 0.0, 0.0];
      var v2 = [0.0, 0.0, 0.0];
      var v3 = [0.0, 0.0, 0.0];
      var ray = [0.0, 0.0, 0.0];
      var rayInv = [0.0, 0.0, 0.0];
      var vertInter = [0.0, 0.0, 0.0];
      return function (mesh, vNear, vFar, mouseX, mouseY) {
        this.mesh_ = null;
        this.pickedTriangle_ = -1;
        var vAr = mesh.getVertices();
        var iAr = mesh.getIndices();
        vec3.sub(ray, vFar, vNear);
        vec3.normalize(ray, ray);
        rayInv[0] = 1 / ray[0];
        rayInv[1] = 1 / ray[1];
        rayInv[2] = 1 / ray[2];
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
          if (Geometry.intersectionRayTriangle(vNear, ray, v1, v2, v3, vertInter)) {
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
          this.computeRadiusWorldSq(mouseX, mouseY);
        } else {
          this.rLocalSqr_ = 0.0;
        }
      };
    })(),
    /** Find all the vertices inside the sphere */
    pickVerticesInSphere: function (rWorldSqr) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var vertSculptFlags = mesh.getVerticesSculptFlags();
      var leavesHit = mesh.getLeavesUpdate();
      var iTrisInCells = mesh.intersectSphere(this.interPoint_, rWorldSqr, leavesHit, mesh.getNbTriangles());
      var iVerts = mesh.getVerticesFromTriangles(iTrisInCells);
      var nbVerts = iVerts.length;
      var sculptFlag = ++Utils.SCULPT_FLAG;
      var pickedVertices = new Uint32Array(Utils.getMemory(4 * nbVerts + 12), 0, nbVerts + 3);
      var acc = 0;
      var inter = this.interPoint_;
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
        if ((dx * dx + dy * dy + dz * dz) < rWorldSqr) {
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
    },
    /** Compute the selection radius in world space */
    computeRadiusWorldSq: function (mouseX, mouseY) {
      var interPointTransformed = [0.0, 0.0, 0.0];
      vec3.transformMat4(interPointTransformed, this.interPoint_, this.mesh_.getMatrix());
      var z = this.camera_.project(interPointTransformed)[2];
      var vCircle = this.camera_.unproject(mouseX + (this.rDisplay_ * Tablet.getPressureRadius()), mouseY, z);
      this.rWorldSqr_ = vec3.sqrDist(interPointTransformed, vCircle);
      vec3.scale(interPointTransformed, interPointTransformed, 1 / this.mesh_.getScale());
      vec3.scale(vCircle, vCircle, 1 / this.mesh_.getScale());
      this.rLocalSqr_ = vec3.sqrDist(interPointTransformed, vCircle);
    }
  };

  return Picking;
});