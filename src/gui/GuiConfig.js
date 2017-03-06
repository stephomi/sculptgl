import TR from 'gui/GuiTR';

class GuiConfig {

  constructor(guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this.init(guiParent);
  }

  init(guiParent) {
    // config stuffs
    this._langs = Object.keys(TR.languages);
    this._menu = guiParent.addMenu('Language');
    this._menu.addCombobox('', this._langs.indexOf(TR.select), this.onLangChange.bind(this), this._langs);
  }

  onLangChange(value) {
    TR.select = this._langs[parseInt(value, 10)];
    this._ctrlGui.initGui();
  }
}

export default GuiConfig;
