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

    fd.append('modelFile', Export.exportOBJ(meshes, true), 'sculptglModel.obj');
    fd.append('name', 'My SculptGL model');
    fd.append('tags', 'sculptgl');
    fd.append('token', key);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.sketchfab.com/v2/models', true);

    xhr.onload = function () {
      var res = JSON.parse(xhr.responseText);
      var uid = res.uid;
      if (!uid) {
        window.alert(TR('sketchfabUploadError', res.detail));
        return;
      }
      window.prompt(TR('Processing...'), uid);
      var check = function () {
        var xhrPoll = new XMLHttpRequest();
        xhrPoll.open('GET', 'https://api.sketchfab.com/v2/models/' + uid + '/status', true);
        xhrPoll.onload = function () {
          var resPoll = JSON.parse(xhrPoll.responseText);
          if (resPoll.error)
            window.alert(TR('sketchfabUploadError', resPoll.error));
          else if (resPoll.processing === 'FAILURE')
            window.alert(TR('sketchfabUploadError', resPoll.processing));
          else if (resPoll.processing === 'SUCCEEDED')
            window.prompt(TR('sketchfabUploadSuccess'), 'https://sketchfab.com/models/' + uid);
          else
            window.setTimeout(check, 5000);
        };
        xhrPoll.send();
      };
      check();
    };
    xhr.send(fd);
  };

  return Export;
});