define([
  'misc/getUrlOptions',
  'render/shaders/ShaderBackground',
  'render/shaders/ShaderContour',
  'render/shaders/ShaderSelection',
  'render/shaders/ShaderFlat',
  'render/shaders/ShaderMatcap',
  'render/shaders/ShaderNormal',
  'render/shaders/ShaderPBR',
  'render/shaders/ShaderRtt',
  'render/shaders/ShaderUV',
  'render/shaders/ShaderWireframe'
], function (getUrlOptions, Sbackground, Scontour, Sselection, Sflat, Smatcap, Snormal, SPBR, Srtt, Suv, Swireframe) {

  'use strict';

  var Shader = function (gl) {
    this._gl = gl;
    this._type = getUrlOptions().shader || 'PBR';
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
  Shader.RTT = Srtt;
  Shader.CONTOUR = Scontour;

  Shader.prototype = {
    /** Return the type of shader */
    getType: function () {
      return this._type;
    },
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this._type === 'UV';
    },
    /** Initialize the shader */
    init: function () {
      this._shaderObject = Shader[this._type].getOrCreate(this._gl);
    },
    /** Set the shader */
    setType: function (type) {
      this._type = type;
      this.init();
    },
    /** Draw */
    draw: function (render, main) {
      this._shaderObject.draw(render, main);
    }
  };

  return Shader;
});