'use strict';

import uglify from 'rollup-plugin-uglify';

function glsl() {
  return {
    transform(code, id) {
      if (!id.endsWith('.glsl')) return;
      return {
        code: 'export default ' + JSON.stringify(code) + ';',
        map: { mappings: '' }
      };
    }
  };
}

var plugins = [glsl()];
if (process.env.release) {
  plugins.push(uglify());
}

export default {
  entry: 'main.js',
  dest: 'app/sculptgl.js',
  moduleName: 'SculptGL',
  context: 'self',
  format: 'umd',
  plugins: plugins
};
