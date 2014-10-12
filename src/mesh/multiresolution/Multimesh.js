define([
  'misc/Utils',
  'mesh/multiresolution/MeshResolution',
  'mesh/multiresolution/LowRender',
  'editor/Subdivision',
  'editor/Reversion'
], function (Utils, MeshResolution, LowRender, Subdivision, Reversion) {

  'use strict';

  function Multimesh(mesh) {
    // every submeshes will share the same render/transformData
    mesh.getRender().mesh_ = this;
    mesh.getTransformData().mesh_ = this;
    this.meshes_ = [new MeshResolution(mesh.getTransformData(), mesh.getRender(), mesh)];
    this.sel_ = 0;
    this.lowRender_ = new LowRender(mesh.getRender());
  }

  Multimesh.RENDER_HINT = 0;
  Multimesh.NONE = 0;
  Multimesh.SCULPT = 1;
  Multimesh.CAMERA = 2;
  Multimesh.PICKING = 3;

  Multimesh.prototype = {
    /** Return the current mesh */
    getCurrentMesh: function () {
      return this.meshes_[this.sel_];
    },
    /** Add an extra level to the mesh (subdivision) */
    addLevel: function () {
      if ((this.meshes_.length - 1) !== this.sel_)
        return this.getCurrentMesh();
      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh.getTransformData(), baseMesh.getRender());
      baseMesh.setVerticesMapping(undefined);

      Subdivision.fullSubdivision(baseMesh, newMesh);
      newMesh.initTopology();

      this.pushMesh(newMesh);
      this.getRender().initRender();
      return newMesh;
    },
    /** Reverse the mesh (reverse subdivision) */
    computeReverse: function () {
      if (this.sel_ !== 0)
        return this.getCurrentMesh();
      var baseMesh = this.getCurrentMesh();
      var newMesh = new MeshResolution(baseMesh.getTransformData(), baseMesh.getRender());

      var status = Reversion.computeReverse(baseMesh, newMesh);
      if (!status)
        return;
      newMesh.initTopology();

      this.unshiftMesh(newMesh);
      this.getRender().initRender();
      return newMesh;
    },
    /** Go to one level below in mesh resolution */
    lowerLevel: function () {
      if (this.sel_ === 0)
        return this.meshes_[0];
      this.meshes_[this.sel_ - 1].lowerAnalysis(this.getCurrentMesh());
      --this.sel_;
      this.updateResolution();
      return this.getCurrentMesh();
    },
    /** Go to one level higher in mesh resolution, if available */
    higherLevel: function () {
      if (this.sel_ === this.meshes_.length - 1)
        return this.getCurrentMesh();
      this.meshes_[this.sel_ + 1].higherSynthesis(this.getCurrentMesh());
      ++this.sel_;
      this.updateResolution();
      return this.getCurrentMesh();
    },
    /** Update the mesh after a change in resolution */
    updateResolution: function () {
      this.updateGeometry();
      this.updateDuplicateColorsAndMaterials();
      this.updateBuffers();
      this.lowRender_.updateBuffers(this.meshes_[this.getLowIndexRender()]);
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
    /** Unshift a mesh */
    unshiftMesh: function (mesh) {
      this.meshes_.unshift(mesh);
      this.sel_ = 1;
      this.lowerLevel();
    },
    /** Pop the last mesh */
    popMesh: function () {
      this.meshes_.pop();
      this.sel_ = this.meshes_.length - 1;
      this.updateResolution();
    },
    /** Shift the first mesh */
    shiftMesh: function () {
      this.meshes_.shift();
      this.sel_ = 0;
      this.updateResolution();
    },
    /** Delete the lower resolution meshes */
    deleteLower: function () {
      this.meshes_.splice(0, this.sel_);
      this.sel_ = 0;
    },
    /** Delete the higher resolution meshes */
    deleteHigher: function () {
      this.meshes_.splice(this.sel_ + 1);
    },
    /** Return the rendering mesh index */
    getLowIndexRender: function () {
      var limit = 1500000;
      var sel = this.sel_;
      while (sel >= 0) {
        var mesh = this.meshes_[sel];
        // we disable low rendering for lower resolution mesh with
        // an index indirection for even vertices
        if (mesh.getEvenMapping() === true)
          return sel === this.sel_ ? sel : sel + 1;
        if (mesh.getNbTriangles() < limit)
          return sel;
        --sel;
      }
      return 0;
    },
    /** Render the at a lower resolution */
    lowRender: function (main) {
      var lowSel = this.getLowIndexRender();
      if (lowSel === this.sel_)
        return this.getCurrentMesh().render(main);
      var tmpSel = this.sel_;
      this.sel_ = lowSel;
      this.lowRender_.render(main);
      this.sel_ = tmpSel;
    },
    /** Render the mesh */
    render: function (main) {
      if (this.getCurrentMesh().isUsingTexCoords())
        return this.getCurrentMesh().render(main);
      if (Multimesh.RENDER_HINT === Multimesh.PICKING || Multimesh.RENDER_HINT === Multimesh.NONE)
        return this.getCurrentMesh().render(main);
      if (this.isUsingDrawArrays())
        return this.getCurrentMesh().render(main);
      if (main.getMesh() === this && Multimesh.RENDER_HINT !== Multimesh.CAMERA)
        return this.getCurrentMesh().render(main);
      this.lowRender(main);
    }
  };

  Utils.makeProxy(MeshResolution, Multimesh, function (proto) {
    return function () {
      return proto.apply(this.getCurrentMesh(), arguments);
    };
  });

  return Multimesh;
});