import TR from 'gui/GuiTR';
import Enums from 'misc/Enums';
import StateManager from 'states/StateManager';

class GuiTablet {

  constructor(guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui; // main gui controller
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    var menu = this._menu = guiParent.addMenu(TR('stateTitle'));
    menu.addButton(TR('stateUndo'), this, 'onUndo', 'CTRL+Z');
    menu.addButton(TR('stateRedo'), this, 'onRedo', 'CTRL+Y');
    menu.addTitle(TR('stateMaxStack'));
    var states = this._main.getStateManager();
    menu.addSlider('', StateManager.STACK_LENGTH, states.setNewMaxStack.bind(states), 3, 50, 1);
  }

  onUndo() {
    this._main._action = Enums.Action.NOTHING;
    this._main.getSculptManager().end(); // abort current sculpting operation
    this._main.getStateManager().undo();
    this._main.render();
    this._ctrlGui.updateMesh();
  }

  onRedo() {
    this._main.getStateManager().redo();
    this._main.render();
    this._ctrlGui.updateMesh();
  }

  /////////////
  // KEY EVENTS
  ///////////// 
  onKeyDown(event) {
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
  }
}

export default GuiTablet;
