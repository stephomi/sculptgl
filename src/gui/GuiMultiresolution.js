define([
  'states/StateMultiresolution'
], function (StateMultiresolution) {

  'use strict';

  function GuiMultiresolution(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.ctrlResolution_ = null; // multiresolution controller
    this.init(guiParent);
  }

  GuiMultiresolution.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // multires fold
      var foldMultires = guiParent.addFolder('Multires');
      foldMultires.add(this, 'subdivide').name('Subdivide');
      foldMultires.add(this, 'reverse').name('Reverse');
      this.ctrlResolution_ = foldMultires.add({
        dummy: 1
      }, 'dummy', 1, 1).step(1).name('Resolution');
      foldMultires.add(this, 'deleteHigher').name('Delete higher');
      foldMultires.add(this, 'deleteLower').name('Delete lower');
      this.ctrlResolution_.onChange(this.onResolutionChanged.bind(this));
      foldMultires.open();
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this.sculptgl_;
      var mul = main.mesh_;
      if (mul.sel_ !== mul.meshes_.length - 1) {
        window.alert('Select the highest resolution before subdividing.');
        return;
      }
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.SUBDIVISION));
      this.ctrlGui_.updateMeshInfo(mul.addLevel());
      this.updateMeshResolution(mul);
      main.scene_.render();
    },
    /** Inverse loop subdivision */
    reverse: function () {
      var main = this.sculptgl_;
      var mul = main.mesh_;
      if (mul.sel_ !== 0) {
        window.alert('Select the lowest resolution before reversing.');
        return;
      }
      var stateRes = new StateMultiresolution(mul, StateMultiresolution.DECIMATION);
      var newMesh = mul.decimate();
      if (!newMesh) {
        window.alert('Sorry it is not possile to revert this mesh.');
        return;
      }
      main.states_.pushState(stateRes);
      this.ctrlGui_.updateMeshInfo(newMesh);
      this.updateMeshResolution(mul);
      main.scene_.render();
    },
    /** Delete the lower meshes */
    deleteLower: function () {
      var main = this.sculptgl_;
      var mul = main.mesh_;
      if (mul.sel_ === 0) {
        window.alert('There is no lower resolution level.');
        return;
      }
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.DELETE_LOWER));
      mul.deleteLower();
      this.updateMeshResolution(mul);
    },
    /** Delete the higher meshes */
    deleteHigher: function () {
      var main = this.sculptgl_;
      var mul = main.mesh_;
      if (mul.sel_ === mul.meshes_.length - 1) {
        window.alert('There is no higher resolution level.');
        return;
      }
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.DELETE_HIGHER));
      mul.deleteHigher();
      this.updateMeshResolution(mul);
    },
    /** Change resoltuion */
    onResolutionChanged: function (value) {
      var uiRes = value - 1;
      var main = this.sculptgl_;
      var multimesh = main.mesh_;
      if (multimesh.sel_ === uiRes)
        return;
      main.states_.pushState(new StateMultiresolution(multimesh, StateMultiresolution.SELECTION));
      multimesh.selectResolution(uiRes);
      this.ctrlGui_.updateMeshInfo(multimesh);
      main.scene_.render();
    },
    /** Update the mesh resolution slider */
    updateMeshResolution: function (multimesh) {
      this.ctrlResolution_.max(multimesh.meshes_.length);
      this.ctrlResolution_.setValue(multimesh.sel_ + 1);
    }
  };

  return GuiMultiresolution;
});