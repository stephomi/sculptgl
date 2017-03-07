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

    menu.addTitle(TR('pressureRadius'));
    menu.addSlider('', Tablet, 'radiusFactor', 0, 1, 0.01);

    menu.addTitle(TR('pressureIntensity'));
    menu.addSlider('', Tablet, 'intensityFactor', 0, 1, 0.01);
  }
}

export default GuiTablet;
