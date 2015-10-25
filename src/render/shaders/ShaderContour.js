define(function (require, exports, module) {

  'use strict';

  var getOptionsURL = require('misc/getOptionsURL');
  var ShaderBase = require('render/shaders/ShaderBase');
  var Attribute = require('render/Attribute');

  var ShaderContour = ShaderBase.getCopy();
  ShaderContour.vertexName = ShaderContour.fragmentName = 'SobelContour';

  ShaderContour.color = getOptionsURL().outlinecolor;
  ShaderContour.uniforms = {};
  ShaderContour.attributes = {};

  ShaderContour.uniformNames = ['uTexture0', 'uColor'];

  ShaderContour.vertex = [
    'attribute vec2 aVertex;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  vTexCoord = aVertex * 0.5 + 0.5;',
    '  gl_Position = vec4(aVertex, 0.0, 1.0);',
    '}'
  ].join('\n');

  ShaderContour.fragment = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    'uniform vec4 uColor;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  float fac0 = 2.0;',
    '  float fac1 = 1.0;',
    '  float ox = dFdx(vTexCoord).x;',
    '  float oy = dFdy(vTexCoord).y;',
    '  vec4 texel0 = texture2D(uTexture0, vTexCoord + vec2(ox, oy));',
    '  vec4 texel1 = texture2D(uTexture0, vTexCoord + vec2(ox, 0.0));',
    '  vec4 texel2 = texture2D(uTexture0, vTexCoord + vec2(ox, -oy));',
    '  vec4 texel3 = texture2D(uTexture0, vTexCoord + vec2(0.0, -oy));',
    '  vec4 texel4 = texture2D(uTexture0, vTexCoord + vec2(-ox, -oy));',
    '  vec4 texel5 = texture2D(uTexture0, vTexCoord + vec2(-ox, 0.0));',
    '  vec4 texel6 = texture2D(uTexture0, vTexCoord + vec2(-ox, oy));',
    '  vec4 texel7 = texture2D(uTexture0, vTexCoord + vec2(0.0, oy));',
    '  vec4 rowx = -fac0*texel5 + fac0*texel1 + -fac1*texel6 + fac1*texel0 + -fac1*texel4 + fac1*texel2;',
    '  vec4 rowy = -fac0*texel3 + fac0*texel7 + -fac1*texel4 + fac1*texel6 + -fac1*texel2 + fac1*texel0;',
    '  float mag = dot(rowy, rowy) + dot(rowx, rowx);',
    '  if (mag < 1.5) discard;',
    '  gl_FragColor = vec4(uColor.rgb * uColor.a, uColor.a);',
    '}'
  ].join('\n');

  ShaderContour.draw = function (rtt) {
    var gl = rtt.getGL();
    gl.useProgram(this.program);

    ShaderContour.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtt.getTexture());
    gl.uniform1i(this.uniforms.uTexture0, 0);
    gl.uniform4fv(this.uniforms.uColor, ShaderContour.color);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  ShaderContour.initAttributes = function (gl) {
    ShaderContour.attributes.aVertex = new Attribute(gl, ShaderContour.program, 'aVertex', 2, gl.FLOAT);
  };

  module.exports = ShaderContour;
});