'use strict';

function Picking(camera)
{
  this.mesh_ = null; //mesh
  this.pickedTriangle_ = -1; //triangle picked
  this.pickedVertices_ = []; //vertices selected
  this.interPoint_ = [0, 0, 0]; //intersection point
  this.rDisplay_ = 50; //radius of the selection area (screen unit)
  this.rWorldSqr_ = 0; //radius of the selection area (world unit)
  this.camera_ = camera; //the camera
  this.eyeDir_ = [0, 0, 0]; //eye direction
}

Picking.prototype = {
  /** Intersection between a ray the mouse position */
  intersectionMouseMesh: function (mesh, mouseX, mouseY, pressure, ptPlane, nPlane)
  {
    var vNear = this.camera_.unproject(mouseX, mouseY, 0),
      vFar = this.camera_.unproject(mouseX, mouseY, 1);
    var matInverse = mat4.create();
    mat4.invert(matInverse, mesh.matTransform_);
    vec3.transformMat4(vNear, vNear, matInverse);
    vec3.transformMat4(vFar, vFar, matInverse);
    if (ptPlane)
    {
      Geometry.mirrorPoint(vNear, ptPlane, nPlane);
      Geometry.mirrorPoint(vFar, ptPlane, nPlane);
    }
    this.intersectionRayMesh(mesh, vNear, vFar, mouseX, mouseY, pressure);
    var eyeDir = this.eyeDir_;
    vec3.sub(eyeDir, vFar, vNear);
    vec3.normalize(eyeDir, eyeDir);
  },

  /** Intersection between a ray and a mesh */
  intersectionRayMesh: function (mesh, vNear, vFar, mouseX, mouseY, pressure)
  {
    this.mesh_ = null;
    this.pickedTriangle_ = -1;
    var triangles = mesh.triangles_;
    var vAr = mesh.vertexArray_;
    var iAr = mesh.indexArray_;
    var ray = [0, 0, 0];
    vec3.sub(ray, vFar, vNear);
    vec3.normalize(ray, ray);
    var rayInv = [1 / ray[0], 1 / ray[1], 1 / ray[2]];
    var iTrisCandidates = mesh.octree_.intersectRay(vNear, rayInv);
    var distance = -1;
    var nbTrisCandidates = iTrisCandidates.length;
    var vertInter = [0, 0, 0];
    for (var i = 0; i < nbTrisCandidates; ++i)
    {
      var indTri = iTrisCandidates[i];
      var t = triangles[indTri];
      indTri *= 3;
      var ind1 = iAr[indTri] * 3,
        ind2 = iAr[indTri + 1] * 3,
        ind3 = iAr[indTri + 2] * 3;
      var v1 = [vAr[ind1], vAr[ind1 + 1], vAr[ind1 + 2]],
        v2 = [vAr[ind2], vAr[ind2 + 1], vAr[ind2 + 2]],
        v3 = [vAr[ind3], vAr[ind3 + 1], vAr[ind3 + 2]];
      if (Geometry.intersectionRayTriangle(vNear, vFar, v1, v2, v3, t.normal_, vertInter))
      {
        var testDistance = vec3.sqrDist(vNear, vertInter);
        {
          if (testDistance < distance || distance === -1)
          {
            distance = testDistance;
            vec3.copy(this.interPoint_, vertInter);
            this.pickedTriangle_ = iTrisCandidates[i];
          }
        }
      }
    }
    if (this.pickedTriangle_ !== -1)
    {
      this.mesh_ = mesh;
      this.computeRadiusWorldSq(mouseX, mouseY, pressure);
    }
    else
      this.rWorldSqr_ = 0;
  },

  /** Find all the vertices inside the sphere */
  pickVerticesInSphere: function (rWorldSqr)
  {
    this.pickedVertices_ = [];
    var vertices = this.mesh_.vertices_;
    var vAr = this.mesh_.vertexArray_;
    var leavesHit = this.mesh_.leavesUpdate_;
    var iTrisInCells = this.mesh_.octree_.intersectSphere(this.interPoint_, rWorldSqr, leavesHit);
    var iVerts = this.mesh_.getVerticesFromTriangles(iTrisInCells);
    var nbVerts = iVerts.length;
    var vertexSculptMask = ++Vertex.sculptMask_;
    var pickedVertices = this.pickedVertices_;
    var ind = 0,
      j = 0;
    for (var i = 0; i < nbVerts; ++i)
    {
      ind = iVerts[i];
      var v = vertices[ind];
      j = ind * 3;
      var distSqr = vec3.sqrDist([vAr[j], vAr[j + 1], vAr[j + 2]], this.interPoint_);
      if (distSqr < rWorldSqr)
      {
        v.sculptFlag_ = vertexSculptMask;
        pickedVertices.push(iVerts[i]);
      }
    }
    if (this.pickedVertices_.length === 0 && this.pickedTriangle_ !== -1) //no vertices inside the brush radius (big triangle or small radius)
    {
      var iAr = this.mesh_.indexArray_;
      j = this.pickedTriangle_ * 3;
      this.pickedVertices_.push(iAr[j], iAr[j + 1], iAr[j + 2]);
    }
  },

  /** Compute the selection radius in world space */
  computeRadiusWorldSq: function (mouseX, mouseY, pressure)
  {
    var interPointTransformed = [0, 0, 0];
    vec3.transformMat4(interPointTransformed, this.interPoint_, this.mesh_.matTransform_);
    var z = this.camera_.project(interPointTransformed)[2];
    var vCircle = this.camera_.unproject(mouseX + (this.rDisplay_ * pressure), mouseY, z);
    this.rWorldSqr_ = vec3.sqrDist(interPointTransformed, vCircle);
  }
};