define([
  'lib/glMatrix',
  'misc/Utils',
  'misc/Tablet',
  'states/StateColor',
  'editor/tools/SculptBase'
], function (glm, Utils, Tablet, StateColor, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;

  function Paint(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.color_ = [168.0, 66.0, 66.0]; // color painting
    this.pickColor_ = false; // color picking
    this.pickCallback_ = null; // callback function after picking a color
  }

  Paint.prototype = {
    /** Push undo operation */
    pushState: function () {
      if (!this.pickColor_)
        this.states_.pushState(new StateColor(this.mesh_));
    },
    /** Start sculpting operation */
    startSculpt: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      if (this.pickColor_)
        return this.pickColor(picking.getPickedFace(), picking.getIntersectionPoint());
      this.update(sculptgl, true);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      if (this.pickColor_ === true) {
        var picking = sculptgl.scene_.picking_;
        picking.intersectionMouseMesh(this.mesh_, sculptgl.mouseX_, sculptgl.mouseY_);
        if (picking.mesh_ !== null)
          this.pickColor(picking.getPickedFace(), picking.getIntersectionPoint());
        return;
      }
      this.sculptStroke(sculptgl, true);
    },
    /** Pick the color under the mouse */
    setPickCallback: function (cb) {
      this.pickCallback_ = cb;
    },
    /** Pick the color under the mouse */
    pickColor: function (idFace, inter) {
      var mesh = this.mesh_;
      var color = this.color_;
      var fAr = mesh.getFaces();
      var cAr = mesh.getColors();
      var vAr = mesh.getVertices();

      var id = idFace * 4;
      var iv1 = fAr[id] * 3;
      var iv2 = fAr[id + 1] * 3;
      var iv3 = fAr[id + 2] * 3;
      var iv4 = fAr[id + 3] * 3;

      var len1 = vec3.len(vec3.sub(color, inter, vAr.subarray(iv1, iv1 + 3)));
      var len2 = vec3.len(vec3.sub(color, inter, vAr.subarray(iv2, iv2 + 3)));
      var len3 = vec3.len(vec3.sub(color, inter, vAr.subarray(iv3, iv3 + 3)));
      var len4 = iv4 >= 0 ? vec3.len(vec3.sub(color, inter, vAr.subarray(iv4, iv4 + 3))) : 0;
      var sum = len1 + len2 + len3 + len4;
      vec3.set(color, 0.0, 0.0, 0.0);
      vec3.scaleAndAdd(color, color, cAr.subarray(iv1, iv1 + 3), (sum - len1) / sum);
      vec3.scaleAndAdd(color, color, cAr.subarray(iv2, iv2 + 3), (sum - len2) / sum);
      vec3.scaleAndAdd(color, color, cAr.subarray(iv3, iv3 + 3), (sum - len3) / sum);
      if (iv4 >= 0) vec3.scaleAndAdd(color, color, cAr.subarray(iv4, iv4 + 3), (sum - len4) / sum);
      vec3.scale(color, color, 255.0 / (iv4 >= 0 ? 3 : 2));

      this.pickCallback_();
    },
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateFlatShading(this.mesh_.getFacesFromVertices(iVertsInRadius));
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var color = this.color_;
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0] / 255.0;
      var cg = color[1] / 255.0;
      var cb = color[2] / 255.0;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= intensity;
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Paint);

  return Paint;
});