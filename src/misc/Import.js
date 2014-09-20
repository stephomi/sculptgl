define([
  'misc/ImportOBJ',
  'misc/ImportPLY',
  'misc/ImportSTL'
], function (ImportOBJ, ImportPLY, ImportSTL) {

  'use strict';

  var Import = {
    importOBJ: ImportOBJ.importOBJ,
    importPLY: ImportPLY.importPLY,
    importSTL: ImportSTL.importSTL
  };

  return Import;
});