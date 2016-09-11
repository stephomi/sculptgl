var packager = require('electron-packager');

packager({
  dir: '.',
  out: '.',
  name: 'SculptGL',
  all: true,
  // arch: 'x64',
  // platform: 'win32',
  asar: false,
  overwrite: true,
  ignore:[/\b(buildStandalone)/]
}, function () {});
