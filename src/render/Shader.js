define(function (require, exports, module) {

  'use strict';

  var getOptionsURL = require('misc/getOptionsURL');
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

  var Shader = function (gl) {
    this._gl = gl;
    this._type = getOptionsURL().shader || 'PBR';
    this._shaderObject = null;
  };

  Shader.PBR = SPBR;
  Shader.MATCAP = Smatcap;
  Shader.NORMAL = Snormal;
  Shader.FLAT = Sflat;
  Shader.WIREFRAME = Swireframe;

  Shader.SELECTION = Sselection;
  Shader.BACKGROUND = Sbackground;
  Shader.UV = Suv;
  Shader.MERGE = Smerge;
  Shader.FXAA = Sfxaa;
  Shader.CONTOUR = Scontour;

  Shader.prototype = {
    getType: function () {
      return this._type;
    },
    isUsingTexCoords: function () {
      return this._type === 'UV';
    },
    init: function () {
      this._shaderObject = Shader[this._type].getOrCreate(this._gl);
    },
    setType: function (type) {
      this._type = type;
      this.init();
    },
    draw: function (render, main) {
      this._shaderObject.draw(render, main);
    }
  };

  module.exports = Shader;
});