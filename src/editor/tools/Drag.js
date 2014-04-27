define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glmatrix, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glmatrix.vec3;
  var mat4 = glmatrix.mat4;

  function Drag(states) {
    SculptBase.call(this, states);
    this.dragDir_ = [0.0, 0.0, 0.0]; //direction of deformation
    this.dragDirSym_ = [0.0, 0.0, 0.0]; //direction of deformation
  }

  Drag.prototype = {
    /** Update sculpting operation */
    sculptStroke: function (sculptgl) {
      var mesh = this.mesh_;
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var ptPlane = sculptgl.sculpt_.ptPlane_;
      var nPlane = sculptgl.sculpt_.nPlane_;
      var picking = sculptgl.scene_.picking_;
      var pickingSym = sculptgl.scene_.pickingSym_;
      var lx = sculptgl.lastMouseX_;
      var ly = sculptgl.lastMouseY_;
      var dx = mouseX - lx;
      var dy = mouseY - ly;
      var dist = Math.sqrt(dx * dx + dy * dy);
      sculptgl.sumDisplacement_ += dist;
      var sumDisp = sculptgl.sumDisplacement_;
      var minSpacing = 0.15 * picking.rDisplay_;
      var step = dist / Math.floor(dist / minSpacing);
      dx /= dist;
      dy /= dist;
      mouseX = lx;
      mouseY = ly;
      var sym = sculptgl.sculpt_.symmetry_;
      minSpacing = 0.0;
      if (picking.mesh_ === null)
        return;
      picking.mesh_ = pickingSym.mesh_ = mesh;
      vec3.copy(pickingSym.interPoint_, picking.interPoint_);
      Geometry.mirrorPoint(pickingSym.interPoint_, ptPlane, nPlane);
      if (sumDisp > minSpacing || sumDisp === 0.0) {
        sumDisp = 0.0;
        for (var i = 0; i <= dist; i += step) {
          this.updateDragDir(picking, mouseX, mouseY);
          picking.pickVerticesInSphere(picking.rLocalSqr_);
          this.stroke(picking);
          if (sym) {
            this.updateDragDir(pickingSym, mouseX, mouseY, ptPlane, nPlane);
            pickingSym.rLocalSqr_ = picking.rLocalSqr_;
            pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
            this.stroke(pickingSym, true);
          }
          mouseX += dx * step;
          mouseY += dy * step;
        }
        this.mesh_.updateBuffers();
      }
      sculptgl.sumDisplacement_ = sumDisp;
    },
    /** On stroke */
    stroke: function (picking, sym) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.eyeDir_);

      this.drag(iVertsInRadius, picking.interPoint_, picking.rLocalSqr_, sym);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Drag deformation */
    drag: function (iVerts, center, radiusSquared, sym) {
      var vAr = this.mesh_.getVertices();
      var nbVerts = iVerts.length;
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var dir = sym ? this.dragDirSym_ : this.dragDir_;
      var dirx = dir[0];
      var diry = dir[1];
      var dirz = dir[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        vAr[ind] += dirx * fallOff;
        vAr[ind + 1] += diry * fallOff;
        vAr[ind + 2] += dirz * fallOff;
      }
    },
    /** Set a few infos that will be needed for the drag function afterwards */
    updateDragDir: function (picking, mouseX, mouseY, ptPlane, nPlane) {
      var mesh = this.mesh_;
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      var dir = this.dragDir_;
      if (ptPlane) {
        dir = this.dragDirSym_;
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      var center = picking.interPoint_;
      picking.interPoint_ = Geometry.vertexOnLine(center, vNear, vFar);
      vec3.sub(dir, picking.interPoint_, center);
      picking.mesh_ = mesh;
      picking.computeRadiusWorldSq(mouseX, mouseY);
      var eyeDir = picking.eyeDir_;
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    }
  };

  Utils.makeProxy(SculptBase, Drag);

  return Drag;
});