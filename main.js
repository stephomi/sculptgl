require.config({
  paths: {
    'text': '../tools/text'
  },
  baseUrl: 'src'
});

require([
  'Sculptgl'
], function (SculptGL) {

  'use strict';

  var sculptgl = new SculptGL();
  sculptgl.start();
});