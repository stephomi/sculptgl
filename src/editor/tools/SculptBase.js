define([
  'misc/Utils',
  'misc/Tablet',
  'math3d/Geometry',
  'states/StateGeometry',
  'states/StateColor'
], function (Utils, Tablet, Geometry, StateGeometry, StateColor) {

  'use strict';

  function SculptBase(states) {
    this.states_ = states; //for undo-redo
    this.mesh_ = null; //the current edited mesh
  }

  SculptBase.prototype = {
    /** Start sculpting */
    start: function (sculptgl, colorState) {
      var picking = sculptgl.scene_.picking_;
      var mesh = sculptgl.mesh_;
      picking.intersectionMouseMesh(mesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.mesh_ === null)
        return;
      this.states_.pushState(colorState ? new StateColor(mesh) : new StateGeometry(mesh));
      this.mesh_ = mesh;
      this.startSculpt(sculptgl, colorState);
    },
    /** Start sculpting operation */
    startSculpt: function (sculptgl, colorState) {
      this.sculptStroke(sculptgl, colorState);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      this.sculptStroke(sculptgl);
    },
    /** Make a brush stroke */
    sculptStroke: function (sculptgl, colorState) {
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
      if (!sculptgl.continuous_) {
        mouseX = lx;
        mouseY = ly;
      } else {
        sumDisp = 0.0;
        dist = 0.0;
      }
      var sym = sculptgl.sculpt_.symmetry_;
      if (sumDisp > minSpacing * 100.0)
        sumDisp = 0.0;
      else if (sumDisp > minSpacing || sumDisp === 0.0) {
        sumDisp = 0.0;
        for (var i = 0; i <= dist; i += step) {
          picking.intersectionMouseMesh(mesh, mouseX, mouseY);
          if (!picking.mesh_)
            break;
          picking.pickVerticesInSphere(picking.rLocalSqr_);
          this.stroke(picking);
          if (sym) {
            pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY, ptPlane, nPlane);
            if (!pickingSym.mesh_)
              break;
            pickingSym.rLocalSqr_ = picking.rLocalSqr_;
            pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
            this.stroke(pickingSym, true);
          }
          mouseX += dx * step;
          mouseY += dy * step;
        }
        sculptgl.mesh_.updateBuffers(colorState);
      }
      sculptgl.sumDisplacement_ = sumDisp;
    },
    /** Return the vertices that point toward the camera */
    getFrontVertices: function (iVertsInRadius, eyeDir) {
      var nbVertsSelected = iVertsInRadius.length;
      var iVertsFront = new Uint32Array(Utils.getMemory(4 * nbVertsSelected), 0, nbVertsSelected);
      var acc = 0;
      var nAr = this.mesh_.getNormals();
      var eyeX = eyeDir[0];
      var eyeY = eyeDir[1];
      var eyeZ = eyeDir[2];
      for (var i = 0; i < nbVertsSelected; ++i) {
        var id = iVertsInRadius[i];
        var j = id * 3;
        if ((nAr[j] * eyeX + nAr[j + 1] * eyeY + nAr[j + 2] * eyeZ) <= 0.0)
          iVertsFront[acc++] = id;
      }
      return new Uint32Array(iVertsFront.subarray(0, acc));
    },
    /** Compute average normal of a group of vertices with culling */
    areaNormal: function (iVerts) {
      var nAr = this.mesh_.getNormals();
      var nbVerts = iVerts.length;
      var anx = 0.0;
      var any = 0.0;
      var anz = 0.0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        anx += nAr[ind];
        any += nAr[ind + 1];
        anz += nAr[ind + 2];
      }
      var len = Math.sqrt(anx * anx + any * any + anz * anz);
      if (len === 0.0)
        return null;
      len = 1.0 / len;
      return [anx * len, any * len, anz * len];
    },
    /** Compute average center of a group of vertices (with culling) */
    areaCenter: function (iVerts) {
      var vAr = this.mesh_.getVertices();
      var nbVerts = iVerts.length;
      var ax = 0.0;
      var ay = 0.0;
      var az = 0.0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        ax += vAr[ind];
        ay += vAr[ind + 1];
        az += vAr[ind + 2];
      }
      return [ax / nbVerts, ay / nbVerts, az / nbVerts];
    }
  };

  return SculptBase;
});