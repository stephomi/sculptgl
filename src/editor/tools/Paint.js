define([
  'lib/glMatrix',
  'misc/Utils',
  'misc/Tablet',
  'editor/tools/SculptBase'
], function (glm, Utils, Tablet, SculptBase) {

  'use strict';

  var vec3 = glm.vec3;

  var Paint = function (states) {
    SculptBase.call(this, states);
    this.hardness_ = 0.75;
    this.intensity_ = 0.75; // deformation intensity
    this.culling_ = false; // if we backface cull the vertices
    this.color_ = vec3.fromValues(1.0, 0.766, 0.336); // albedo
    this.material_ = vec3.fromValues(0.3, 0.95, 0.0); // roughness/metallic/masking
    this.pickColor_ = false; // color picking
    this.global_ = false; // global material
    this.pickCallback_ = null; // callback function after picking a color
    this.idAlpha_ = 0;
    this.lockPosition_ = false;
  };

  Paint.prototype = {
    /** Push undo operation */
    pushState: function (force) {
      if (!this.pickColor_ || force)
        this.states_.pushStateColorAndMaterial(this.mesh_);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      if (this.pickColor_)
        return this.pickColor(main.getPicking());
      SculptBase.prototype.startSculpt.call(this, main);
    },
    /** Update sculpting operation */
    update: function (main) {
      if (this.pickColor_ === true)
        return this.updatePickColor(main);
      SculptBase.prototype.update.apply(this, arguments);
    },
    updateContinuous: function (main) {
      if (this.pickColor_ === true)
        return this.updatePickColor(main);
      SculptBase.prototype.updateContinuous.apply(this, arguments);
    },
    updateMeshBuffers: function () {
      if (this.mesh_.getDynamicTopology) {
        this.mesh_.updateBuffers();
      } else {
        this.mesh_.updateColorBuffer();
        this.mesh_.updateMaterialBuffer();
      }
    },
    updatePickColor: function (main) {
      var picking = main.getPicking();
      picking.intersectionMouseMesh(this.mesh_, main.mouseX_, main.mouseY_);
      if (picking.getMesh())
        this.pickColor(picking);
    },
    /** Pick the color under the mouse */
    setPickCallback: function (cb) {
      this.pickCallback_ = cb;
    },
    /** Pick the color under the mouse */
    pickColor: function (picking) {
      var color = this.color_;
      picking.polyLerp(this.mesh_.getMaterials(), color);
      var roughness = color[0];
      var metallic = color[1];
      picking.polyLerp(this.mesh_.getColors(), color);
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

      picking.updateAlpha(this.lockPosition_);
      picking.setIdAlpha(this.idAlpha_);
      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, this.hardness_, picking);

      this.mesh_.updateDuplicateColorsAndMaterials(iVertsInRadius);
      var idFaces = this.mesh_.getFacesFromVertices(iVertsInRadius);
      this.mesh_.updateFlatShading(idFaces);
    },
    /** Paint color vertices */
    paint: function (iVerts, center, radiusSquared, intensity, hardness, picking) {
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
      var softness = 2 * (1 - hardness);
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = Math.pow(1 - dist, softness);
        fallOff *= intensity * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }
    },
    paintAll: function (mesh, main) {
      this.mesh_ = mesh;
      var iVerts = this.getUnmaskedVertices();
      if (iVerts.length === 0) return;

      this.pushState(true);
      this.states_.pushVertices(iVerts);

      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var color = this.color_;
      var roughness = this.material_[0];
      var metallic = this.material_[1];
      var cr = color[0];
      var cg = color[1];
      var cb = color[2];
      for (var i = 0, nb = iVerts.length; i < nb; ++i) {
        var ind = iVerts[i] * 3;
        var fallOff = mAr[ind + 2];
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }

      mesh.updateDuplicateColorsAndMaterials();
      mesh.updateFlatShading();
      this.updateRender(main);
    }
  };

  Utils.makeProxy(SculptBase, Paint);

  return Paint;
});