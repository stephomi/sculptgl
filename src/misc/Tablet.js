define(function (require, exports, module) {

  'use strict';

  var getOptionsURL = require('misc/getOptionsURL');

  // TODO
  // It was based NPAPI, a deprecated API !
  // need a workaround now...
  // maybe I should take a look at pointer events, or extended touch events
  // only if requested through url
  var plugin;
  if (getOptionsURL().wacom) {
    plugin = document.createElement('object');
    plugin.setAttribute('id', 'tablet-plugin');
    plugin.setAttribute('type', 'application/x-wacomtabletplugin');
    document.body.appendChild(plugin);
  }

  var Tablet = {
    useOnRadius: true, // the pen pressure acts on the tool's radius
    useOnIntensity: false // the pen pressure acts on the tool's intensity
  };

  /** Returns the pressure of pen: [0, 1] **/
  Tablet.pressure = function () {
    if (!plugin)
      return 1.0;
    var pen = plugin.penAPI;
    return pen && pen.pointerType ? pen.pressure : 1.0;
  };

  Tablet.getPressureIntensity = function () {
    return Tablet.useOnIntensity === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  Tablet.getPressureRadius = function () {
    return Tablet.useOnRadius === true ? 0.25 + Tablet.pressure() * 0.75 : 1.0;
  };

  module.exports = Tablet;
});