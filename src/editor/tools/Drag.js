define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase',
  'editor/tools/Smooth'
], function (glm, Utils, Geometry, SculptBase, Smooth) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Drag(states) {
    SculptBase.call(this, states);
    this.dragDir_ = [0.0, 0.0, 0.0]; // direction of deformation
    this.dragDirSym_ = [0.0, 0.0, 0.0]; // direction of deformation
  }

  Drag.prototype = {
    /** Make a brush stroke */
    sculptStroke: function (main) {
      var mesh = this.mesh_;
      var picking = main.getPicking();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;

      var dx = main.mouseX_ - this.lastMouseX_;
      var dy = main.mouseY_ - this.lastMouseY_;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var minSpacing = 0.15 * picking.getScreenRadius();

      var step = 1.0 / Math.floor(dist / minSpacing);
      dx *= step;
      dy *= step;
      var mouseX = this.lastMouseX_;
      var mouseY = this.lastMouseY_;

      if (!picking.getMesh())
        return;
      picking.mesh_ = mesh;
      if (pickingSym) {
        pickingSym.mesh_ = mesh;
        vec3.copy(pickingSym.getIntersectionPoint(), picking.getIntersectionPoint());
        Geometry.mirrorPoint(pickingSym.getIntersectionPoint(), mesh.getCenter(), mesh.getSymmetryNormal());
      }

      for (var i = 0.0; i < 1.0; i += step) {
        if (!this.makeStroke(mouseX, mouseY, picking, pickingSym))
          break;
        mouseX += dx;
        mouseY += dy;
      }

      this.updateRender(main);

      this.lastMouseX_ = main.mouseX_;
      this.lastMouseY_ = main.mouseY_;
    },
    makeStroke: function (mouseX, mouseY, picking, pickingSym) {
      var localRadius2 = picking.getLocalRadius2();
      this.updateDragDir(picking, mouseX, mouseY);
      picking.pickVerticesInSphere(localRadius2);
      this.stroke(picking);

      if (pickingSym) {
        this.updateDragDir(pickingSym, mouseX, mouseY, true);
        pickingSym.setLocalRadius2(localRadius2);
        pickingSym.pickVerticesInSphere(localRadius2);
        this.stroke(pickingSym, true);
      }
      return true;
    },
    /** On stroke */
    stroke: function (picking, sym) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      this.drag(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), sym);
      Smooth.prototype.smoothTangent.call(this, iVertsInRadius, 1.0);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Drag deformation */
    drag: function (iVerts, center, radiusSquared, sym) {
      var vAr = this.mesh_.getVertices();
      var mAr = this.mesh_.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var dir = sym ? this.dragDirSym_ : this.dragDir_;
      var dirx = dir[0];
      var diry = dir[1];
      var dirz = dir[2];
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
        fallOff *= mAr[ind + 2];
        vAr[ind] = vx + dirx * fallOff;
        vAr[ind + 1] = vy + diry * fallOff;
        vAr[ind + 2] = vz + dirz * fallOff;
      }
    },
    /** Set a few infos that will be needed for the drag function afterwards */
    updateDragDir: function (picking, mouseX, mouseY, useSymmetry) {
      var mesh = this.mesh_;
      var vNear = picking.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      var dir = this.dragDir_;
      if (useSymmetry) {
        dir = this.dragDirSym_;
        var ptPlane = mesh.getCenter();
        var nPlane = mesh.getSymmetryNormal();
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      var center = picking.getIntersectionPoint();
      picking.setIntersectionPoint(Geometry.vertexOnLine(center, vNear, vFar));
      vec3.sub(dir, picking.getIntersectionPoint(), center);
      picking.mesh_ = mesh;
      picking.computeRadiusWorld2(mouseX, mouseY);
      var eyeDir = picking.getEyeDirection();
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    }
  };

  Utils.makeProxy(SculptBase, Drag);

  return Drag;
});