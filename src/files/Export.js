define([
  'files/ExportOBJ',
  'files/ExportSGL',
  'files/ExportPLY',
  'files/ExportSTL',
  'files/ExportSketchfab'
], function (ExportOBJ, ExportSGL, ExportPLY, ExportSTL, ExportSketchfab) {

  'use strict';

  var Export = {};
  Export.exportOBJ = ExportOBJ.exportOBJ;
  Export.exportSGL = ExportSGL.exportSGL;
  Export.exportAsciiPLY = ExportPLY.exportAsciiPLY;
  Export.exportBinaryPLY = ExportPLY.exportBinaryPLY;
  Export.exportAsciiSTL = ExportSTL.exportAsciiSTL;
  Export.exportBinarySTL = ExportSTL.exportBinarySTL;
  Export.exportSketchfab = ExportSketchfab.exportSketchfab;

  return Export;
});