define([], function () {

  'use strict';

  // TODO
  // It was based NPAPI, a deprecated API !
  // need a workaround now...
  // maybe I should take a look at pointer events, or extended touch events
  var Tablet = {
    useOnRadius: true, // the pen pressure acts on the tool's radius
    useOnIntensity: false // the pen pressure acts on the tool's intensity
  };

  /** Returns the pressure of pen: [0, 1] **/
  Tablet.pressure = function () {
    if (!Tablet.plugin)
      return 1.0;
  };

  Tablet.getPressureIntensity = function () {
    return Tablet.useOnIntensity === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  Tablet.getPressureRadius = function () {
    return Tablet.useOnRadius === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  return Tablet;
});