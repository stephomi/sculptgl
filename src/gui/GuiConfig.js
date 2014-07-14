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
      var self = this;
      // config stuffs
      var foldConfig = guiParent.addFolder(TR('configTitle'));
      var ctrlLang = foldConfig.add(TR, 'select', Object.keys(TR.languages)).name('Language');
      ctrlLang.onChange(function () {
        self.ctrlGui_.initGui();
      });
      foldConfig.open();
    }
  };

  return GuiConfig;
});