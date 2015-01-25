module.exports = function (grunt) {
  'use strict';

  var clean = {
    main: ['build']
  };

  var jshint = {
    files: ['Gruntfile.js', 'src/**/*.js']
  };

  var requirejs = {
    compile: {
      options: {
        preserveLicenseComments: false,
        optimize: 'uglify2',
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
        src: ['css/*', 'lib/*', 'resources/**'],
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
        '**/*.vert',
        '**/*.frag',
        '**/*.obj',
        '**/*.ply',
        '**/*.stl'
      ],
      dest: 'build/manifest.appcache'
    }
  };

  var nodewebkit = {
    options: {
      platforms: ['win', 'osx', 'linux32', 'linux64'],
      buildDir: './nodewebkit', // Where the build version of my node-webkit app is saved
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
    nodewebkit: nodewebkit
  });

  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-node-webkit-builder');

  grunt.registerTask('test', 'jshint');
  grunt.registerTask('build', ['clean', 'jshint', 'copy:main', 'requirejs' /*, 'manifest'*/ ]);
  grunt.registerTask('standalone', ['build', 'copy:standalone', 'nodewebkit']);

  grunt.registerTask('default', 'build');
};