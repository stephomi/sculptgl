module.exports = function (grunt) {
  'use strict';

  var clean = ['build'];

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
        out: 'build/multiresgl.min.js'
      }
    }
  };

  var copy = {
    main: {
      files: [{
        expand: true,
        src: ['css/*', 'lib/*', 'ressources/*'],
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

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: clean,
    jshint: jshint,
    copy: copy,
    requirejs: requirejs,
    manifest: manifest
  });

  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('test', 'jshint');
  grunt.registerTask('build', ['clean', 'jshint', 'copy', 'requirejs', 'manifest']);

  grunt.registerTask('default', 'build');
};