import TR from 'gui/GuiTR';

class GuiBackground {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    // background fold
    var menu = this._menu = guiParent.addMenu(TR('backgroundTitle'));

    this._bg = this._main.getBackground();

    var types = ['Image', 'Environment', 'Ambient env'];
    menu.addCombobox('Type', this._bg._type, this.onBackgroundType.bind(this), types);
    this._ctrlBlur = menu.addSlider('Blur', this._bg._blur, this.onEnvBlur.bind(this), 0.0, 1.0, 0.01);
    this._ctrlBlur.setVisibility(this._bg._type === 1);

    menu.addTitle('Image');
    menu.addButton(TR('backgroundReset'), this, 'resetBackground');
    menu.addButton(TR('backgroundImport'), this, 'importBackground');
    menu.addCheckbox(TR('backgroundFill'), this._main.getBackground()._fill, this.updateFill.bind(this));
  }

  updateFill(val) {
    this._bg._fill = val;
    this._main.onCanvasResize();
  }

  resetBackground() {
    this._bg.deleteTexture();
    this._main.render();
  }

  onEnvBlur(val) {
    this._bg._blur = val;
    this._main.render();
  }

  onBackgroundType(val) {
    this._bg.setType(val);
    this._main.onCanvasResize();
    this._main.render();
    this._ctrlBlur.setVisibility(val === 1);
  }

  importBackground() {
    document.getElementById('backgroundopen').click();
  }
}

export default GuiBackground;
