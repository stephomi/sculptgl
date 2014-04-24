define([
  'states/StateMultiresolution'
], function (StateMultiresolution) {

  'use strict';

  function GuiMultiresolution(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.sculptgl_ = ctrlGui.sculptgl_; //main application
    this.ctrlResolution_ = null; //multiresolution controller
    this.init(guiParent);
  }

  GuiMultiresolution.prototype = {
    /** Initialize */
    init: function (guiParent) {
      //multires fold
      var foldMultires = guiParent.addFolder('Multires');
      foldMultires.add(this, 'subdivide');
      this.ctrlResolution_ = foldMultires.add({
        dummy: 1
      }, 'dummy', 1, 1).step(1).name('resolution');
      this.ctrlResolution_.onChange(this.onResolutionChanged.bind(this));
      foldMultires.open();
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ !== mul.meshes_.length - 1) {
        window.alert('Select the highest resolution before subdividing.');
        return;
      }
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.SUBDIVISION));
      this.ctrlGui_.updateMeshInfo(mul.addLevel());
      this.updateMeshResolution(mul);
      main.scene_.render();
    },
    /** Change resoltuion */
    onResolutionChanged: function (value) {
      var uiRes = value - 1;
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ === uiRes)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.SELECTION));
      mul.selectResolution(uiRes);
      this.ctrlGui_.updateMeshInfo(mul.getCurrent());
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