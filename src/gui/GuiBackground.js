import TR from '../gui/GuiTR';

class GuiBackground {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    // background fold
    var menu = this._menu = guiParent.addMenu(TR('backgroundTitle'));
    menu.addButton(TR('backgroundReset'), this, 'resetBackground');
    menu.addButton(TR('backgroundImport'), this, 'importBackground');
    menu.addCheckbox(TR('backgroundFill'), this._main.getBackground()._fill, this.updateFill.bind(this));
  }

  updateFill(val) {
    this._main.getBackground()._fill = val;
    this._main.onCanvasResize();
  }

  resetBackground() {
    this._main.getBackground().deleteTexture();
    this._main.render();
  }

  importBackground() {
    document.getElementById('backgroundopen').click();
  }
}

export default GuiBackground;
