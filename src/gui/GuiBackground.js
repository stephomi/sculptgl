define([
  'lib/jQuery'
], function ($) {

  'use strict';

  function GuiBackground(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; //main application
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
      var bg = this.sculptgl_.background_;
      if (bg) {
        bg.gl_.deleteTexture(bg.backgroundLoc_);
        this.sculptgl_.background_ = null;
      }
    },
    /** Immort background */
    importBackground: function () {
      $('#backgroundopen').trigger('click');
    }
  };

  return GuiBackground;
});