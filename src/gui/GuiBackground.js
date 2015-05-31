define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  var GuiBackground = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  };

  GuiBackground.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // background fold
      var menu = this._menu = guiParent.addMenu(TR('backgroundTitle'));
      menu.addButton(TR('backgroundReset'), this, 'resetBackground');
      menu.addButton(TR('backgroundImport'), this, 'importBackground');
      menu.addCheckbox(TR('backgroundFill'), this._main.getBackground()._fill, this.updateFill.bind(this));
    },
    /** Reset background */
    updateFill: function (val) {
      this._main.getBackground()._fill = val;
      this._main.onCanvasResize();
    },
    /** Reset background */
    resetBackground: function () {
      this._main.getBackground()._tex = null;
      this._main.render();
    },
    /** Immort background */
    importBackground: function () {
      document.getElementById('backgroundopen').click();
    }
  };

  return GuiBackground;
});