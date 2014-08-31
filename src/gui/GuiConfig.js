define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiConfig(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.init(guiParent);
  }

  GuiConfig.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // config stuffs
      this.langs_ = Object.keys(TR.languages);
      var foldConfig = guiParent.addMenu('Language');
      foldConfig.addCombobox('', this.langs_.indexOf(TR.select), this.onLangChange.bind(this), this.langs_);
    },
    onLangChange: function (value) {
      TR.select = this.langs_[parseInt(value, 10)];
      this.ctrlGui_.initGui();
    }
  };

  return GuiConfig;
});