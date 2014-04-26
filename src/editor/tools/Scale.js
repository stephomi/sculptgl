define([
  'lib/glMatrix',
  'math3d/Geometry',
  'editor/tools/SculptUtils',
  'states/StateGeometry'
], function (glmatrix, Geometry, SculptUtils, StateGeometry) {

  'use strict';

  var vec3 = glmatrix.vec3;
  var mat4 = glmatrix.mat4;

  function Crease(states) {
    this.states_ = states; //for undo-redo
    this.mesh_ = null; //the current edited mesh
    this.intensity_ = 0.75; //deformation intensity
    this.culling_ = false; //if we backface cull the vertices
  }

  Crease.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      var mesh = sculptgl.mesh_;
      picking.intersectionMouseMesh(mesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.mesh_ === null)
        return;
      this.states_.pushState(new StateGeometry(mesh));
      this.mesh_ = mesh;
      this.startScale(sculptgl);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      this.sculptStrokeScale(sculptgl);
    },
    /** Make a brush scale stroke */
    sculptStrokeScale: function (sculptgl) {
      var delta = sculptgl.mouseX_ - sculptgl.lastMouseX_;
      var picking = sculptgl.scene_.picking_;
      picking.pickVerticesInSphere(picking.rLocalSqr_);
      this.stroke(picking, delta);
      if (sculptgl.sculpt_.symmetry_) {
        var pickingSym = sculptgl.scene_.pickingSym_;
        pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
        this.stroke(pickingSym, delta);
      }
      this.mesh_.updateBuffers();
    },
    /** On stroke */
    stroke: function (picking, delta) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = SculptUtils.getFrontVertices(mesh, iVertsInRadius, picking.eyeDir_);

      this.scale(mesh, iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, delta);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Scale the vertices around the mouse point intersection */
    scale: function (mesh, iVerts, center, radiusSquared, intensity) {
      var vAr = mesh.getVertices();
      var deltaScale = intensity * 0.01;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVerts.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deltaScale;
        vAr[ind] += dx * fallOff;
        vAr[ind + 1] += dy * fallOff;
        vAr[ind + 2] += dz * fallOff;
      }
    },
    /** Start a sculpt sculpt stroke */
    startScale: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.scene_.picking_;
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, this.mesh_.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      picking.pickVerticesInSphere(picking.rLocalSqr_);
      if (sculptgl.sculpt_.symmetry_) {
        var pickingSym = sculptgl.scene_.pickingSym_;
        var ptPlane = sculptgl.sculpt_.ptPlane_;
        var nPlane = sculptgl.sculpt_.nPlane_;
        var vNearSym = [vNear[0], vNear[1], vNear[2]];
        Geometry.mirrorPoint(vNearSym, ptPlane, nPlane);
        var vFarSym = [vFar[0], vFar[1], vFar[2]];
        Geometry.mirrorPoint(vFarSym, ptPlane, nPlane);
        // symmetrical picking
        pickingSym.intersectionRayMesh(this.mesh_, vNearSym, vFarSym, mouseX, mouseY, 1.0);
        if (!pickingSym.mesh_)
          return;
        pickingSym.rLocalSqr_ = picking.rLocalSqr_;
        pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
      }
    }
  };

  return Crease;
});