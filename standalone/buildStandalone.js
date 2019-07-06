var packager = require('electron-packager');

// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#ignore
packager({
  dir: '.',
  out: '.',
  name: 'SculptGL',
  prune: true, // ignore devDependencies
  all: false, // not all platform
  arch: ['ia32', 'x64'],
  platform: 'win32',
  asar: false, // no electron archive
  overwrite: true, // overwrite output
  ignore: [/\b(buildStandalone)/]
}, function () {});
