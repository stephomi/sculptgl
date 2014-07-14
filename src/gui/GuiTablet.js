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
      var foldPenTablet = guiParent.addFolder(TR('wacomTitle'));
      foldPenTablet.add(Tablet, 'useOnRadius').name(TR('wacomRadius'));
      foldPenTablet.add(Tablet, 'useOnIntensity').name(TR('wacomIntensity'));
      foldPenTablet.close();
    }
  };

  return GuiTablet;
});