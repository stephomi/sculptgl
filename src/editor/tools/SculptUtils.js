define([
  'math3d/Geometry',
  'misc/Tablet',
  'misc/Utils'
], function (Geometry, Tablet, Utils) {

  'use strict';

  var SculptUtils = {};

  /** Make a brush stroke */
  SculptUtils.sculptStroke = function (sculptgl, mesh, callbackStroke, updateColor) {
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
        callbackStroke(picking);
        if (sym) {
          pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY, ptPlane, nPlane);
          if (!pickingSym.mesh_)
            break;
          pickingSym.rLocalSqr_ = picking.rLocalSqr_;
          pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
          callbackStroke(pickingSym, true);
        }
        mouseX += dx * step;
        mouseY += dy * step;
      }
      sculptgl.mesh_.updateBuffers(updateColor);
    }
    sculptgl.sumDisplacement_ = sumDisp;
  };

  /** Return the vertices that point toward the camera */
  SculptUtils.getFrontVertices = function (mesh, iVertsInRadius, eyeDir) {
    var nbVertsSelected = iVertsInRadius.length;
    var iVertsFront = new Uint32Array(Utils.getMemory(4 * nbVertsSelected), 0, nbVertsSelected);
    var acc = 0;
    var nAr = mesh.getNormals();
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
  };

  /** Compute average normal of a group of vertices with culling */
  SculptUtils.areaNormal = function (mesh, iVerts) {
    var nAr = mesh.getNormals();
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
  };

  /** Compute average center of a group of vertices (with culling) */
  SculptUtils.areaCenter = function (mesh, iVerts) {
    var vAr = mesh.getVertices();
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
  };

  return SculptUtils;
});