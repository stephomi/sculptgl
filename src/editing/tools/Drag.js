define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');
  var Geometry = require('math3d/Geometry');
  var SculptBase = require('editing/tools/SculptBase');
  var Smooth = require('editing/tools/Smooth');

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Drag = function (main) {
    SculptBase.call(this, main);
    this._radius = 150;
    this._dragDir = [0.0, 0.0, 0.0];
    this._dragDirSym = [0.0, 0.0, 0.0];
    this._idAlpha = 0;
  };

  Drag.prototype = {
    /** Make a brush stroke */
    sculptStroke: function () {
      var main = this._main;
      var mesh = this.getMesh();
      var picking = main.getPicking();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;

      var dx = main._mouseX - this._lastMouseX;
      var dy = main._mouseY - this._lastMouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var minSpacing = 0.15 * this._radius;

      var step = 1.0 / Math.floor(dist / minSpacing);
      dx *= step;
      dy *= step;
      var mouseX = this._lastMouseX;
      var mouseY = this._lastMouseY;

      if (!picking.getMesh())
        return;
      picking._mesh = mesh;
      if (pickingSym) {
        pickingSym._mesh = mesh;
        vec3.copy(pickingSym.getIntersectionPoint(), picking.getIntersectionPoint());
        Geometry.mirrorPoint(pickingSym.getIntersectionPoint(), mesh.getSymmetryOrigin(), mesh.getSymmetryNormal());
      }

      for (var i = 0.0; i < 1.0; i += step) {
        if (!this.makeStroke(mouseX, mouseY, picking, pickingSym))
          break;
        mouseX += dx;
        mouseY += dy;
      }

      this.updateRender();

      this._lastMouseX = main._mouseX;
      this._lastMouseY = main._mouseY;
    },
    makeStroke: function (mouseX, mouseY, picking, pickingSym) {
      var mesh = this.getMesh();
      this.updateDragDir(picking, mouseX, mouseY);
      picking.pickVerticesInSphere(picking.getLocalRadius2());
      picking.computePickedNormal();
      // if dyn topo, we need to the picking and the sculpting altogether
      if (mesh.getDynamicTopology)
        this.stroke(picking, false);

      if (pickingSym) {
        this.updateDragDir(pickingSym, mouseX, mouseY, true);
        pickingSym.setLocalRadius2(picking.getLocalRadius2());
        pickingSym.pickVerticesInSphere(pickingSym.getLocalRadius2());
      }

      if (!mesh.getDynamicTopology) this.stroke(picking, false);
      if (pickingSym) this.stroke(pickingSym, true);
      return true;
    },
    /** On stroke */
    stroke: function (picking, sym) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      picking.updateAlpha(this._lockPosition);
      picking.setIdAlpha(this._idAlpha);
      this.drag(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), sym, picking);
      Smooth.prototype.smoothTangent.call(this, iVertsInRadius, 1.0, picking);

      var mesh = this.getMesh();
      mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Drag deformation */
    drag: function (iVerts, center, radiusSquared, sym, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var mAr = mesh.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var dir = sym ? this._dragDirSym : this._dragDir;
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
        fallOff *= mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        vAr[ind] = vx + dirx * fallOff;
        vAr[ind + 1] = vy + diry * fallOff;
        vAr[ind + 2] = vz + dirz * fallOff;
      }
    },
    /** Set a few infos that will be needed for the drag function afterwards */
    updateDragDir: function (picking, mouseX, mouseY, useSymmetry) {
      var mesh = this.getMesh();
      var vNear = picking.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.unproject(mouseX, mouseY, 0.1);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      var dir = this._dragDir;
      if (useSymmetry) {
        dir = this._dragDirSym;
        var ptPlane = mesh.getSymmetryOrigin();
        var nPlane = mesh.getSymmetryNormal();
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      var center = picking.getIntersectionPoint();
      picking.setIntersectionPoint(Geometry.vertexOnLine(center, vNear, vFar));
      vec3.sub(dir, picking.getIntersectionPoint(), center);
      picking._mesh = mesh;
      picking.updateLocalAndWorldRadius2();
      var eyeDir = picking.getEyeDirection();
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    }
  };

  Utils.makeProxy(SculptBase, Drag);

  module.exports = Drag;
});