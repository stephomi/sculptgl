import TR from 'gui/GuiTR';
import Tablet from 'misc/Tablet';

class GuiTablet {

  constructor(guiParent) {
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    // Pen tablet ui stuffs
    var menu = this._menu = guiParent.addMenu(TR('wacomTitle'));
    menu.addCheckbox(TR('wacomRadius'), Tablet, 'useOnRadius');
    menu.addCheckbox(TR('wacomIntensity'), Tablet, 'useOnIntensity');
  }
}

export default GuiTablet;
