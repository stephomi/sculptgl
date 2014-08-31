define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiBackground(guiParent, ctrlGui) {
    this.scene_ = ctrlGui.sculptgl_.scene_; // main application
    this.init(guiParent);
  }

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // background fold
      var backgroundFold = guiParent.addMenu(TR('backgroundTitle'));
      backgroundFold.addButton(TR('backgroundReset'), this, 'resetBackground');
      backgroundFold.addButton(TR('backgroundImport'), this, 'importBackground');
      backgroundFold.addCheckbox(TR('backgroundFill'), this.scene_.background_.fill_, this.updateFill.bind(this));
    },
    /** Reset background */
    updateFill: function (val) {
      this.scene_.background_.fill_ = val;
      this.scene_.onCanvasResize();
    },
    /** Reset background */
    resetBackground: function () {
      this.scene_.background_.tex_ = null;
      this.scene_.render();
    },
    /** Immort background */
    importBackground: function () {
      document.getElementById('backgroundopen').click();
    }
  };

  return GuiBackground;
});