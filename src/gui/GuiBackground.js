define([
  'lib/jQuery'
], function ($) {

  'use strict';

  function GuiBackground(guiParent, ctrlGui) {
    this.scene_ = ctrlGui.sculptgl_.scene_; //main application
    this.init(guiParent);
  }

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      //background fold
      var backgroundFold = guiParent.addFolder('background');
      backgroundFold.add(this, 'resetBackground').name('Reset');
      backgroundFold.add(this, 'importBackground').name('Import (jpg, png...)');
      backgroundFold.open();
    },
    /** Reset background */
    resetBackground: function () {
      var bg = this.scene_.background_;
      if (bg) {
        bg.release();
        this.scene_.background_ = null;
      }
    },
    /** Immort background */
    importBackground: function () {
      $('#backgroundopen').trigger('click');
    }
  };

  return GuiBackground;
});