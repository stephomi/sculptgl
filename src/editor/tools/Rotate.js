define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glmatrix, Utils, Geometry, SculptBase) {

  'use strict';

  var vec2 = glmatrix.vec2;
  var vec3 = glmatrix.vec3;
  var mat4 = glmatrix.mat4;
  var quat = glmatrix.quat;

  function Rotate(states) {
    SculptBase.call(this, states);
    this.culling_ = false; //if we backface cull the vertices
    this.rotateData_ = {
      normal: [0.0, 0.0, 0.0], //normal of rotation plane
      center: [0.0, 0.0] //2D center of rotation 
    };
    this.rotateDataSym_ = {
      normal: [0.0, 0.0, 0.0], //normal of rotation plane
      center: [0.0, 0.0] //2D center of rotation 
    };
  }

  Rotate.prototype = {
    /** Start a rotate sculpt stroke */
    startSculpt: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.scene_.picking_;
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, this.mesh_.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      this.initRotateData(picking, mouseX, mouseY, this.rotateData_);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.pickingSym_;
        pickingSym.intersectionRayMesh(this.mesh_, vNear, vFar, mouseX, mouseY, true);
        if (!pickingSym.mesh_)
          return;
        this.initRotateData(pickingSym, mouseX, mouseY, this.rotateDataSym_);
        pickingSym.setLocalRadius2(picking.getLocalRadius2());
      }
    },
    /** Set a few infos that will be needed for the rotate function afterwards */
    initRotateData: function (picking, mouseX, mouseY, rotateData) {
      picking.pickVerticesInSphere(picking.getLocalRadius2());
      vec3.negate(rotateData.normal, picking.getEyeDirection());
      rotateData.center[0] = mouseX;
      rotateData.center[1] = mouseY;
    },
    /** Make a brush rotate stroke */
    sculptStroke: function (sculptgl) {
      var mx = sculptgl.mouseX_;
      var my = sculptgl.mouseY_;
      var lx = sculptgl.lastMouseX_;
      var ly = sculptgl.lastMouseY_;
      var picking = sculptgl.scene_.picking_;
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, mx, my, lx, ly, this.rotateData_);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.pickingSym_;
        pickingSym.pickVerticesInSphere(rLocal2);
        this.stroke(pickingSym, lx, ly, mx, my, this.rotateDataSym_);
      }
      this.mesh_.updateBuffers();
    },
    /** On stroke */
    stroke: function (picking, mx, my, lx, ly, rotateData) {
      var iVertsInRadius = picking.getPickedVertices();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.rotate(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), mx, my, lx, ly, rotateData);

      this.mesh_.updateMesh(this.mesh_.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Rotate the vertices around the mouse point intersection */
    rotate: function (iVerts, center, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, rotateData) {
      var mesh = this.mesh_;
      var mouseCenter = rotateData.center;
      var vecMouse = [mouseX - mouseCenter[0], mouseY - mouseCenter[1]];
      if (vec2.len(vecMouse) < 30)
        return;
      vec2.normalize(vecMouse, vecMouse);
      var nPlane = rotateData.normal;
      var rot = [0.0, 0.0, 0.0, 0.0];
      var vecOldMouse = [lastMouseX - mouseCenter[0], lastMouseY - mouseCenter[1]];
      vec2.normalize(vecOldMouse, vecOldMouse);
      var angle = Geometry.signedAngle2d(vecMouse, vecOldMouse);
      var vAr = mesh.getVertices();
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
        var coord = [vAr[ind], vAr[ind + 1], vAr[ind + 2]];
        quat.setAxisAngle(rot, nPlane, angle * fallOff);
        vec3.sub(coord, coord, center);
        vec3.transformQuat(coord, coord, rot);
        vec3.add(coord, coord, center);
        vAr[ind] = coord[0];
        vAr[ind + 1] = coord[1];
        vAr[ind + 2] = coord[2];
      }
    }
  };

  Utils.makeProxy(SculptBase, Rotate);

  return Rotate;
});