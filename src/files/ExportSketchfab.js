define([
  'gui/GuiTR',
  'lib/zip',
  'files/ExportPLY'
], function (TR, zip, ExportPLY) {

  'use strict';

  var Export = {};

  Export.exportSketchfab = function (main, key, statusWidget) {
    var xhr = new XMLHttpRequest();
    var domStatus = statusWidget.domContainer;
    statusWidget.setVisibility(true);
    domStatus.innerHTML = 'Uploading...';
    xhr.open('POST', 'https://api.sketchfab.com/v2/models', true);

    xhr.onprogress = function (event) {
      if (event.lengthComputable)
        domStatus.innerHTML = 'Uploading : ' + Math.round(event.loaded * 100.0 / event.total) + '%';
    };
    var hideStatus = function () {
      statusWidget.setVisibility(false);
    };
    xhr.onerror = hideStatus;
    xhr.onabort = hideStatus;

    xhr.onload = function () {
      hideStatus();
      var res = JSON.parse(xhr.responseText);
      var uid = res.uid;
      if (!uid) {
        window.alert(TR('sketchfabUploadError', res.detail));
        return;
      }
      window.prompt(TR('Processing...\nYour model will be available at :'), 'https://sketchfab.com/models/' + uid);
      var check = function () {
        var xhrPoll = new XMLHttpRequest();
        xhrPoll.open('GET', 'https://api.sketchfab.com/v2/models/' + uid + '/status?token=' + key, true);
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

    zip.useWebWorkers = true;
    zip.workerScriptsPath = 'worker/';
    zip.createWriter(new zip.BlobWriter('application/zip'), function (zipWriter) {
      zipWriter.add('yourMesh.ply', new zip.BlobReader(ExportPLY.exportBinaryPLY(main.getMeshes(), true)), function () {
        zipWriter.close(Export.exportFileSketchfab.bind(this, main, key, xhr));
      });
    }, onerror);

    return xhr;
  };

  Export.exportFileSketchfab = function (main, key, xhr, blob) {
    var fd = new FormData();
    fd.append('token', key);
    fd.append('modelFile', blob, 'sculptglModel.zip');
    fd.append('name', 'My model - ' + main.getReplayWriter().uid_);
    fd.append('tags', 'sculptgl');
    xhr.send(fd);
  };

  return Export;
});