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
      var backgroundFold = guiParent.addFolder(TR('backgroundTitle'));
      backgroundFold.add(this, 'resetBackground').name(TR('backgroundReset'));
      backgroundFold.add(this, 'importBackground').name(TR('backgroundImport'));
      backgroundFold.close();
    },
    /** Reset background */
    resetBackground: function () {
      var bg = this.scene_.background_;
      if (bg) {
        bg.release();
        this.scene_.background_ = null;
        this.scene_.render();
      }
    },
    /** Immort background */
    importBackground: function () {
      document.getElementById('backgroundopen').click();
    }
  };

  return GuiBackground;
});