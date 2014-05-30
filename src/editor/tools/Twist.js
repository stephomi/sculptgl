define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var mat4 = glm.mat4;
  var quat = glm.quat;

  function Twist(states) {
    SculptBase.call(this, states);
    this.culling_ = false; // if we backface cull the vertices
    this.twistData_ = {
      normal: [0.0, 0.0, 0.0], // normal of rotation plane
      center: [0.0, 0.0] // 2D center of rotation 
    };
    this.twistDataSym_ = {
      normal: [0.0, 0.0, 0.0], // normal of rotation plane
      center: [0.0, 0.0] // 2D center of rotation 
    };
  }

  Twist.prototype = {
    /** Start a twist sculpt stroke */
    startSculpt: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.scene_.getPicking();
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, this.mesh_.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      this.initTwistData(picking, mouseX, mouseY, this.twistData_);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.getSymmetryPicking();
        pickingSym.intersectionRayMesh(this.mesh_, vNear, vFar, mouseX, mouseY, true);
        if (!pickingSym.mesh_)
          return;
        this.initTwistData(pickingSym, mouseX, mouseY, this.twistDataSym_);
        pickingSym.setLocalRadius2(picking.getLocalRadius2());
      }
    },
    /** Set a few infos that will be needed for the twist function afterwards */
    initTwistData: function (picking, mouseX, mouseY, twistData) {
      picking.pickVerticesInSphere(picking.getLocalRadius2());
      vec3.negate(twistData.normal, picking.getEyeDirection());
      twistData.center[0] = mouseX;
      twistData.center[1] = mouseY;
    },
    /** Make a brush twist stroke */
    sculptStroke: function (sculptgl) {
      var mx = sculptgl.mouseX_;
      var my = sculptgl.mouseY_;
      var lx = sculptgl.lastMouseX_;
      var ly = sculptgl.lastMouseY_;
      var picking = sculptgl.scene_.getPicking();
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, mx, my, lx, ly, this.twistData_);
      if (sculptgl.sculpt_.getSymmetry()) {
        var pickingSym = sculptgl.scene_.getSymmetryPicking();
        pickingSym.pickVerticesInSphere(rLocal2);
        this.stroke(pickingSym, lx, ly, mx, my, this.twistDataSym_);
      }
      this.mesh_.updateGeometryBuffers();
    },
    /** On stroke */
    stroke: function (picking, mx, my, lx, ly, twistData) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.twist(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), mx, my, lx, ly, twistData);

      this.mesh_.updateGeometry(this.mesh_.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Twist the vertices around the mouse point intersection */
    twist: function (iVerts, center, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, twistData) {
      var mesh = this.mesh_;
      var mouseCenter = twistData.center;
      var vecMouse = [mouseX - mouseCenter[0], mouseY - mouseCenter[1]];
      if (vec2.len(vecMouse) < 30)
        return;
      vec2.normalize(vecMouse, vecMouse);
      var nPlane = twistData.normal;
      var rot = [0.0, 0.0, 0.0, 0.0];
      var vecOldMouse = [lastMouseX - mouseCenter[0], lastMouseY - mouseCenter[1]];
      vec2.normalize(vecOldMouse, vecOldMouse);
      var angle = Geometry.signedAngle2d(vecMouse, vecOldMouse);
      var vAr = mesh.getVertices();
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var coord = [0.0, 0.0, 0.0];
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
        quat.setAxisAngle(rot, nPlane, angle * fallOff);
        vec3.set(coord, vx, vy, vz);
        vec3.sub(coord, coord, center);
        vec3.transformQuat(coord, coord, rot);
        vec3.add(coord, coord, center);
        vAr[ind] = coord[0];
        vAr[ind + 1] = coord[1];
        vAr[ind + 2] = coord[2];
      }
    }
  };

  Utils.makeProxy(SculptBase, Twist);

  return Twist;
});