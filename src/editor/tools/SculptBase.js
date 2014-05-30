define([
  'misc/Utils',
  'misc/Tablet',
  'math3d/Geometry',
  'states/StateGeometry'
], function (Utils, Tablet, Geometry, StateGeometry) {

  'use strict';

  function SculptBase(states) {
    this.states_ = states; // for undo-redo
    this.mesh_ = null; // the current edited mesh
  }

  SculptBase.prototype = {
    /** Start sculpting */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.getPicking();
      picking.intersectionMouseMeshes(sculptgl.scene_.meshes_, sculptgl.mouseX_, sculptgl.mouseY_);
      var mesh = picking.mesh_;
      if (mesh === null)
        return;
      if (sculptgl.mesh_ !== mesh) {
        sculptgl.mesh_ = mesh;
        sculptgl.gui_.updateMesh();
      }
      this.mesh_ = mesh;
      this.pushState();
      this.startSculpt(sculptgl);
    },
    /** Push undo operation */
    pushState: function () {
      this.states_.pushState(new StateGeometry(this.mesh_));
    },
    /** Start sculpting operation */
    startSculpt: function (sculptgl) {
      this.sculptStroke(sculptgl);
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
      var picking = sculptgl.scene_.getPicking();
      var pickingSym = sculptgl.scene_.getSymmetryPicking();
      var lx = sculptgl.lastMouseX_;
      var ly = sculptgl.lastMouseY_;
      var dx = mouseX - lx;
      var dy = mouseY - ly;
      var dist = Math.sqrt(dx * dx + dy * dy);
      sculptgl.sumDisplacement_ += dist;
      var sumDisp = sculptgl.sumDisplacement_;
      var minSpacing = 0.15 * picking.getScreenRadius();
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
      var sym = sculptgl.sculpt_.getSymmetry();
      if (sumDisp > minSpacing || sumDisp === 0.0) {
        sumDisp = 0.0;
        for (var i = 0; i <= dist; i += step) {
          picking.intersectionMouseMesh(mesh, mouseX, mouseY);
          if (!picking.mesh_)
            break;
          picking.pickVerticesInSphere(picking.getLocalRadius2());
          this.stroke(picking);
          if (sym) {
            pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY, true);
            if (!pickingSym.mesh_)
              break;
            pickingSym.setLocalRadius2(picking.getLocalRadius2());
            pickingSym.pickVerticesInSphere(pickingSym.getLocalRadius2());
            this.stroke(pickingSym, true);
          }
          mouseX += dx * step;
          mouseY += dy * step;
        }
        if (colorState)
          sculptgl.mesh_.updateColorBuffer();
        else
          sculptgl.mesh_.updateGeometryBuffers();
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
      var anx = 0.0;
      var any = 0.0;
      var anz = 0.0;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
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
    },
    /** Updates the vertices original coords that are sculpted for the first time in this stroke */
    updateProxy: function (iVerts) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var vProxy = mesh.getVerticesProxy();
      var vertStateFlags = mesh.getVerticesStateFlags();
      var stateFlag = Utils.STATE_FLAG;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var id = iVerts[i];
        if (vertStateFlags[id] !== stateFlag) {
          var ind = id * 3;
          vProxy[ind] = vAr[ind];
          vProxy[ind + 1] = vAr[ind + 1];
          vProxy[ind + 2] = vAr[ind + 2];
        }
      }
    }
  };

  return SculptBase;
});