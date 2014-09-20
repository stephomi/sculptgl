define([
  'gui/GuiTR',
  'misc/ExportOBJ',
  'misc/ExportPLY',
  'misc/ExportSTL'
], function (TR, ExportOBJ, ExportPLY, ExportSTL) {

  'use strict';

  var Export = {};
  Export.exportOBJ = ExportOBJ.exportOBJ;
  Export.exportPLY = ExportPLY.exportPLY;
  Export.exportSTL = ExportSTL.exportSTL;
  Export.exportSketchfab = function (meshes, key) {
    var fd = new FormData();

    fd.append('token', key);
    fd.append('fileModel', Export.exportOBJ(meshes, true));
    fd.append('filenameModel', 'model.obj');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.sketchfab.com/v1/models', true);

    var result = function () {
      var res = JSON.parse(xhr.responseText);
      console.log(res);
      if (!res.success)
        window.alert(TR('sketchfabUploadError', res.error));
      else
        window.prompt(TR('sketchfabUploadSuccess'), 'https://sketchfab.com/models/' + res.result.id);
    };
    xhr.addEventListener('load', result, true);
    xhr.send(fd);
  };

  return Export;
});