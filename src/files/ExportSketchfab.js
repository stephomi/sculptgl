import TR from 'gui/GuiTR';
import { zip } from 'zip';
import ExportPLY from 'files/ExportPLY';

import SketchfabOAuth2 from 'sketchfab-oauth2-1.2.0';

var Export = {};

var doExportSketchfab = function (xhr, main, key, statusWidget) {
  xhr.open('POST', 'https://api.sketchfab.com/v2/models', true);

  xhr.onprogress = function (event) {
    if (event.lengthComputable && event.total) {
      var val = Math.round(event.loaded * 100.0 / event.total);
      statusWidget.setVisibility('Sketchfab upload: ' + val + '%');
    }
  };
  var hideStatus = function () {
    statusWidget.setMessage('');
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
      var url = 'https://api.sketchfab.com/v2/models/' + uid + '/status';

      if (typeof key === 'object' && key.hasOwnProperty('token_type') && key.token_type === 'Bearer') {
        xhrPoll.open('GET', url, true);
        xhrPoll.setRequestHeader('Authorization', 'Bearer ' + key.access_token);
      } else {
        xhrPoll.open('GET', url + '?token=' + key, true);
      }

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

  statusWidget.setMessage('Creating zip...');
  zip.useWebWorkers = true;
  zip.workerScriptsPath = 'worker/';
  zip.createWriter(new zip.BlobWriter('application/zip'), function (zipWriter) {
    var data = ExportPLY.exportBinaryPLY(main.getMeshes(), { swapXY: true });
    zipWriter.add('yourMesh.ply', new zip.BlobReader(data), function () {
      zipWriter.close(Export.exportFileSketchfab.bind(this, key, xhr, statusWidget));
    });
  }, onerror);

  return xhr;
};

Export.exportSketchfab = function (main, statusWidget) {
  if (!window.sketchfabOAuth2Config)
    return;

  var xhr = new XMLHttpRequest();

  var client = new SketchfabOAuth2(window.sketchfabOAuth2Config);
  client.connect().then(function onSuccess(key) {
    doExportSketchfab(xhr, main, key, statusWidget);
  }).catch(function onError(error) {
    console.error(error);
  });

  return xhr;
};

Export.exportFileSketchfab = function (key, xhr, statusWidget, blob) {
  if (xhr.isAborted) return;

  var fd = new FormData();
  fd.append('modelFile', blob, 'sculptglModel.zip');
  fd.append('name', 'My model');
  fd.append('tags', 'sculptgl');

  if (typeof key === 'object' && key.hasOwnProperty('token_type') && key.token_type === 'Bearer') {
    xhr.setRequestHeader('Authorization', 'Bearer ' + key.access_token);
  } else {
    fd.append('token', key);
  }

  statusWidget.setMessage('Sketchfab upload...');
  xhr.send(fd);
};

export default Export;
