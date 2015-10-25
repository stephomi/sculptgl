/* globals module */
module.exports = function (grunt) {
  'use strict';

  var clean = {
    main: ['build']
  };

  var jshint = {
    options: {
      jshintrc: true,
    },
    files: ['Gruntfile.js', 'src/**/*.js']
  };

  var uglify = {
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

  var requirejs = {
    compile: {
      options: {
        preserveLicenseComments: false,
        paths: {
          text: '../tools/text'
        },
        optimize: 'none',
        baseUrl: 'src',
        name: '../tools/almond',
        include: 'Sculptgl',
        out: 'build/sculptgl.min.js'
      }
    }
  };

  var copy = {
    standalone: {
      files: [{
        expand: true,
        flatten: true,
        src: ['package.json'],
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

  var manifest = {
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

  var nwjs = {
    options: {
      platforms: ['win', 'osx', 'linux32', 'linux64'],
      buildDir: './nodewebkit' // Where the build version of my node-webkit app is saved
    },
    src: ['build/**/*'] // Your node-webkit app
  };

  var preprocess = {
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

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: clean,
    jshint: jshint,
    copy: copy,
    requirejs: requirejs,
    manifest: manifest,
    nwjs: nwjs,
    uglify: uglify,
    preprocess: preprocess
  });

  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nw-builder');
  grunt.loadNpmTasks('grunt-preprocess');

  // test
  grunt.registerTask('test', 'jshint');

  // builds
  grunt.registerTask('buildall', ['clean', 'jshint', 'copy:main', 'requirejs', 'uglify']);
  grunt.registerTask('build:nomanifest', ['buildall', 'preprocess']);
  grunt.registerTask('build:manifest', ['buildall', 'manifest', 'preprocess:manifest']);

  // standalone
  grunt.registerTask('standalone', ['build:nomanifest', 'copy:standalone', 'nwjs']);

  grunt.registerTask('default', 'build:manifest');
};