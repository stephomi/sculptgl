define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Move(states) {
    SculptBase.call(this, states);
    this.intensity_ = 1.0;
    this.topoCheck_ = true;
    this.negative_ = false; // along normal
    this.moveData_ = {
      center: [0.0, 0.0, 0.0],
      dir: [0.0, 0.0],
      vProxy: null
    };
    this.moveDataSym_ = {
      center: [0.0, 0.0, 0.0],
      dir: [0.0, 0.0],
      vProxy: null
    };
  }

  Move.prototype = {
    startSculpt: function (main) {
      var picking = main.getPicking();
      this.initMoveData(picking, this.moveData_);

      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        pickingSym.intersectionMouseMesh(this.mesh_, main.mouseX_, main.mouseY_);
        pickingSym.setLocalRadius2(picking.getLocalRadius2());

        if (pickingSym.getMesh())
          this.initMoveData(pickingSym, this.moveDataSym_);
      }
    },
    initMoveData: function (picking, moveData) {
      if (this.topoCheck_)
        picking.pickVerticesInSphereTopological(picking.getLocalRadius2());
      else
        picking.pickVerticesInSphere(picking.getLocalRadius2());
      vec3.copy(moveData.center, picking.getIntersectionPoint());
      var iVerts = picking.getPickedVertices();
      // undo-redo
      this.states_.pushVertices(iVerts);

      var vAr = picking.getMesh().getVertices();
      var nbVerts = iVerts.length;
      var vProxy = moveData.vProxy = new Float32Array(nbVerts * 3);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var j = i * 3;
        vProxy[j] = vAr[ind];
        vProxy[j + 1] = vAr[ind + 1];
        vProxy[j + 2] = vAr[ind + 2];
      }
    },
    copyVerticesProxy: function (picking, moveData) {
      var iVerts = picking.getPickedVertices();
      var vAr = this.mesh_.getVertices();
      var vProxy = moveData.vProxy;
      for (var i = 0, nbVerts = iVerts.length; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var j = i * 3;
        vAr[ind] = vProxy[j];
        vAr[ind + 1] = vProxy[j + 1];
        vAr[ind + 2] = vProxy[j + 2];
      }
    },
    sculptStroke: function (main) {
      var picking = main.getPicking();
      var pickingSym = main.getPickingSymmetry();
      var useSym = main.getSculpt().getSymmetry() && pickingSym.getMesh();
      this.copyVerticesProxy(picking, this.moveData_);
      if (useSym)
        this.copyVerticesProxy(pickingSym, this.moveDataSym_);

      var mouseX = main.mouseX_;
      var mouseY = main.mouseY_;
      this.updateMoveDir(picking, mouseX, mouseY);
      this.move(picking.getPickedVertices(), picking.getIntersectionPoint(), picking.getLocalRadius2(), this.moveData_);

      if (useSym) {
        this.updateMoveDir(pickingSym, mouseX, mouseY, true);
        this.move(pickingSym.getPickedVertices(), pickingSym.getIntersectionPoint(), pickingSym.getLocalRadius2(), this.moveDataSym_);
      }
      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(picking.getPickedVertices()), picking.getPickedVertices());
      if (useSym)
        this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(pickingSym.getPickedVertices()), pickingSym.getPickedVertices());
      this.updateRender(main);
      main.getCanvas().style.cursor = 'default';
    },
    move: function (iVerts, center, radiusSquared, moveData) {
      var vAr = this.mesh_.getVertices();
      var mAr = this.mesh_.getMaterials();
      var radius = Math.sqrt(radiusSquared);
      var vProxy = moveData.vProxy;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var dir = moveData.dir;
      var dirx = dir[0];
      var diry = dir[1];
      var dirz = dir[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var j = i * 3;
        var vx = vProxy[j];
        var vy = vProxy[j + 1];
        var vz = vProxy[j + 2];
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= mAr[ind + 2];
        vAr[ind] += dirx * fallOff;
        vAr[ind + 1] += diry * fallOff;
        vAr[ind + 2] += dirz * fallOff;
      }
    },
    updateMoveDir: function (picking, mouseX, mouseY, useSymmetry) {
      var mesh = this.mesh_;
      var vNear = picking.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, mesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);

      var moveData = useSymmetry ? this.moveDataSym_ : this.moveData_;
      if (useSymmetry) {
        var ptPlane = mesh.getCenter();
        var nPlane = mesh.getSymmetryNormal();
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }

      if (this.negative_) {
        var len = vec3.dist(Geometry.vertexOnLine(moveData.center, vNear, vFar), moveData.center);
        vec3.normalize(moveData.dir, picking.computePickedNormal());
        vec3.scale(moveData.dir, moveData.dir, mouseX < this.lastMouseX_ ? -len : len);
      } else {
        vec3.sub(moveData.dir, Geometry.vertexOnLine(moveData.center, vNear, vFar), moveData.center);
      }
      vec3.scale(moveData.dir, moveData.dir, this.intensity_);

      var eyeDir = picking.getEyeDirection();
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    }
  };

  Utils.makeProxy(SculptBase, Move);

  return Move;
});