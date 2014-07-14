define([
  'gui/tr/english',
  'gui/tr/japan'
], function (english, japan) {

  'use strict';

  var GuiTR = function (key) {
    var str = GuiTR.languages[GuiTR.select][key];
    if (typeof str === 'string')
      return str;
    if (typeof str === 'function')
      return str.apply(this, Array.prototype.slice.call(arguments, 1));
    return key;
  };

  GuiTR.languages = {
    'english': english,
    '日本語': japan
  };

  GuiTR.select = 'english';
  var language = window.navigator.userLanguage || window.navigator.language;
  if (language === 'jp') GuiTR.select = '日本語';

  return GuiTR;
});