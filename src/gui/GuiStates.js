define([
  'gui/GuiTR',
  'states/States'
], function (TR, States) {

  'use strict';

  var GuiTablet = function (guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui; // main gui controller
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  };

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // history fold
      var menu = this._menu = guiParent.addMenu(TR('stateTitle'));
      menu.addButton(TR('stateUndo'), this, 'onUndo', 'CTRL+Z');
      menu.addButton(TR('stateRedo'), this, 'onRedo', 'CTRL+Y');
      menu.addTitle(TR('stateMaxStack'));
      var states = this._main.getStates();
      menu.addSlider('', States.STACK_LENGTH, states.setNewMaxStack.bind(states), 3, 50, 1);
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
      if (!this._main._focusGui)
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
      this._main.getStates().undo();
      this._main.render();
      this._ctrlGui.updateMesh();
    },
    /** When the user redos an action */
    onRedo: function () {
      this._main.getStates().redo();
      this._main.render();
      this._ctrlGui.updateMesh();
    }
  };

  return GuiTablet;
});