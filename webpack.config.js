var path = require('path');

module.exports = function (env) {
  var config = {
    entry: './main.js',
    output: {
      library: 'sculptgl',
      libraryTarget: 'umd',
      filename: './app/sculptgl.js'
    },
    resolve: {
      modules: [
        path.join(__dirname, 'src'),
        path.join(__dirname, 'lib'),
        path.join(__dirname, 'node_modules')
      ]
    },
    module: {
      rules: [{
        test: /\.glsl$/,
        loader: 'raw-loader'
      }]
    }
  };

  var isRelease = env && env.release;

  if (!isRelease) {
    config.devtool = 'eval';
  }

  if (isRelease) {
    config.module.rules.push({
      test: /\.js$/,
      exclude: [/node_modules/],
      use: [{
        loader: 'babel-loader',
        options: {
          plugins: [
            ['transform-es2015-classes', { loose: true }],
            'transform-es2015-block-scoping',
            'transform-es2015-parameters',
            'transform-es2015-shorthand-properties'
          ]
        }
      }],
    });
  }

  return config;
};
