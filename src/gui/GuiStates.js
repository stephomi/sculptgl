define([
  'gui/GuiTR',
  'states/States'
], function (TR, States) {

  'use strict';

  function GuiTablet(guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui; // main gui controller
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // history fold
      var menu = this.menu_ = guiParent.addMenu(TR('stateTitle'));
      menu.addButton(TR('stateUndo'), this, 'onUndo', 'CTRL+Z');
      menu.addButton(TR('stateRedo'), this, 'onRedo', 'CTRL+Y');
      menu.addTitle(TR('stateMaxStack'));
      var states = this.main_.getStates();
      menu.addSlider('', States.STACK_LENGTH, states.setNewMaxStack.bind(states), 1, 50, 1);
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
      if (!this.main_.focusGui_)
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
      this.main_.getStates().undo();
      this.main_.render();
      this.ctrlGui_.updateMesh();
    },
    /** When the user redos an action */
    onRedo: function () {
      this.main_.getStates().redo();
      this.main_.render();
      this.ctrlGui_.updateMesh();
    }
  };

  return GuiTablet;
});