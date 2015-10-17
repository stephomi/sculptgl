define(function (require, exports, module) {

  'use strict';

  var getOptionsURL = require('misc/getOptionsURL');
  var english = require('gui/tr/english');
  var chinese = require('gui/tr/chinese');
  var japanese = require('gui/tr/japanese');
  var korean = require('gui/tr/korean');
  var russian = require('gui/tr/russian');

  var GuiTR = function (key) {
    var str = GuiTR.languages[GuiTR.select][key] || GuiTR.languages.english[key];
    if (typeof str === 'string')
      return str;
    if (typeof str === 'function')
      return str.apply(this, Array.prototype.slice.call(arguments, 1));
    console.error('No TR found for : ' + key);
    return key;
  };

  GuiTR.languages = {
    'english': english,
    '日本語': japanese,
    '中文': chinese,
    '한국어': korean,
    'русский': russian
  };

  GuiTR.select = 'english';
  var language = window.navigator.language || window.navigator.userLanguage;
  if (language) language = language.substr(0, 2);
  if (language === 'ja') GuiTR.select = '日本語';
  else if (language === 'zh') GuiTR.select = '中文';
  else if (language === 'ko') GuiTR.select = '한국어';
  else if (language === 'ru') GuiTR.select = 'русский';

  switch (getOptionsURL().language) {
  case 'english':
    GuiTR.select = 'english';
    break;
  case 'chinese':
    GuiTR.select = '中文';
    break;
  case 'korean':
    GuiTR.select = '한국어';
    break;
  case 'japanese':
    GuiTR.select = '日本語';
    break;
  case 'russian':
    GuiTR.select = 'русский';
    break;
  }

  module.exports = GuiTR;
});