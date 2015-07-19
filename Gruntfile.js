module.exports = function (grunt) {
  'use strict';

  var clean = {
    main: ['build']
  };

  var jshint = {
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
      }, {
        expand: true,
        flatten: true,
        src: ['tools/index.html'],
        dest: 'build/'
      }]
    }
  };

  var manifest = {
    generate: {
      options: {
        basePath: 'build/',
        preferOnline: true,
        verbose: true,
        timestamp: true,
        hash: true
      },
      src: [
        '**/*.html',
        '**/*.js',
        '**/*.jpg',
        '**/*.css',
        '**/*.obj',
        '**/*.ply',
        '**/*.bin',
        '**/*.stl'
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

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: clean,
    jshint: jshint,
    copy: copy,
    requirejs: requirejs,
    manifest: manifest,
    nwjs: nwjs,
    uglify: uglify
  });

  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nw-builder');

  grunt.registerTask('test', 'jshint');
  grunt.registerTask('build', ['clean', 'jshint', 'copy:main', 'requirejs', 'uglify']);
  grunt.registerTask('build:manifest', ['build', 'manifest']);
  grunt.registerTask('standalone', ['build', 'copy:standalone', 'nwjs']);

  grunt.registerTask('default', 'build');
};