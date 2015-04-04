define([], function () {

  'use strict';

  var options;

  var queryBool = function (value, def) {
    if (value === undefined) return def;
    if (value === 'false') return 0;
    if (value === 'true') return 1;
    return !!value;
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
    options.fov = parseFloat(options.fov) || 45.0;

    options.flat = queryBool(options.flat, false);
    options.wireframe = queryBool(options.wireframe, false);
    options.curvature = queryBool(options.curvature, true);
    options.matcap = parseInt(options.matcap, 10) || 0;
    options.shader = (options.shader || 'PBR').toUpperCase(); // pbr/matcap/normal/uv
    options.environment = parseInt(options.environment, 10) || 0;
    options.exposure = parseFloat(options.exposure) || 1.0;
  };

  getUrlOptions();

  return getUrlOptions;
});