define([], function () {

  'use strict';

  function GuiBackground(guiParent, ctrlGui) {
    this.scene_ = ctrlGui.sculptgl_.scene_; // main application
    this.init(guiParent);
  }

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // background fold
      var backgroundFold = guiParent.addFolder('background');
      backgroundFold.add(this, 'resetBackground').name('Reset');
      backgroundFold.add(this, 'importBackground').name('Import (jpg, png...)');
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