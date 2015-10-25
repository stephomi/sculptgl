define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');
  var Geometry = require('math3d/Geometry');
  var SculptBase = require('editing/tools/SculptBase');

  var vec2 = glm.vec2;
  var vec3 = glm.vec3;
  var quat = glm.quat;

  var Twist = function (main) {
    SculptBase.call(this, main);
    this._radius = 75;
    this._culling = false;
    this._twistData = {
      normal: [0.0, 0.0, 0.0], // normal of rotation plane
      center: [0.0, 0.0] // 2D center of rotation 
    };
    this._twistDataSym = {
      normal: [0.0, 0.0, 0.0], // normal of rotation plane
      center: [0.0, 0.0] // 2D center of rotation 
    };
    this._idAlpha = 0;
  };

  Twist.prototype = {
    /** Start a twist sculpt stroke */
    startSculpt: function () {
      var main = this._main;
      var mouseX = main._mouseX;
      var mouseY = main._mouseY;
      var picking = main.getPicking();
      this.initTwistData(picking, mouseX, mouseY, this._twistData);
      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        pickingSym.intersectionMouseMesh();
        pickingSym.setLocalRadius2(picking.getLocalRadius2());
        if (pickingSym.getMesh())
          this.initTwistData(pickingSym, mouseX, mouseY, this._twistDataSym);
      }
    },
    /** Set a few infos that will be needed for the twist function afterwards */
    initTwistData: function (picking, mouseX, mouseY, twistData) {
      picking.pickVerticesInSphere(picking.getLocalRadius2());
      vec3.negate(twistData.normal, picking.getEyeDirection());
      vec2.set(twistData.center, mouseX, mouseY);
    },
    /** Make a brush twist stroke */
    sculptStroke: function () {
      var main = this._main;
      var mx = main._mouseX;
      var my = main._mouseY;
      var lx = main._lastMouseX;
      var ly = main._lastMouseY;
      var picking = main.getPicking();
      var rLocal2 = picking.getLocalRadius2();
      picking.pickVerticesInSphere(rLocal2);
      this.stroke(picking, mx, my, lx, ly, this._twistData);

      if (main.getSculpt().getSymmetry()) {
        var pickingSym = main.getPickingSymmetry();
        if (pickingSym.getMesh()) {
          pickingSym.pickVerticesInSphere(rLocal2);
          this.stroke(pickingSym, lx, ly, mx, my, this._twistDataSym);
        }
      }
      this.updateRender();
      main.setCanvasCursor('default');
    },
    /** On stroke */
    stroke: function (picking, mx, my, lx, ly, twistData) {
      var iVertsInRadius = picking.getPickedVertices();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this._culling)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      picking.updateAlpha(false);
      picking.setIdAlpha(this._idAlpha);
      this.twist(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), mx, my, lx, ly, twistData, picking);

      var mesh = this.getMesh();
      mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Twist the vertices around the mouse point intersection */
    twist: function (iVerts, center, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, twistData, picking) {
      var mesh = this.getMesh();
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
      var invRadius = 1.0 / Math.sqrt(radiusSquared);
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
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) * invRadius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= angle * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        quat.setAxisAngle(rot, nPlane, fallOff);
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

  module.exports = Twist;
});