define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');

  var GuiConfig = function (guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this.init(guiParent);
  };

  GuiConfig.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // config stuffs
      this._langs = Object.keys(TR.languages);
      this._menu = guiParent.addMenu('Language');
      this._menu.addCombobox('', this._langs.indexOf(TR.select), this.onLangChange.bind(this), this._langs);
    },
    onLangChange: function (value) {
      TR.select = this._langs[parseInt(value, 10)];
      this._ctrlGui.initGui();
    }
  };

  module.exports = GuiConfig;
});