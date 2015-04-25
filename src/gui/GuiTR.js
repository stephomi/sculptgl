define([
  'misc/getUrlOptions',
  'gui/tr/english',
  'gui/tr/chinese',
  'gui/tr/japanese',
  'gui/tr/korean',
  'gui/tr/russian'
], function (getUrlOptions, english, chinese, japanese, korean, russian) {

  'use strict';

  var GuiTR = function (key) {
    var str = GuiTR.languages[GuiTR.select][key] || GuiTR.languages.english[key];
    if (typeof str === 'string')
      return str;
    if (typeof str === 'function')
      return str.apply(this, Array.prototype.slice.call(arguments, 1));
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

  switch (getUrlOptions().language) {
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

  return GuiTR;
});