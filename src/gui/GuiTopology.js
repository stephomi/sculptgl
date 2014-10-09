define([
  'gui/GuiTR',
  'editor/Remesh',
  'mesh/multiresolution/Multimesh',
  'states/StateMultiresolution'
], function (TR, Remesh, Multimesh, StateMultiresolution) {

  'use strict';

  function GuiMultiresolution(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.ctrlResolution_ = null; // multiresolution controller
    this.init(guiParent);
  }

  GuiMultiresolution.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('topologyTitle'));
      menu.close();

      // multires
      menu.addTitle(TR('multiresTitle'));
      this.ctrlResolution_ = menu.addSlider(TR('multiresResolution'), 1, this.onResolutionChanged.bind(this), 1, 1, 1);
      menu.addDualButton(TR('multiresReverse'), TR('multiresSubdivide'), this, this, 'reverse', 'subdivide');
      var res = menu.addDualButton(TR('multiresDelLower'), TR('multiresDelHigher'), this, this, 'deleteLower', 'deleteHigher');
      res[0].domButton.style.background = res[1].domButton.style.background = 'rgba(230,53,59,0.35)';

      // remeshing
      menu.addTitle(TR('remeshTitle'));
      menu.addSlider(TR('remeshResolution'), Remesh, 'resolution', 8, 400, 1);
      menu.addButton(TR('remeshRemesh'), this, 'remesh');
    },
    /** Update information on mesh */
    remesh: function () {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      var newMesh = Remesh.remesh(main, mesh, main.getMeshes());
      main.getStates().pushStateAddRemove(newMesh, main.getMeshes().slice());
      main.meshes_.length = 0;
      main.meshes_.push(newMesh);
      main.setMesh(newMesh);
    },
    /** Check if the mesh is a multiresolution one */
    isMultimesh: function (mesh) {
      return mesh && mesh.meshes_ !== undefined;
    },
    /** Convert a mesh into a multiresolution one */
    convertToMultimesh: function (mesh) {
      var multimesh = new Multimesh(mesh);
      this.main_.replaceMesh(mesh, multimesh);
      return multimesh;
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this.main_;
      var mul = main.getMesh();
      if (!mul) return;
      if (!this.isMultimesh(mul))
        mul = this.convertToMultimesh(mul);
      if (mul.sel_ !== mul.meshes_.length - 1) {
        window.alert(TR('multiresSelectHighest'));
        return;
      }
      if (mul.getNbTriangles() > 400000) {
        if (!window.confirm(TR('multiresWarnBigMesh', mul.getNbFaces() * 4)))
          return;
      }
      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.SUBDIVISION));
      mul.addLevel();
      this.ctrlGui_.updateMeshInfo();
      this.updateMeshResolution();
      main.render();
    },
    /** Inverse subdivision */
    reverse: function () {
      var main = this.main_;
      var mul = main.getMesh();
      if (!mul) return;
      if (!this.isMultimesh(mul))
        mul = this.convertToMultimesh(mul);
      if (mul.sel_ !== 0) {
        window.alert(TR('multiresSelectLowest'));
        return;
      }
      var stateRes = new StateMultiresolution(main, mul, StateMultiresolution.REVERSION);
      var newMesh = mul.computeReverse();
      if (!newMesh) {
        window.alert(TR('multiresNotReversible'));
        return;
      }
      main.getStates().pushState(stateRes);
      this.ctrlGui_.updateMeshInfo();
      this.updateMeshResolution();
      main.render();
    },
    /** Delete the lower meshes */
    deleteLower: function () {
      var main = this.main_;
      var mul = main.mesh_;
      if (!this.isMultimesh(mul) || mul.sel_ === 0) {
        window.alert(TR('multiresNoLower'));
        return;
      }
      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_LOWER));
      mul.deleteLower();
      this.updateMeshResolution();
    },
    /** Delete the higher meshes */
    deleteHigher: function () {
      var main = this.main_;
      var mul = main.getMesh();
      if (!this.isMultimesh(mul) || mul.sel_ === mul.meshes_.length - 1) {
        window.alert(TR('multiresNoHigher'));
        return;
      }
      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_HIGHER));
      mul.deleteHigher();
      this.updateMeshResolution();
    },
    /** Change resoltuion */
    onResolutionChanged: function (value) {
      var uiRes = value - 1;
      var main = this.main_;
      var multimesh = main.getMesh();
      if (!this.isMultimesh(multimesh) || multimesh.sel_ === uiRes)
        return;
      main.getStates().pushState(new StateMultiresolution(main, multimesh, StateMultiresolution.SELECTION));
      multimesh.selectResolution(uiRes);
      this.ctrlGui_.updateMeshInfo();
      main.render();
    },
    /** Update the mesh resolution slider */
    updateMeshResolution: function () {
      var multimesh = this.main_.getMesh();
      if (!multimesh || !this.isMultimesh(multimesh)) {
        this.ctrlResolution_.setMax(1);
        this.ctrlResolution_.setValue(0);
        return;
      }
      this.ctrlResolution_.setMax(multimesh.meshes_.length);
      this.ctrlResolution_.setValue(multimesh.sel_ + 1);
    }
  };

  return GuiMultiresolution;
});