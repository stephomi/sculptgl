define([
  'gui/GuiTR',
  'render/shaders/ShaderBase'
], function (TR, ShaderBase) {

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
      menu.addButton(TR('sceneReset'), this.main_, 'clearScene' /*, 'CTRL+ALT+N'*/ );
      menu.addButton(TR('sceneAddSphere'), this.main_, 'addSphere');
      menu.addButton(TR('sceneAddCube'), this.main_, 'addCube');

      menu.addTitle(TR('renderingExtra'));
      menu.addCheckbox(TR('renderingGrid'), this.main_.showGrid_, this.onShowGrid.bind(this));
      menu.addCheckbox(TR('renderingSymmetryLine'), ShaderBase.showSymmetryLine, this.onShowSymmetryLine.bind(this));
    },
    onShowSymmetryLine: function (val) {
      // TODO push in the replayer...
      ShaderBase.showSymmetryLine = val;
      this.main_.render();
    },
    onShowGrid: function (bool) {
      var main = this.main_;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('SHOW_GRID', bool);

      main.showGrid_ = bool;
      main.render();
    }
  };

  return GuiScene;
});