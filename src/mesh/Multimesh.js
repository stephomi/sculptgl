define([
  'misc/Utils',
  'mesh/Mesh',
  'editor/Subdivision',
  'editor/Multiresolution'
], function (Utils, Mesh, Subdivision, Multiresolution) {

  'use strict';

  var MeshResolution = function (transformData, render, mesh) {
    this.meshOrigin_ = mesh || new Mesh();
    this.meshOrigin_.setTransformData(transformData);
    this.meshOrigin_.setRender(render);
    this.detailsXYZ_ = null; //details vectors (Float32Array)
    this.detailsRGB_ = null; //details vectors (Float32Array)
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

  function Multimesh(mesh) {
    mesh.getRender().mesh_ = this;
    mesh.getTransformData().mesh_ = this;
    this.meshes_ = [new MeshResolution(mesh.getTransformData(), mesh.getRender(), mesh)];
    this.sel_ = 0;
  }

  Multimesh.prototype = {
    /** Return the current mesh */
    getCurrent: function () {
      return this.meshes_[this.sel_];
    },
    /** Add an extra level to the mesh (loop subdivision) */
    addLevel: function () {
      if ((this.meshes_.length - 1) !== this.sel_)
        return this.getCurrent();
      var baseMesh = this.getCurrent();
      var newMesh = new MeshResolution(baseMesh.getTransformData(), baseMesh.getRender());
      Subdivision.fullSubdivision(baseMesh, newMesh);
      newMesh.initTopology();
      this.pushMesh(newMesh);
      return newMesh;
    },
    /** Go to one level below in mesh resolution */
    lowerLevel: function () {
      if (this.sel_ === 0)
        return this.meshes_[0];
      Multiresolution.lowerAnalysis(this.getCurrent(), this.meshes_[--this.sel_]);
      this.updateResolution();
      return this.getCurrent();
    },
    /** Go to one level higher in mesh resolution, if available */
    higherLevel: function () {
      if (this.sel_ === this.meshes_.length - 1)
        return this.getCurrent();
      Multiresolution.higherSynthesis(this.getCurrent(), this.meshes_[++this.sel_]);
      this.updateResolution();
      return this.getCurrent();
    },
    /** Update the mesh after a change in resolution */
    updateResolution: function () {
      this.updateMesh();
      this.updateBuffers(true, true, true);
    },
    /** Change the resolution */
    selectResolution: function (sel) {
      while (this.sel_ > sel) {
        this.lowerLevel();
      }
      while (this.sel_ < sel) {
        this.higherLevel();
      }
    },
    /** Find a select index of a mesh */
    findIndexFromMesh: function (mesh) {
      var meshes = this.meshes_;
      for (var i = 0, l = meshes.length; i < l; ++i) {
        if (mesh === meshes[i])
          return i;
      }
    },
    /** Change the resolution */
    selectMesh: function (mesh) {
      var val = this.findIndexFromMesh(mesh);
      this.selectResolution(val);
    },
    /** Push a mesh */
    pushMesh: function (mesh) {
      this.meshes_.push(mesh);
      this.sel_ = this.meshes_.length - 1;
      this.updateResolution();
    },
    /** Pop the last mesh */
    popMesh: function () {
      this.meshes_.pop();
      this.sel_ = this.meshes_.length - 1;
      this.updateResolution();
    }
  };

  Utils.makeProxy(MeshResolution, Multimesh, function (proto) {
    return function () {
      return proto.apply(this.getCurrent(), arguments);
    };
  });

  return Multimesh;
});