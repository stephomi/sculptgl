define([
  'gui/widgets/GuiUtils'
], function (GuiUtils) {

  'use strict';

  var EditStyle = {};

  EditStyle.refRules = {};

  var editStyle = function (selector, key, value) {
    var sheet = document.styleSheets[document.styleSheets.length - 1];
    var rules = sheet.cssRules || sheet.rules;
    var rule = EditStyle.refRules[selector];
    if (!rule) {
      var i = 0;
      var len = rules.length;
      for (i = 0; i < len; ++i) {
        if (rules[i].selectorText === selector) break;
      }
      if (i === len) return false;
      rule = EditStyle.refRules[selector] = rules[i];
    }
    if (rule)
      rule.style[key] = value;
    return true;
  };

  EditStyle.changeWidgetsColor = function (color) {
    var str = GuiUtils.getStrColor(color);
    // button
    editStyle('.gui-button', 'background', str);
    // select
    editStyle('.gui-select', 'background', str);
    // slider
    editStyle('.gui-slider > div', 'background', str);
    EditStyle._curWidgetColor = color;
  };

  EditStyle.changeDisplayBoorder = function (bool) {
    var str = bool ? '1px solid #000' : '0';
    editStyle('.gui-button', 'border', str);
    // select
    editStyle('.gui-select', 'border', str);
    // slider
    editStyle('.gui-slider', 'border', str);
    editStyle('.gui-input-number', 'border', str);
    // folder
    editStyle('.gui-sidebar > ul > label', 'borderTop', str);
    editStyle('.gui-sidebar > ul > label', 'borderBottom', str);
    // side bar
    editStyle('.gui-sidebar', 'borderLeft', str);
    editStyle('.gui-sidebar', 'borderRight', str);
    // top bar
    editStyle('.gui-topbar', 'borderBottom', str);
    EditStyle._curShowBorder = bool;
  };

  EditStyle.changeBackgroundColor = function (color) {
    // side bar
    editStyle('.gui-sidebar', 'background', GuiUtils.getStrColor(color));
    // top bar
    var colTop = GuiUtils.getStrColor(GuiUtils.getColorMult(color, 0.5));
    editStyle('.gui-topbar', 'background', colTop);
    editStyle('.gui-topbar ul > li > ul', 'background', colTop);
    EditStyle._curBackgroundColor = color;
  };

  EditStyle.changeTextColor = function (color) {
    editStyle('*', 'color', GuiUtils.getStrColor(color));
    var colBright = GuiUtils.getStrColor(GuiUtils.getColorAdd(color, -0.14));
    editStyle('.gui-sidebar > ul > label', 'color', colBright);
    editStyle('.group-title', 'color', colBright);
    editStyle('.group-title:hover', 'color', colBright);
    EditStyle._curTextColor = color;
  };

  EditStyle.changeOverallColor = function (color) {
    EditStyle.changeWidgetsColor(color);
    var bgCol = GuiUtils.getColorMult(color, 0.5);
    EditStyle.changeBackgroundColor(bgCol);

    var texCol = GuiUtils.getColorAdd(color, 0.47);
    for (var i = 0; i < 3; ++i) texCol[i] = Math.min(0.78, texCol[i]);
    EditStyle.changeTextColor(texCol);

    EditStyle._curWidgetColor = color;
    EditStyle._curBackgroundColor = bgCol;
    EditStyle._curTextColor = texCol;
  };

  // init value
  EditStyle._curTextColor = [0.73, 0.73, 0.73];
  EditStyle._curWidgetColor = [0.32, 0.37, 0.39];
  EditStyle._curBackgroundColor = [0.24, 0.24, 0.24];
  EditStyle._curShowBorder = false;

  EditStyle.changeOverallColor([0.47, 0.39, 0.35]);
  return EditStyle;
});