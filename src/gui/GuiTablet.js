define([
  'gui/GuiTR',
  'misc/Tablet'
], function (TR, Tablet) {

  'use strict';

  function GuiTablet(guiParent) {
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // Pen tablet ui stuffs
      var foldPenTablet = guiParent.addMenu(TR('wacomTitle'));
      foldPenTablet.addCheckbox(TR('wacomRadius'), Tablet, 'useOnRadius');
      foldPenTablet.addCheckbox(TR('wacomIntensity'), Tablet, 'useOnIntensity');
    }
  };

  return GuiTablet;
});