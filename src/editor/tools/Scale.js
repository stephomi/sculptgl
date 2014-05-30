define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Scale(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
  }

  Scale.prototype = {
    /** Start a sculpt sculpt stroke */
    startSculpt: function (sculptgl) {
      var mesh = this.mesh_;
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.scene_.getPicking();
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.getSymmetryPicking();
        pickingSym.intersectionRayMesh(mesh, vNear, vFar, mouseX, mouseY, true);
        if (!pickingSym.mesh_)
          return;
        pickingSym.setLocalRadius2(rLocal2);
        pickingSym.pickVerticesInSphere(rLocal2);
      }
    },
    /** Make a brush scale stroke */
    sculptStroke: function (sculptgl) {
      var delta = sculptgl.mouseX_ - sculptgl.lastMouseX_;
      var picking = sculptgl.scene_.getPicking();
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, delta);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.getSymmetryPicking();
        pickingSym.pickVerticesInSphere(rLocal2);
        this.stroke(pickingSym, delta);
      }
      this.mesh_.updateGeometryBuffers();
    },
    /** On stroke */
    stroke: function (picking, delta) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.scale(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), delta);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Scale the vertices around the mouse point intersection */
    scale: function (iVerts, center, radiusSquared, intensity) {
      var vAr = this.mesh_.getVertices();
      var deltaScale = intensity * 0.01;
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deltaScale;
        vAr[ind] = vx + dx * fallOff;
        vAr[ind + 1] = vy + dy * fallOff;
        vAr[ind + 2] = vz + dz * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Scale);

  return Scale;
});