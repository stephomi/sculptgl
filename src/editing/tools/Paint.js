define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');
  var Tablet = require('misc/Tablet');
  var SculptBase = require('editing/tools/SculptBase');

  var vec3 = glm.vec3;

  var Paint = function (main) {
    SculptBase.call(this, main);
    this._radius = 50;
    this._hardness = 0.75;
    this._intensity = 0.75;
    this._culling = false;
    this._color = vec3.fromValues(1.0, 0.766, 0.336); // albedo
    this._material = vec3.fromValues(0.3, 0.95, 0.0); // roughness/metallic/masking
    this._pickColor = false; // color picking
    this._global = false; // global material
    this._pickCallback = null; // callback function after picking a color
    this._idAlpha = 0;
    this._lockPosition = false;
  };

  Paint.prototype = {
    end: function () {
      this._pickColor = false;
      SculptBase.prototype.end.call(this);
    },
    pushState: function (force) {
      if (!this._pickColor || force)
        this._states.pushStateColorAndMaterial(this.getMesh());
    },
    startSculpt: function () {
      if (this._pickColor)
        return this.pickColor(this._main.getPicking());
      SculptBase.prototype.startSculpt.call(this);
    },
    update: function () {
      if (this._pickColor === true)
        return this.updatePickColor();
      SculptBase.prototype.update.apply(this, arguments);
    },
    updateContinuous: function () {
      if (this._pickColor === true)
        return this.updatePickColor();
      SculptBase.prototype.updateContinuous.call(this);
    },
    updateMeshBuffers: function () {
      var mesh = this.getMesh();
      if (mesh.getDynamicTopology) {
        mesh.updateBuffers();
      } else {
        mesh.updateColorBuffer();
        mesh.updateMaterialBuffer();
      }
    },
    updatePickColor: function () {
      var picking = this._main.getPicking();
      if (picking.intersectionMouseMesh())
        this.pickColor(picking);
    },
    setPickCallback: function (cb) {
      this._pickCallback = cb;
    },
    pickColor: function (picking) {
      var mesh = this.getMesh();
      var color = this._color;
      picking.polyLerp(mesh.getMaterials(), color);
      var roughness = color[0];
      var metallic = color[1];
      picking.polyLerp(mesh.getColors(), color);
      this._pickCallback(color, roughness, metallic);
    },
    stroke: function (picking) {
      var iVertsInRadius = picking.getPickedVertices();
      var intensity = this._intensity * Tablet.getPressureIntensity();

      // undo-redo
      this._states.pushVertices(iVertsInRadius);
      iVertsInRadius = this.dynamicTopology(picking);

      if (this._culling)
        iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

      picking.updateAlpha(this._lockPosition);
      picking.setIdAlpha(this._idAlpha);
      this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, this._hardness, picking);

      var mesh = this.getMesh();
      mesh.updateDuplicateColorsAndMaterials(iVertsInRadius);
      if (mesh.isUsingDrawArrays())
        mesh.updateDrawArrays(mesh.getFacesFromVertices(iVertsInRadius));
    },
    paint: function (iVerts, center, radiusSquared, intensity, hardness, picking) {
      var mesh = this.getMesh();
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var color = this._color;
      var roughness = this._material[0];
      var metallic = this._material[1];
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
    paintAll: function () {
      var mesh = this.getMesh();
      var iVerts = this.getUnmaskedVertices();
      if (iVerts.length === 0)
        return;

      this.pushState(true);
      this._states.pushVertices(iVerts);

      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var color = this._color;
      var roughness = this._material[0];
      var metallic = this._material[1];
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
      mesh.updateDrawArrays();
      this.updateRender();
    }
  };

  Utils.makeProxy(SculptBase, Paint);

  module.exports = Paint;
});