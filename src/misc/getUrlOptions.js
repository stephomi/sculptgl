define([], function () {

  'use strict';

  var options;

  var queryBool = function (value, def) {
    if (value === undefined) return def;
    if (value === 'false') return 0;
    if (value === 'true') return 1;
    return !!value;
  };

  var queryNumber = function (value, min, max, def) {
    var f = parseFloat(value);
    if (!f && f !== 0.0) return def;
    return Math.max(min, Math.min(max, f));
  };

  var getUrlOptions = function () {
    if (options)
      return options;

    options = {};

    // init url couples
    var vars = window.location.search.substr(1).split('&');
    for (var i = 0, nbVars = vars.length; i < nbVars; i++) {
      var pair = vars[i].split('=', 2);
      if (pair.length === 0) continue;
      options[pair[0].toLowerCase()] = pair[1];
    }

    options.language = options.language; // english/chinese/korean/japan
    options.grid = queryBool(options.grid, true);
    options.outline = queryBool(options.outline, false);
    options.mirrorline = queryBool(options.mirrorline, false);

    options.projection = (options.projection || 'PERSPECTIVE').toUpperCase(); // perspective/orthographic
    options.cameramode = (options.cameramode || 'ORBIT').toUpperCase(); // orbit/spherical/plane
    options.pivot = queryBool(options.pivot, false);
    options.fov = queryNumber(options.fov, 10, 150, 45); // [10-150]

    options.flat = queryBool(options.flat, false);
    options.wireframe = queryBool(options.wireframe, false);
    options.curvature = queryNumber(options.curvature, 0, 5, 1); // [0-5]
    options.exposure = queryNumber(options.exposure, 0, 5, 1); // [0-5]
    options.environment = queryNumber(options.environment, 0, Infinity, 0); // [0-inf]
    options.matcap = queryNumber(options.matcap, 0, Infinity, 0); // [0-inf]
    options.shader = (options.shader || 'PBR').toUpperCase(); // pbr/matcap/normal/uv
  };

  getUrlOptions();

  return getUrlOptions;
});