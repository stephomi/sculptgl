define([], function () {

  'use strict';

  var GuiUtils = {};

  GuiUtils.makeProxy = function (source, proxy, wrapFunc) {
    var sourceProto = source.prototype;
    var proxyProto = proxy.prototype;
    var protos = Object.keys(sourceProto);
    for (var i = 0, l = protos.length; i < l; ++i) {
      var proto = protos[i];
      if (!proxyProto[proto])
        proxyProto[proto] = wrapFunc ? wrapFunc(sourceProto[proto]) : sourceProto[proto];
    }
  };
  GuiUtils.rgbToHsv = function (rgb) {
    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];
    var maxRGB = Math.max(r, g, b);
    var minRGB = Math.min(r, g, b);
    if (minRGB === maxRGB) return [0, 0, minRGB];
    var d = (r === minRGB) ? g - b : ((b === minRGB) ? r - g : b - r);
    var h = (r === minRGB) ? 3 : ((b === minRGB) ? 1 : 5);
    return [(h - d / (maxRGB - minRGB)) / 6, (maxRGB - minRGB) / maxRGB, maxRGB];
  };
  GuiUtils.hsvToRgb = function (hsv) {
    var h = hsv[0] * 6;
    var s = hsv[1];
    var v = hsv[2];
    var i = Math.floor(h);
    var f = h - i;
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var mod = i % 6;
    if (mod === 0) return [v, t, p];
    else if (mod === 1) return [q, v, p];
    else if (mod === 2) return [p, v, t];
    else if (mod === 3) return [p, q, v];
    else if (mod === 4) return [t, p, v];
    else return [v, p, q];
  };
  GuiUtils.getValidColor = function (color) {
    for (var i = 0; i < 3; ++i) color[i] = Math.max(0.0, Math.min(1.0, color[i]));
    return color;
  };
  GuiUtils.getStrColor = function (color) {
    if (color.length === 3) return GuiUtils.rgbToHex(color);
    return 'rgba(' + Math.round(color[0] * 255) + ',' + Math.round(color[1] * 255) + ',' + Math.round(color[2] * 255) + ',' + color[3] + ')';
  };
  GuiUtils.getColorMult = function (color, fac) {
    return GuiUtils.getValidColor([color[0] * fac, color[1] * fac, color[2] * fac]);
  };
  GuiUtils.getColorAdd = function (color, add) {
    return GuiUtils.getValidColor([color[0] + add, color[1] + add, color[2] + add]);
  };
  GuiUtils.rgbToHex = function (rgb) {
    var h = '#';
    for (var i = 0; i < 3; ++i) {
      var c = Math.round(rgb[i] * 255).toString(16);
      h += c.length === 1 ? '0' + c : c;
    }
    return h;
  };
  GuiUtils.hexToRgb = function (hex) {
    var i = 0;
    if (hex[0] === '#') hex = hex.slice(1);
    var h = hex;
    if (hex.length > 6) h = hex.slice(0, 6);
    else if (hex.length < 6) {
      h = '';
      for (i = 0; i < 3; ++i)
        h += hex[i] ? hex[i] + hex[i] : '00';
    }
    var col = [0, 0, 0];
    for (i = 0; i < 3; ++i) {
      var c = parseInt(h[i * 2] + h[i * 2 + 1], 16);
      col[i] = (c !== c ? 0 : c) / 255;
    }
    return col;
  };

  return GuiUtils;
});