define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderBackground = {};
  ShaderBackground.uniforms = {};
  ShaderBackground.attributes = {};
  ShaderBackground.program = undefined;

  ShaderBackground.uniformNames = ['uTexture0'];

  ShaderBackground.vertex = [
    'attribute vec2 aVertex;',
    'attribute vec2 aTexCoord;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  vTexCoord = aTexCoord;',
    '  gl_Position = vec4(aVertex, 0.5, 1.0);',
    '}'
  ].join('\n');

  ShaderBackground.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  gl_FragColor =  texture2D(uTexture0, vTexCoord);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderBackground.draw = function (bg) {
    var gl = bg.gl_;
    gl.useProgram(this.program);
    this.bindAttributes(bg);
    this.updateUniforms(bg);
    gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
  };
  /** Get or create the shader */
  ShaderBackground.getOrCreate = function (gl) {
    return ShaderBackground.program ? ShaderBackground : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderBackground.initAttributes = function (gl) {
    var program = ShaderBackground.program;
    var attrs = ShaderBackground.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 2, glfloat);
    attrs.aTexCoord = new Attribute(gl, program, 'aTexCoord', 2, glfloat);
  };
  /** Bind attributes */
  ShaderBackground.bindAttributes = function (bg) {
    var attrs = ShaderBackground.attributes;
    attrs.aVertex.bindToBuffer(bg.vertexBuffer_);
    attrs.aTexCoord.bindToBuffer(bg.texCoordBuffer_);
  };
  /** Updates uniforms */
  ShaderBackground.updateUniforms = function (bg) {
    var gl = bg.gl_;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bg.backgroundLoc_);
    gl.uniform1i(this.uniforms.uTexture0, 0);
  };

  return ShaderBackground;
});