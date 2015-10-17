define(function (require, exports, module) {

  'use strict';

  var ImportOBJ = require('files/ImportOBJ');
  var ImportSGL = require('files/ImportSGL');
  var ImportPLY = require('files/ImportPLY');
  var ImportSTL = require('files/ImportSTL');

  var Import = {
    importOBJ: ImportOBJ.importOBJ,
    importSGL: ImportSGL.importSGL,
    importPLY: ImportPLY.importPLY,
    importSTL: ImportSTL.importSTL
  };

  module.exports = Import;
});