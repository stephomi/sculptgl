define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  var GuiBackground = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.init(guiParent);
  };

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // background fold
      var menu = this.menu_ = guiParent.addMenu(TR('backgroundTitle'));
      menu.addButton(TR('backgroundReset'), this, 'resetBackground');
      menu.addButton(TR('backgroundImport'), this, 'importBackground');
      menu.addCheckbox(TR('backgroundFill'), this.main_.getBackground().fill_, this.updateFill.bind(this));
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