/* globals module */
module.exports = function (grunt) {
  'use strict';

  var config = {};

  config.pkg = grunt.file.readJSON('package.json');

  config.clean = {
    main: ['build']
  };

  config.jshint = {
    options: {
      jshintrc: true,
    },
    files: ['Gruntfile.js', 'src/**/*.js']
  };

  config.uglify = {
    my_target: {
      files: [{
        'build/sculptgl.min.js': ['lib/*.js', 'build/sculptgl.min.js']
      }, {
        expand: true,
        cwd: 'worker/',
        src: '*.js',
        dest: 'build/worker/'
      }]
    }
  };

  config.requirejs = {
    compile: {
      options: {
        preserveLicenseComments: false,
        paths: {
          text: '../tools/text'
        },
        optimize: 'none',
        baseUrl: 'src',
        name: '../tools/almond',
        include: 'Sculptgl.js',
        out: 'build/sculptgl.min.js'
      }
    }
  };

  config.copy = {
    standalone: {
      files: [{
        expand: true,
        flatten: true,
        src: ['package.json', 'tools/winstate.js'],
        dest: 'build/'
      }]
    },
    main: {
      files: [{
        expand: true,
        src: ['css/*', 'resources/**'],
        dest: 'build/',
        filter: 'isFile'
      }]
    }
  };

  config.manifest = {
    generate: {
      options: {
        basePath: '.',
        preferOnline: true,
        verbose: true,
        timestamp: true,
        hash: true,
        process: function (path) {
          return path.substring('build/'.length);
        }
      },
      src: [
        'build/**/*.html',
        'build/**/*.js',
        'build/**/*.jpg',
        'build/**/*.png',
        'build/**/*.css',
        'build/**/*.obj',
        'build/**/*.ply',
        'build/**/*.bin',
        'build/**/*.stl'
      ],
      dest: 'build/manifest.appcache'
    }
  };

  var platforms = ['win32', 'win64', 'linux32', 'linux64', 'osx64'];

  config.nwjs = {
    options: {
      platforms: platforms,
      buildDir: './nodewebkit', // Where the build version of my node-webkit app is saved
      zip: true
    },
    src: ['build/**/*'] // Your node-webkit app
  };

  config.compress = {};
  for (var i = 0; i < platforms.length; ++i) {
    var platform = platforms[i];
    config.compress[platform] = {
      options: {
        archive: 'nodewebkit/' + platform + '.zip'
      },
      files: [{
        expand: true,
        cwd: 'nodewebkit/SculptGL/' + platform + '/',
        src: ['**'],
        dest: '../SculptGL'
      }]
    };
  }

  config.preprocess = {
    manifest: {
      options: {
        context: {
          MANIFEST: true
        }
      },
      src: 'tools/index.html',
      dest: 'build/index.html'
    },
    default: {
      src: 'tools/index.html',
      dest: 'build/index.html'
    }
  };

  config.jsbeautifier = {
    src: ['Gruntfile.js', 'src/**/*.js'],
    options: {
      config: './.jsbeautifyrc'
    }
  };

  // Project configuration.
  grunt.initConfig(config);

  require('load-grunt-tasks')(grunt);

  // test
  grunt.registerTask('test', 'jshint');

  // beautify
  grunt.registerTask('beautify', ['jsbeautifier']);

  // builds
  grunt.registerTask('buildall', ['clean', 'jshint', 'copy:main', 'requirejs', 'uglify']);
  grunt.registerTask('build:nomanifest', ['buildall', 'preprocess']);
  grunt.registerTask('build:manifest', ['buildall', 'manifest', 'preprocess:manifest']);

  // standalone
  grunt.registerTask('standalone', ['build:nomanifest', 'copy:standalone', 'nwjs', 'compress']);

  grunt.registerTask('default', 'build:manifest');
};

