define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
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
    startSculpt: function (main) {
      var mouseX = main.mouseX_;
      var mouseY = main.mouseY_;
      var picking = main.getPicking();
      this.initTwistData(picking, mouseX, mouseY, this.twistData_);
      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        pickingSym.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
        pickingSym.setLocalRadius2(picking.getLocalRadius2());
        if (pickingSym.getMesh())
          this.initTwistData(pickingSym, mouseX, mouseY, this.twistDataSym_);
      }
    },
    /** Set a few infos that will be needed for the twist function afterwards */
    initTwistData: function (picking, mouseX, mouseY, twistData) {
      picking.pickVerticesInSphere(picking.getLocalRadius2());
      vec3.negate(twistData.normal, picking.getEyeDirection());
      vec2.set(twistData.center, mouseX, mouseY);
    },
    /** Make a brush twist stroke */
    sculptStroke: function (main) {
      var mx = main.mouseX_;
      var my = main.mouseY_;
      var lx = main.lastMouseX_;
      var ly = main.lastMouseY_;
      var picking = main.getPicking();
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, mx, my, lx, ly, this.twistData_);

      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        if (pickingSym.getMesh()) {
          pickingSym.pickVerticesInSphere(rLocal2);
          this.stroke(pickingSym, lx, ly, mx, my, this.twistDataSym_);
        }
      }
      this.updateRender(main);
      main.getCanvas().style.cursor = 'default';
    },
    /** On stroke */
    stroke: function (picking, mx, my, lx, ly, twistData) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

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
      var mAr = mesh.getMaterials();
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
        quat.setAxisAngle(rot, nPlane, angle * fallOff * mAr[ind + 2]);
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