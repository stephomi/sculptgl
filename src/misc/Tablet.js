define([], function () {

  'use strict';

  // TODO
  // it's based on deprecated NPAPI, soon to be removed
  // maybe I should take a look at pointer events, or extended touch events
  var Tablet = {
    plugin: document.querySelector('object[type=\'application/x-wacomtabletplugin\']'),
    useOnRadius: true, // the pen pressure acts on the tool's radius
    useOnIntensity: false, // the pen pressure acts on the tool's intensity
    overridePressure: -1.0 // negative : no override, positive : use replay value
  };

  // f32 cast for sgl exporter consistency
  var d32cast = new Float32Array(1);

  /** Returns the pressure of pen: [0, 1] **/
  Tablet.pressure = function () {
    if (Tablet.overridePressure > 0.0)
      return Tablet.overridePressure;
    if (!Tablet.plugin)
      return 1.0;
    var pen = Tablet.plugin.penAPI;
    if (!pen || !pen.pointerType)
      return 1.0;
    d32cast[0] = pen.pressure;
    return d32cast[0];
  };

  /** Returns the pressure intensity **/
  Tablet.getPressureIntensity = function () {
    return Tablet.useOnIntensity === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  /** Returns the pressure radius **/
  Tablet.getPressureRadius = function () {
    return Tablet.useOnRadius === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  return Tablet;
});