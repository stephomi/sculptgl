define([
  'misc/Utils',
  'mesh/Mesh'
], function (Utils, Mesh) {

  'use strict';

  var MeshResolution = function (transformData, render, mesh) {
    this.meshOrigin_ = mesh || new Mesh();
    this.meshOrigin_.setTransformData(transformData);
    this.meshOrigin_.setRender(render);
    this.detailsXYZ_ = null; // details vectors (Float32Array)
    this.detailsRGB_ = null; // details vectors (Float32Array)
  };

  MeshResolution.prototype = {
    getMeshOrigin: function () {
      return this.meshOrigin_;
    },
    getDetailsVertices: function () {
      return this.detailsXYZ_;
    },
    getDetailsColors: function () {
      return this.detailsRGB_;
    },
    setDetailsVertices: function (dAr) {
      this.detailsXYZ_ = dAr;
    },
    setDetailsColors: function (dcAr) {
      this.detailsRGB_ = dcAr;
    }
  };

  Utils.makeProxy(Mesh, MeshResolution, function (proto) {
    return function () {
      return proto.apply(this.getMeshOrigin(), arguments);
    };
  });

  return MeshResolution;
});