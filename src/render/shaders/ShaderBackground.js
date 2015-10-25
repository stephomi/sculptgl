define(function (require, exports, module) {

  'use strict';

  var ShaderBase = require('render/shaders/ShaderBase');
  var Attribute = require('render/Attribute');

  var ShaderBackground = ShaderBase.getCopy();
  ShaderBackground.vertexName = ShaderBackground.fragmentName = 'Background';

  ShaderBackground.uniforms = {};
  ShaderBackground.attributes = {};

  ShaderBackground.uniformNames = ['uTexture0'];

  ShaderBackground.vertex = [
    'attribute vec2 aVertex;',
    'attribute vec2 aTexCoord;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  vTexCoord = aTexCoord;',
    '  gl_Position = vec4(aVertex, 1.0, 1.0);',
    '}'
  ].join('\n');

  ShaderBackground.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    'varying vec2 vTexCoord;',
    ShaderBase.strings.colorSpaceGLSL,
    'void main() {',
    '  gl_FragColor = encodeRGBM(sRGBToLinear(texture2D(uTexture0, vTexCoord)).rgb);',
    '}'
  ].join('\n');

  ShaderBackground.draw = function (bg) {
    var gl = bg.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(bg);
    this.updateUniforms(bg);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  ShaderBackground.initAttributes = function (gl) {
    var program = ShaderBackground.program;
    var attrs = ShaderBackground.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 2, gl.FLOAT);
    attrs.aTexCoord = new Attribute(gl, program, 'aTexCoord', 2, gl.FLOAT);
  };
  ShaderBackground.bindAttributes = function (bg) {
    var attrs = ShaderBackground.attributes;
    attrs.aVertex.bindToBuffer(bg.getVertexBuffer());
    attrs.aTexCoord.bindToBuffer(bg.getTexCoordBuffer());
  };
  ShaderBackground.updateUniforms = function (bg) {
    var gl = bg.getGL();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bg.getTexture());
    gl.uniform1i(this.uniforms.uTexture0, 0);
  };

  module.exports = ShaderBackground;
});