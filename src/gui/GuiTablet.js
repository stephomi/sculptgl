import TR from 'gui/GuiTR';
import Tablet from 'misc/Tablet';

class GuiTablet {

  constructor(guiParent) {
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    // Pen tablet ui stuffs
    var menu = this._menu = guiParent.addMenu(TR('pressureTitle'));
    menu.addCheckbox(TR('pressureRadius'), Tablet, 'useOnRadius');
    menu.addCheckbox(TR('pressureIntensity'), Tablet, 'useOnIntensity');
  }
}

export default GuiTablet;
