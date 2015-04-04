define([], function () {

  'use strict';

  var queryBool = function (value, def) {
    if (value === undefined) return def;
    return value !== 'false' && value !== '0';
  };

  var queryNumber = function (value, min, max, def) {
    var f = parseFloat(value);
    if (!f && f !== 0.0) return def;
    return Math.max(min, Math.min(max, f));
  };

  var readUrlParameters = function (overURL) {
    var url = typeof overURL === 'string' ? overURL : window.location.search;
    var vars = url.substr(1).split('&');
    var params = {};
    for (var i = 0, nbVars = vars.length; i < nbVars; i++) {
      var pair = vars[i].split('=', 2);
      if (pair.length === 0) continue;
      params[pair[0].toLowerCase()] = pair[1];
    }
    return params;
  };

  var options;
  var initConfig = function (params) {
    if (!options)
      options = {};

    options.language = params.language; // english/chinese/korean/japan

    options.scalecenter = queryBool(params.scalecenter, true);

    options.grid = queryBool(params.grid, true);
    options.outline = queryBool(params.outline, false);
    options.mirrorline = queryBool(params.mirrorline, false);

    options.projection = (params.projection || 'PERSPECTIVE').toUpperCase(); // perspective/orthographic
    options.cameramode = (params.cameramode || 'ORBIT').toUpperCase(); // orbit/spherical/plane
    options.pivot = queryBool(params.pivot, false);
    options.fov = queryNumber(params.fov, 10, 150, 45); // [10-150]

    options.flat = queryBool(params.flat, false);
    options.wireframe = queryBool(params.wireframe, false);
    options.curvature = queryNumber(params.curvature, 0, 5, 1); // [0-5]
    options.exposure = queryNumber(params.exposure, 0, 5, 1); // [0-5]
    options.environment = queryNumber(params.environment, 0, Infinity, 0); // [0-inf]
    options.matcap = queryNumber(params.matcap, 0, Infinity, 0); // [0-inf]
    options.shader = (params.shader || 'PBR').toUpperCase(); // pbr/matcap/normal/uv
    return options;
  };

  var getUrlOptions = function (overURL) {
    if (typeof overURL === 'string')
      return initConfig(readUrlParameters(overURL));
    return options ? options : initConfig(readUrlParameters());
  };

  getUrlOptions();

  return getUrlOptions;
});