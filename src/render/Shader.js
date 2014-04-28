define([
  'render/shaders/ShaderMatcap',
  'render/shaders/ShaderPhong',
  'render/shaders/ShaderNormal',
  'render/shaders/ShaderTransparency',
  'render/shaders/ShaderWireframe',
  'render/shaders/ShaderBackground'
], function (SMatcap, SPhong, SNormal, STransparency, SWireframe, SBackground) {

  'use strict';

  function Shader(gl) {
    this.gl_ = gl; //webgl context
    this.type_ = Shader.mode.MATCAP; //type of shader
    this.shader_ = null; //the shader
  }

  Shader.textures = {};
  Shader.mode = {
    PHONG: 0,
    TRANSPARENCY: 1,
    WIREFRAME: 2,
    NORMAL: 3,
    BACKGROUND: 4,
    MATCAP: 5
  };

  Shader[Shader.mode.PHONG] = SPhong;
  Shader[Shader.mode.WIREFRAME] = SWireframe;
  Shader[Shader.mode.TRANSPARENCY] = STransparency;
  Shader[Shader.mode.NORMAL] = SNormal;
  Shader[Shader.mode.MATCAP] = SMatcap;
  Shader[Shader.mode.BACKGROUND] = SBackground;

  Shader.prototype = {
    /** Initialize the shader */
    init: function () {
      var shader = Shader[Math.min(this.type_, Shader.mode.MATCAP)];
      this.shader_ = shader.getOrCreate(this.gl_);
    },
    /** Draw */
    draw: function (render, sculptgl) {
      this.shader_.draw(render, sculptgl);
    }
  };

  return Shader;
});