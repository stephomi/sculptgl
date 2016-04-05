define(function (require, exports, module) {

  'use strict';

  var Enums = require('misc/Enums');

  var ShaderLib = [];

  // 3D shaders
  ShaderLib[Enums.Shader.PBR] = require('render/shaders/ShaderPBR');
  ShaderLib[Enums.Shader.MATCAP] = require('render/shaders/ShaderMatcap');
  ShaderLib[Enums.Shader.NORMAL] = require('render/shaders/ShaderNormal');
  ShaderLib[Enums.Shader.UV] = require('render/shaders/ShaderUV');
  ShaderLib[Enums.Shader.WIREFRAME] = require('render/shaders/ShaderWireframe');
  ShaderLib[Enums.Shader.FLAT] = require('render/shaders/ShaderFlat');
  ShaderLib[Enums.Shader.SELECTION] = require('render/shaders/ShaderSelection');

  // 2D screen shaders
  ShaderLib[Enums.Shader.BACKGROUND] = require('render/shaders/ShaderBackground');
  ShaderLib[Enums.Shader.MERGE] = require('render/shaders/ShaderMerge');
  ShaderLib[Enums.Shader.FXAA] = require('render/shaders/ShaderFxaa');
  ShaderLib[Enums.Shader.CONTOUR] = require('render/shaders/ShaderContour');

  module.exports = ShaderLib;
});
