define([
  'misc/Tablet'
], function (Tablet) {

  'use strict';

  function GuiTablet(guiParent) {
    this.init(guiParent);
  }

  GuiTablet.prototype = {
    /** Initialize */
    init: function (guiParent) {
      // Pen tablet ui stuffs
      var foldPenTablet = guiParent.addFolder('Wacom tablet');
      foldPenTablet.add(Tablet, 'useOnRadius').name('Pressure radius');
      foldPenTablet.add(Tablet, 'useOnIntensity').name('Pressure intensity');
    }
  };

  return GuiTablet;
});