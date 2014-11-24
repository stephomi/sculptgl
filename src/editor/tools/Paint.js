define([
  'lib/glMatrix',
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (glm, Utils, Tablet, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;

  function Paint(states) {
    SculptBase.call(this, states);
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.color_ = vec3.fromValues(1.0, 0.766, 0.336); // albedo
    this.material_ = vec3.fromValues(0.3, 0.95, 0.0); // roughness/metallic/????
    this.pickColor_ = false; // color picking
    this.global_ = false; // global material
    this.pickCallback_ = null; // callback function after picking a color
  }

  Paint.prototype = {
    /** Push undo operation */
    pushState: function () {
      if (!this.pickColor_)
        this.states_.pushStateColorAndMaterial(this.mesh_);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      var picking = main.getPicking();
      if (this.pickColor_)
        return this.pickColor(picking.getPickedFace(), picking.getIntersectionPoint());
      this.update(main, true);
    },
    /** Update sculpting operation */
    update: function (main) {
      if (this.pickColor_ === true) {
        var picking = main.getPicking();
        picking.intersectionMouseMesh(this.mesh_, main.mouseX_, main.mouseY_);
        if (picking.getMesh())
          this.pickColor(picking.getPickedFace(), picking.getIntersectionPoint());
        return;
      }
      this.sculptStroke(main, true);
    },
    /** Pick the color under the mouse */
    setPickCallback: function (cb) {
      this.pickCallback_ = cb;
    },
    triMean: function (color, ar, iv1, iv2, iv3, iv4, len1, len2, len3, len4) {
      var sum = len1 + len2 + len3 + len4;
      vec3.scaleAndAdd(color, color, ar.subarray(iv1, iv1 + 3), (sum - len1) / sum);
      vec3.scaleAndAdd(color, color, ar.subarray(iv2, iv2 + 3), (sum - len2) / sum);
      vec3.scaleAndAdd(color, color, ar.subarray(iv3, iv3 + 3), (sum - len3) / sum);
      if (iv4 >= 0) vec3.scaleAndAdd(color, color, ar.subarray(iv4, iv4 + 3), (sum - len4) / sum);
      vec3.scale(color, color, 1.0 / (iv4 >= 0 ? 3 : 2));
    },
    /** Pick the color under the mouse */
    pickColor: function (idFace, inter) {
      var mesh = this.mesh_;
      var color = this.color_;
      var fAr = mesh.getFaces();
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

      vec3.set(color, 0.0, 0.0, 0.0);
      this.triMean(color, mesh.getMaterials(), iv1, iv2, iv3, iv4, len1, len2, len3, len4);
      var roughness = color[0];
      var metallic = color[1];

      vec3.set(color, 0.0, 0.0, 0.0);
      this.triMean(color, mesh.getColors(), iv1, iv2, iv3, iv4, len1, len2, len3, len4);

      this.pickCallback_(color, roughness, metallic);
    },
    /** On stroke */
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      // undo-redo
      this.states_.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this.culling_)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity);

      this.mesh_.updateDuplicateColorsAndMaterials(iVertsInRadius);
      this.mesh_.updateFlatShading(this.mesh_.getFacesFromVertices(iVertsInRadius));
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var color = this.color_;
      var roughness = this.material_[0];
      var metallic = this.material_[1];
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0];
      var cg = color[1];
      var cb = color[2];
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
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }
    }
  };

  Utils.makeProxy(SculptBase, Paint);

  return Paint;
});