import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

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
  plugins.push(babel({
    include: 'src/**',
    presets: [
      ['es2015', { 'modules': false }]
    ],
    plugins: ['external-helpers']
  }));
}

export default {
  entry: 'main.js',
  dest: 'app/sculptgl.js',
  moduleName: 'SculptGL',
  context: 'self',
  format: 'umd',
  plugins: plugins
};
