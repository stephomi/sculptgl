var path = require('path');

module.exports = function (env) {
  var config = {
    entry: './main.js',
    output: {
      library: 'sculptgl',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'app'),
      filename: 'sculptgl.js'
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

  config.mode = isRelease ? 'production' : 'development';

  if (isRelease) {
    config.module.rules.push({
      test: /\.js$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }],
    });
  }

  return config;
};
