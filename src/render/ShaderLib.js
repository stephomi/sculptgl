define(function (require, exports, module) {

  'use strict';

  var Sbackground = require('render/shaders/ShaderBackground');
  var Scontour = require('render/shaders/ShaderContour');
  var Sselection = require('render/shaders/ShaderSelection');
  var Sflat = require('render/shaders/ShaderFlat');
  var Sfxaa = require('render/shaders/ShaderFxaa');
  var Smatcap = require('render/shaders/ShaderMatcap');
  var Smerge = require('render/shaders/ShaderMerge');
  var Snormal = require('render/shaders/ShaderNormal');
  var SPBR = require('render/shaders/ShaderPBR');
  var Suv = require('render/shaders/ShaderUV');
  var Swireframe = require('render/shaders/ShaderWireframe');

  var ShaderLib = {};

  // 3D shaders
  ShaderLib.PBR = SPBR;
  ShaderLib.MATCAP = Smatcap;
  ShaderLib.NORMAL = Snormal;
  ShaderLib.UV = Suv;
  ShaderLib.WIREFRAME = Swireframe;
  ShaderLib.FLAT = Sflat;
  ShaderLib.SELECTION = Sselection;

  // 2D screen shaders
  ShaderLib.BACKGROUND = Sbackground;
  ShaderLib.MERGE = Smerge;
  ShaderLib.FXAA = Sfxaa;
  ShaderLib.CONTOUR = Scontour;

  module.exports = ShaderLib;
});