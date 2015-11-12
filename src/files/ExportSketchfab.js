define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var zip = require('lib/zip');
  var ExportPLY = require('files/ExportPLY');

  var Export = {};

  Export.exportSketchfab = function (main, key, statusWidget) {
    var xhr = new XMLHttpRequest();
    var domStatus = statusWidget.domContainer;
    statusWidget.setVisibility(true);
    statusWidget.sketchfab = true;
    domStatus.innerHTML = 'Uploading...';
    xhr.open('POST', 'https://api.sketchfab.com/v2/models', true);

    xhr.onprogress = function (event) {
      if (event.lengthComputable)
        domStatus.innerHTML = 'Uploading : ' + Math.round(event.loaded * 100.0 / event.total) + '%';
    };
    var hideStatus = function () {
      statusWidget.setVisibility(false);
      statusWidget.sketchfab = false;
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
      window.prompt(TR('sketchfabUploadProcessing'), 'https://sketchfab.com/models/' + uid);
      var check = function () {
        var xhrPoll = new XMLHttpRequest();
        xhrPoll.open('GET', 'https://api.sketchfab.com/v2/models/' + uid + '/status?token=' + key, true);
        xhrPoll.onload = function () {
          var resPoll = JSON.parse(xhrPoll.responseText);
          if (resPoll.processing === 'FAILED')
            window.alert(TR('sketchfabUploadError', resPoll.warning.generic.join('\n')));
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
      var data = ExportPLY.exportBinaryPLY(main.getMeshes(), true);
      zipWriter.add('yourMesh.ply', new zip.BlobReader(data), function () {
        zipWriter.close(Export.exportFileSketchfab.bind(this, main, key, xhr));
      });
    }, onerror);

    return xhr;
  };

  Export.exportFileSketchfab = function (main, key, xhr, blob) {
    var fd = new FormData();
    fd.append('token', key);
    fd.append('modelFile', blob, 'sculptglModel.zip');
    fd.append('name', 'My model');
    fd.append('tags', 'sculptgl');
    xhr.send(fd);
  };

  module.exports = Export;
});