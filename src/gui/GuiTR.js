import getOptionsURL from 'misc/getOptionsURL';
import english from 'gui/tr/english';
import chinese from 'gui/tr/chinese';
import japanese from 'gui/tr/japanese';
import korean from 'gui/tr/korean';
import russian from 'gui/tr/russian';
import turkish from 'gui/tr/turkish';
import swedish from 'gui/tr/swedish';
import french from 'gui/tr/french';
import german from 'gui/tr/german';

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
  'русский': russian,
  'turkish': turkish,
  'svenska': swedish,
  'français': french,
  'deutsch': german
};

GuiTR.select = 'english';
var language = window.navigator.language || window.navigator.userLanguage;
if (language) language = language.substr(0, 2);
if (language === 'ja') GuiTR.select = '日本語';
else if (language === 'zh') GuiTR.select = '中文';
else if (language === 'ko') GuiTR.select = '한국어';
else if (language === 'tr') GuiTR.select = 'turkish';
else if (language === 'sv') GuiTR.select = 'svenska';
else if (language === 'fr') GuiTR.select = 'français';
else if (language === 'de') GuiTR.select = 'deutsch';

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
case 'turkish':
  GuiTR.select = 'turkish';
  break;
case 'swedish':
  GuiTR.select = 'svenska';
  break;
case 'french':
  GuiTR.select = 'français';
  break;
case 'german':
  GuiTR.select = 'deutsch';
  break;
}

export default GuiTR;
