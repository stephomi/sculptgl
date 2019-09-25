import Enums from 'misc/Enums';

var keyAction = Enums.KeyAction;

var queryBool = function (value, def) {
  if (value === undefined) return def;
  return value !== 'false' && value !== '0';
};

var queryNumber = function (value, min, max, def) {
  var f = parseFloat(value);
  if (!f && f !== 0.0) return def;
  return Math.max(min, Math.min(max, f));
};

var queryInteger = function (value, min, max, def) {
  var f = parseInt(value, 10);
  if (!f && f !== 0.0) return def;
  return Math.max(min, Math.min(max, f));
};

var queryColor = function (color, def) {
  if (!color) return def;
  var arr = color.split(',');
  if (arr.length < 3) return def;
  var out = def.slice();
  out[0] = parseInt(arr[0] || 0, 10) / 255;
  out[1] = parseInt(arr[1] || 0, 10) / 255;
  out[2] = parseInt(arr[2] || 0, 10) / 255;
  if (arr[3] !== undefined) out[3] = parseFloat(arr[3]);
  return out;
};

var readShortcuts = function (str) {
  var shortcuts = {};

  // tools
  shortcuts['0'.charCodeAt(0)] = keyAction.MOVE;
  shortcuts['1'.charCodeAt(0)] = keyAction.BRUSH;
  shortcuts['2'.charCodeAt(0)] = keyAction.INFLATE;
  shortcuts['3'.charCodeAt(0)] = keyAction.TWIST;
  shortcuts['4'.charCodeAt(0)] = keyAction.SMOOTH;
  shortcuts['5'.charCodeAt(0)] = keyAction.FLATTEN;
  shortcuts['6'.charCodeAt(0)] = keyAction.PINCH;
  shortcuts['7'.charCodeAt(0)] = keyAction.CREASE;
  shortcuts['8'.charCodeAt(0)] = keyAction.DRAG;
  shortcuts['9'.charCodeAt(0)] = keyAction.PAINT;
  shortcuts['E'.charCodeAt(0)] = keyAction.TRANSFORM;

  // sculpting
  shortcuts['C'.charCodeAt(0)] = keyAction.INTENSITY;
  shortcuts['X'.charCodeAt(0)] = keyAction.RADIUS;
  shortcuts['N'.charCodeAt(0)] = keyAction.NEGATIVE;
  shortcuts['S'.charCodeAt(0)] = keyAction.PICKER;
  shortcuts[46] = keyAction.DELETE; // DEL

  // camera
  shortcuts['F'.charCodeAt(0)] = keyAction.CAMERA_FRONT;
  shortcuts['T'.charCodeAt(0)] = keyAction.CAMERA_TOP;
  shortcuts['L'.charCodeAt(0)] = keyAction.CAMERA_LEFT;
  shortcuts[32] = keyAction.CAMERA_RESET; // SPACE
  shortcuts[37] = keyAction.STRIFE_LEFT;
  shortcuts[39] = keyAction.STRIFE_RIGHT;
  shortcuts[38] = keyAction.STRIFE_UP;
  shortcuts[40] = keyAction.STRIFE_DOWN;

  // rendering
  shortcuts['W'.charCodeAt(0)] = keyAction.WIREFRAME;

  // other
  shortcuts['R'.charCodeAt(0)] = keyAction.REMESH;

  if (!str)
    return shortcuts;

  var vars = str.split(',');
  for (var i = 0, nbVars = vars.length; i < nbVars; i++) {
    var pair = vars[i].split(':', 2);
    if (pair.length !== 2) continue;

    var key = pair[1].toUpperCase();
    var tInt = parseInt(key, 10);
    // check if we consider it as charcode
    if (tInt === tInt && tInt >= 10) key = tInt;
    else key = key.charCodeAt(0);

    var keyac = keyAction[pair[0].toUpperCase()];
    if (keyac !== undefined) shortcuts[key] = keyac;
  }

  return shortcuts;
};

var readUrlParameters = function () {
  var vars = window.location.search.substr(1).split('&');
  var params = {};
  for (var i = 0, nbVars = vars.length; i < nbVars; i++) {
    var pair = vars[i].split('=', 2);
    if (pair.length !== 2) continue;
    params[pair[0].toLowerCase()] = pair[1];
  }
  return params;
};

var getEnum = function (obj, str, def) {
  if (str) {
    var val = obj[str.toUpperCase()];
    if (val !== undefined) return val;
  }
  return def;
};

var options;
var getOptionsURL = function () {
  if (options)
    return options;

  options = {};

  var params = readUrlParameters();

  // misc
  options.language = params.language; // english/chinese/korean/japanese/russian/turkish/swedish/french/german
  options.scalecenter = queryBool(params.scalecenter, false);

  // display
  options.grid = queryBool(params.grid, true);
  options.outline = queryBool(params.outline, false);
  options.outlinecolor = queryColor(params.outlinecolor, [0.3, 0.0, 0.0, 1.0]);
  options.mirrorline = queryBool(params.mirrorline, false);
  options.darkenunselected = queryBool(params.darkenunselected, true);

  // camera
  options.projection = getEnum(Enums.Projection, params.projection, Enums.Projection.PERSPECTIVE); // perspective/orthographic
  options.cameramode = getEnum(Enums.CameraMode, params.cameramode, Enums.Projection.ORBIT); // orbit/spherical/plane
  options.pivot = queryBool(params.pivot, true);
  options.fov = queryNumber(params.fov, 10, 90, 45); // [10-90]

  // rendering
  options.flatshading = queryBool(params.flatshading, false);
  options.wireframe = queryBool(params.wireframe, false);
  options.curvature = queryNumber(params.curvature, 0, 5, 0); // [0-5]
  options.exposure = queryNumber(params.exposure, 0, 5); // [0-5]
  options.environment = queryInteger(params.environment, 0, Infinity, 0); // [0-inf]
  options.matcap = queryInteger(params.matcap, 0, Infinity, 3); // [0-inf]
  options.shader = getEnum(Enums.Shader, params.shader, Enums.Shader.MATCAP); // pbr/matcap/normal/uv
  options.filmic = queryBool(params.filmic, false);

  options.modelurl = params.modelurl;

  options.shortcuts = readShortcuts(params.shortcuts);

  return options;
};

getOptionsURL();

getOptionsURL.getShortKey = function (key) {
  // handles numpad
  if (key >= 96 && key <= 105) key -= 48;
  return getOptionsURL().shortcuts[key];
};

export default getOptionsURL;
