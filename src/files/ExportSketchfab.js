import TR from '../gui/GuiTR';
import zip from '../lib/zip';
import ExportPLY from '../files/ExportPLY';

var Export = {};

Export.exportSketchfab = function (main, key, statusWidget) {
  var xhr = new XMLHttpRequest();
  var domStatus = statusWidget.domContainer;
  statusWidget.setVisibility(true);
  statusWidget.sketchfab = true;
  domStatus.innerHTML = 'Uploading...';
  xhr.open('POST', 'https://api.sketchfab.com/v2/models', true);

  xhr.onprogress = function (event) {
    var val = '~';
    if (event.lengthComputable && event.total)
      val = Math.round(event.loaded * 100.0 / event.total);
    domStatus.innerHTML = 'Uploading : ' + val + '%';
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
  fd.append('modelFile', blob, 'sculptglModel.zip');
  fd.append('name', 'My model');
  fd.append('tags', 'sculptgl');

  if (typeof key === 'object' && key.hasOwnProperty('token_type') && key.token_type === 'Bearer') {
      xhr.setRequestHeader('Authorization', 'Bearer ' + key.access_token);
  } else {
      fd.append('token', key);
  }

  xhr.send(fd);
};

export default Export;
