define([
  'files/ImportOBJ',
  'files/ImportSGL',
  'files/ImportPLY',
  'files/ImportSTL'
], function (ImportOBJ, ImportSGL, ImportPLY, ImportSTL) {

  'use strict';

  var Import = {
    importOBJ: ImportOBJ.importOBJ,
    importSGL: ImportSGL.importSGL,
    importPLY: ImportPLY.importPLY,
    importSTL: ImportSTL.importSTL
  };

  return Import;
});