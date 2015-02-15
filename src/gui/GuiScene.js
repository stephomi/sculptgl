define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  var GuiScene = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application
    this.init(guiParent);
  };

  GuiScene.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = guiParent.addMenu(TR('sceneTitle'));

      // scene
      menu.addButton(TR('sceneReset'), this.main_, 'clearScene');
      menu.addButton(TR('sceneAddSphere'), this.main_, 'addSphere');
    }
  };

  return GuiScene;
});