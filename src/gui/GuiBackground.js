define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');

  var GuiBackground = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  };

  GuiBackground.prototype = {
    init: function (guiParent) {
      // background fold
      var menu = this._menu = guiParent.addMenu(TR('backgroundTitle'));
      menu.addButton(TR('backgroundReset'), this, 'resetBackground');
      menu.addButton(TR('backgroundImport'), this, 'importBackground');
      menu.addCheckbox(TR('backgroundFill'), this._main.getBackground()._fill, this.updateFill.bind(this));
    },
    updateFill: function (val) {
      this._main.getBackground()._fill = val;
      this._main.onCanvasResize();
    },
    resetBackground: function () {
      this._main.getBackground().deleteTexture();
      this._main.render();
    },
    importBackground: function () {
      document.getElementById('backgroundopen').click();
    }
  };

  module.exports = GuiBackground;
});