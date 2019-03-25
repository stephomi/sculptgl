import { zip } from 'zip';
import ExportPLY from 'files/ExportPLY';

var Export = {};

Export.exportSculpteo = function (main, statusWidget) {
  var xhr = new XMLHttpRequest();
  // xhr.open('POST', 'https://www.sculpteo.com/en/upload_design/a/3D/', true);
  xhr.open('POST', 'uploadSculpteo.php', true);

  xhr.onprogress = function (event) {
    if (event.lengthComputable && event.total) {
      var val = Math.round(event.loaded * 100.0 / event.total);
      statusWidget.setMessage('Sculpteo upload: ' + val + '%');
    }
  };

  var hideStatus = function () {
    statusWidget.setMessage('');
  };
  xhr.onerror = hideStatus;
  xhr.onabort = hideStatus;

  xhr.onload = function () {
    hideStatus();

    if (this.status === 200) {
      var match = xhr.responseText.match(/\/print\/(.+?)(?=")/);
      if (match) {
        window.open('https://www.sculpteo.com/en' + match[0], '_blank');
      }

      //   var json = JSON.parse(xhr.responseText);
      //   window.open('https://www.sculpteo.com/en/print/' + json.slug + '/' + json.uuid, '_blank');
    }
  };

  var meshes = main.getMeshes();
  var box = main.computeBoundingBoxMeshes(meshes);
  var radius = main.computeRadiusFromBoundingBox(box);
  var data = ExportPLY.exportBinaryPLY(meshes, { swapXY: true });

  statusWidget.setMessage('Creating zip...');
  zip.useWebWorkers = true;
  zip.workerScriptsPath = 'worker/';
  zip.createWriter(new zip.BlobWriter('application/zip'), function (zipWriter) {
    zipWriter.add('yourMesh.ply', new zip.BlobReader(data), function () {
      zipWriter.close(Export.exportFileSculpteo.bind(this, radius, xhr, statusWidget));
    });
  }, onerror);

  return xhr;
};

Export.exportFileSculpteo = function (radius, xhr, statusWidget, blob) {
  if (xhr.isAborted) return;

  var fd = new FormData();
  fd.append('file', blob);
  fd.append('name', 'fromSculptgl');

  // fd.append('trackid', '....');
  // fd.append('share', '0');
  // fd.append('print_authorization', '0');
  // fd.append('customizable', '0');
  // fd.append('unit', 'cm');
  fd.append('scale', 4.0 / radius);
  // fd.append('rotation', '0,0,0');
  // fd.append('terms', '1');

  // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  statusWidget.setMessage('Sculpteo upload...');
  xhr.send(fd);
};

export default Export;
