define([
  'gui/GuiTR',
  'editor/tools/Tools',
  'misc/getOptionsURL'
], function (TR, Tools, getOptionsURL) {

  'use strict';

  var GuiShortcuts = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this.init(guiParent);
  };

  GuiShortcuts.prototype = {
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('shortcutsTitle'));

      var keys = {
        '49': '1',
        '50': '2',
        '51': '3',
        '52': '4',
        '53': '5',
        '54': '6',
        '55': '7',
        '56': '8',
        '57': '9',
        '48': '0',
        '-1': 'none'
      };

      var tools = Tools.keys;
      for (var i = 0, nbTools = tools.length; i < nbTools; ++i) {
        var tn = tools[i];
        // console.log(Tools.shortcuts,tn);
        menu.addCombobox(TR(Tools[tn].uiName), Tools.shortcuts[tn], this.onShortcutChange.bind(this), keys);
      }
    },
    onShortcutChange: function () {
      console.log(arguments);
    },
  };

  return GuiShortcuts;
});