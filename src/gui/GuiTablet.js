define([
  'gui/GuiTR',
  'misc/Tablet'
], function (TR, Tablet) {

  'use strict';

  function GuiTablet(guiParent) {
    this.menu_ = null; // ui menu
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // Pen tablet ui stuffs
      var menu = this.menu_ = guiParent.addMenu(TR('wacomTitle'));
      menu.addCheckbox(TR('wacomRadius'), Tablet, 'useOnRadius');
      menu.addCheckbox(TR('wacomIntensity'), Tablet, 'useOnIntensity');
    }
  };

  return GuiTablet;
});