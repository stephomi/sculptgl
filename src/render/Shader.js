define([
  'misc/getUrlOptions',
  'render/shaders/ShaderBackground',
  'render/shaders/ShaderContour',
  'render/shaders/ShaderSelection',
  'render/shaders/ShaderGrid',
  'render/shaders/ShaderFlat',
  'render/shaders/ShaderMatcap',
  'render/shaders/ShaderNormal',
  'render/shaders/ShaderPBR',
  'render/shaders/ShaderRtt',
  'render/shaders/ShaderUV',
  'render/shaders/ShaderWireframe'
], function (getUrlOptions, Sbackground, Scontour, Sselection, Sgrid, Sflat, Smatcap, Snormal, SPBR, Srtt, Suv, Swireframe) {

  'use strict';

  var Shader = function (gl) {
    this.gl_ = gl;
    this.type_ = Shader.mode[getUrlOptions().shader] || Shader.mode.PBR;
    this.shaderObject_ = null;
  };

  Shader.mode = {
    PBR: 0,
    WIREFRAME: 1,
    NORMAL: 2,
    BACKGROUND: 3,
    UV: 4,
    MATCAP: 5,
    GRID: 6,
    SELECTION: 7,
    RTT: 8,
    CONTOUR: 9,
    FLAT: 10
  };

  Shader[Shader.mode.RTT] = Srtt;
  Shader[Shader.mode.SELECTION] = Sselection;
  Shader[Shader.mode.BACKGROUND] = Sbackground;
  Shader[Shader.mode.GRID] = Sgrid;
  Shader[Shader.mode.PBR] = SPBR;
  Shader[Shader.mode.MATCAP] = Smatcap;
  Shader[Shader.mode.NORMAL] = Snormal;
  Shader[Shader.mode.UV] = Suv;
  Shader[Shader.mode.WIREFRAME] = Swireframe;
  Shader[Shader.mode.CONTOUR] = Scontour;
  Shader[Shader.mode.FLAT] = Sflat;

  Shader.prototype = {
    /** Return the type of shader */
    getType: function () {
      return this.type_;
    },
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this.type_ === Shader.mode.UV;
    },
    /** Initialize the shader */
    init: function () {
      this.shaderObject_ = Shader[this.type_].getOrCreate(this.gl_);
    },
    /** Set the shader */
    setType: function (type) {
      this.type_ = type;
      this.init();
    },
    /** Draw */
    draw: function (render, main) {
      this.shaderObject_.draw(render, main);
    }
  };

  return Shader;
});