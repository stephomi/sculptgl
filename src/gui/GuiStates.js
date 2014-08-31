define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiTablet(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui; // main gui controller
    this.sculptgl_ = ctrlGui.sculptgl_; // main application
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // history fold
      var foldHistory = guiParent.addMenu(TR('stateTitle'));
      foldHistory.addButton(TR('stateUndo'), this, 'onUndo', 'CTRL+Z');
      foldHistory.addButton(TR('stateRedo'), this, 'onRedo', 'CTRL+Y');
      this.addEvents();
    },
    /** Add events */
    addEvents: function () {
      var cbKeyDown = this.onKeyDown.bind(this);
      window.addEventListener('keydown', cbKeyDown, false);
      this.removeCallback = function () {
        window.removeEventListener('keydown', cbKeyDown, false);
      };
    },
    /** Remove events */
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
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