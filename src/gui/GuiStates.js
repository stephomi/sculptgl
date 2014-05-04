define([], function () {

  'use strict';

  function GuiTablet(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui; // main gui controller
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var self = this;

      // history fold
      var foldHistory = guiParent.addFolder('History');
      foldHistory.add(this, 'onUndo').name('Undo (Ctrl+Z)');
      foldHistory.add(this, 'onRedo').name('Redo (Ctrl+Y)');
      foldHistory.open();

      window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    },
    /** Key pressed event */
    onKeyDown: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (!this.sculptgl_.focusGui_)
        event.preventDefault();
      var key = event.which;
      if (event.ctrlKey && key === 90) { // z key
        this.onUndo();
        event.handled = true;
      } else if (event.ctrlKey && key === 89) { // y key
        this.onRedo();
        event.handled = true;
      }
    },
    /** When the user undos an action */
    onUndo: function () {
      var main = this.sculptgl_;
      main.states_.undo();
      main.scene_.render();
      this.ctrlGui_.updateMesh();
    },
    /** When the user redos an action */
    onRedo: function () {
      var main = this.sculptgl_;
      main.states_.redo();
      main.scene_.render();
      this.ctrlGui_.updateMesh();
    }
  };

  return GuiTablet;
});