define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase'
], function (glm, Utils, Geometry, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Scale = function (states) {
    SculptBase.call(this, states);
  };

  Scale.prototype = {
    end: function () {
      SculptBase.prototype.endTransform.apply(this, arguments);
    },
    applyEditMatrix: function (iVerts) {
      var mesh = this.mesh_;
      var em = mesh.getEditMatrix();
      var mAr = mesh.getMaterials();
      var vAr = mesh.getVertices();
      var scale = em[0] - 1.0;
      for (var i = 0, nb = iVerts.length; i < nb; ++i) {
        var j = iVerts[i] * 3;
        var val = 1.0 + scale * mAr[j + 2];
        vAr[j] *= val;
        vAr[j + 1] *= val;
        vAr[j + 2] *= val;
      }
      vec3.scale(mesh.getCenter(), mesh.getCenter(), em[0]);
      mat4.identity(em);
      if (iVerts.length === mesh.getNbVertices()) mesh.updateGeometry();
      else mesh.updateGeometry(mesh.getFacesFromVertices(iVerts), iVerts);
    },
    update: (function () {
      var tmp = [0.0, 0.0, 0.0];
      return function (main) {
        tmp[0] = tmp[1] = tmp[2] = 1.0 + (main.mouseX_ - main.lastMouseX_ + main.mouseY_ - main.lastMouseY_) / 400;
        var m = this.mesh_.getEditMatrix();
        mat4.scale(m, m, tmp);
        main.render();
        main.getCanvas().style.cursor = 'default';
      };
    })()
  };

  Utils.makeProxy(SculptBase, Scale);

  return Scale;
});