define([
  'lib/glMatrix',
  'math3d/Geometry',
  'object/Mesh',
  'misc/Tablet'
], function (glm, Geometry, Mesh, Tablet) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Picking(camera) {
    this.multimesh_ = null; //mesh
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
    intersectionMouseMesh: function (multimesh, mouseX, mouseY, ptPlane, nPlane) {
      var vNear = this.camera_.unproject(mouseX, mouseY, 0.0),
        vFar = this.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, multimesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      if (ptPlane) {
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      this.intersectionRayMesh(multimesh, vNear, vFar, mouseX, mouseY);
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
      return function (multimesh, vNear, vFar, mouseX, mouseY) {
        this.multimesh_ = null;
        this.pickedTriangle_ = -1;
        var mesh = multimesh.getCurrent();
        var vAr = mesh.verticesXYZ_;
        var iAr = mesh.indicesABC_;
        vec3.sub(ray, vFar, vNear);
        vec3.normalize(ray, ray);
        rayInv[0] = 1 / ray[0];
        rayInv[1] = 1 / ray[1];
        rayInv[2] = 1 / ray[2];
        var iTrisCandidates = mesh.octree_.intersectRay(vNear, rayInv);
        var distance = -1.0;
        var nbTrisCandidates = iTrisCandidates.length;
        for (var i = 0; i < nbTrisCandidates; ++i) {
          var indTri = iTrisCandidates[i] * 3;
          var ind1 = iAr[indTri] * 3,
            ind2 = iAr[indTri + 1] * 3,
            ind3 = iAr[indTri + 2] * 3;
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
              if (testDistance < distance || distance < 0.0) {
                distance = testDistance;
                vec3.copy(this.interPoint_, vertInter);
                this.pickedTriangle_ = iTrisCandidates[i];
              }
            }
          }
        }
        if (this.pickedTriangle_ !== -1) {
          this.multimesh_ = multimesh;
          this.computeRadiusWorldSq(mouseX, mouseY);
        } else {
          this.rLocalSqr_ = 0.0;
        }
      };
    })(),
    /** Find all the vertices inside the sphere */
    pickVerticesInSphere: function (rWorldSqr) {
      this.pickedVertices_ = [];
      var mesh = this.multimesh_.getCurrent();
      var vAr = mesh.verticesXYZ_;
      var vertSculptFlags = mesh.vertSculptFlags_;
      var leavesHit = mesh.leavesUpdate_;
      var iTrisInCells = mesh.octree_.intersectSphere(this.interPoint_, rWorldSqr, leavesHit);
      var iVerts = mesh.getVerticesFromTriangles(iTrisInCells);
      var nbVerts = iVerts.length;
      var sculptFlag = ++Mesh.SCULPT_FLAG;
      var pickedVertices = this.pickedVertices_;
      var inter = this.interPoint_;
      var itx = inter[0],
        ity = inter[1],
        itz = inter[2];
      var ind = 0,
        j = 0;
      for (var i = 0; i < nbVerts; ++i) {
        ind = iVerts[i];
        j = ind * 3;
        var dx = itx - vAr[j],
          dy = ity - vAr[j + 1],
          dz = itz - vAr[j + 2];
        if ((dx * dx + dy * dy + dz * dz) < rWorldSqr) {
          vertSculptFlags[ind] = sculptFlag;
          pickedVertices.push(iVerts[i]);
        }
      }
      if (this.pickedVertices_.length === 0 && this.pickedTriangle_ !== -1) {
        //no vertices inside the brush radius (big triangle or small radius)
        var iAr = mesh.indicesABC_;
        j = this.pickedTriangle_ * 3;
        this.pickedVertices_.push(iAr[j], iAr[j + 1], iAr[j + 2]);
      }
    },
    /** Compute the selection radius in world space */
    computeRadiusWorldSq: function (mouseX, mouseY) {
      var interPointTransformed = [0.0, 0.0, 0.0];
      vec3.transformMat4(interPointTransformed, this.interPoint_, this.multimesh_.getMatrix());
      var z = this.camera_.project(interPointTransformed)[2];
      var vCircle = this.camera_.unproject(mouseX + (this.rDisplay_ * Tablet.getPressureRadius()), mouseY, z);
      this.rWorldSqr_ = vec3.sqrDist(interPointTransformed, vCircle);
      vec3.scale(interPointTransformed, interPointTransformed, 1 / this.multimesh_.getScale());
      vec3.scale(vCircle, vCircle, 1 / this.multimesh_.getScale());
      this.rLocalSqr_ = vec3.sqrDist(interPointTransformed, vCircle);
    }
  };

  return Picking;
});