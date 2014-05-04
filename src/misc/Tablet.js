define([], function () {

  'use strict';

  var Tablet = {
    plugin: document.querySelector('object[type=\'application/x-wacomtabletplugin\']'),
    useOnRadius: true, // the pen pressure acts on the tool's radius
    useOnIntensity: false // the pen pressure acts on the tool's intensity
  };

  /** Returns the pressure of pen: [0, 1] **/
  Tablet.pressure = function () {
    var pen;
    if (Tablet.plugin)
      pen = Tablet.plugin.penAPI;
    return (pen && pen.pointerType) ? pen.pressure : 1;
  };

  /** Returns the pressure intensity **/
  Tablet.getPressureIntensity = function () {
    return Tablet.useOnIntensity === true ? Tablet.pressure() : 1.0;
  };

  /** Returns the pressure radius **/
  Tablet.getPressureRadius = function () {
    return Tablet.useOnRadius === true ? Tablet.pressure() : 1.0;
  };

  return Tablet;
});