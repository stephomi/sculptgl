define([
  'render/shaders/ShaderBackground',
  'render/shaders/ShaderSelection',
  'render/shaders/ShaderGrid',
  'render/shaders/ShaderMatcap',
  'render/shaders/ShaderNormal',
  'render/shaders/ShaderPBR',
  'render/shaders/ShaderRtt',
  'render/shaders/ShaderTransparency',
  'render/shaders/ShaderUV',
  'render/shaders/ShaderWireframe'
], function (Sbackground, Sselection, Sgrid, Smatcap, Snormal, SPBR, Srtt, Stransparency, Suv, Swireframe) {

  'use strict';

  function Shader(gl) {
    this.gl_ = gl; // webgl context
    this.type_ = Shader.mode.PBR; // type of shader
    this.shaderObject_ = null; // the shader
  }

  Shader.mode = {
    PBR: 0,
    TRANSPARENCY: 1,
    WIREFRAME: 2,
    NORMAL: 3,
    BACKGROUND: 4,
    UV: 5,
    MATCAP: 6,
    GRID: 7,
    SELECTION: 8,
    RTT: 9
  };

  Shader[Shader.mode.RTT] = Srtt;
  Shader[Shader.mode.SELECTION] = Sselection;
  Shader[Shader.mode.BACKGROUND] = Sbackground;
  Shader[Shader.mode.GRID] = Sgrid;
  Shader[Shader.mode.PBR] = SPBR;
  Shader[Shader.mode.MATCAP] = Smatcap;
  Shader[Shader.mode.NORMAL] = Snormal;
  Shader[Shader.mode.TRANSPARENCY] = Stransparency;
  Shader[Shader.mode.UV] = Suv;
  Shader[Shader.mode.WIREFRAME] = Swireframe;

  Shader.prototype = {
    /** Return the type of shader */
    getType: function () {
      return this.type_;
    },
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this.type_ === Shader.mode.UV;
    },
    /** Return true if the shader is using alpha transparency stuffs */
    isTransparent: function () {
      return this.type_ === Shader.mode.TRANSPARENCY;
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