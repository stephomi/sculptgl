define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiBackground(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.init(guiParent);
  }

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // background fold
      var backgroundFold = guiParent.addMenu(TR('backgroundTitle'));
      backgroundFold.addButton(TR('backgroundReset'), this, 'resetBackground');
      backgroundFold.addButton(TR('backgroundImport'), this, 'importBackground');
      backgroundFold.addCheckbox(TR('backgroundFill'), this.main_.getBackground().fill_, this.updateFill.bind(this));
    },
    /** Reset background */
    updateFill: function (val) {
      this.main_.getBackground().fill_ = val;
      this.main_.onCanvasResize();
    },
    /** Reset background */
    resetBackground: function () {
      this.main_.getBackground().tex_ = null;
      this.main_.render();
    },
    /** Immort background */
    importBackground: function () {
      document.getElementById('backgroundopen').click();
    }
  };

  return GuiBackground;
});