define(function (require, exports, module) {

  'use strict';

  var ShaderBase = require('render/shaders/ShaderBase');

  var ShaderFlat = ShaderBase.getCopy();
  ShaderFlat.vertexName = ShaderFlat.fragmentName = 'FlatColor';

  ShaderFlat.uniforms = {};
  ShaderFlat.attributes = {};
  ShaderFlat.activeAttributes = {
    vertex: true,
    material: true
  };

  ShaderFlat.uniformNames = ['uColor'];
  Array.prototype.push.apply(ShaderFlat.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderFlat.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aMaterial;',
    ShaderBase.strings.vertUniforms,
    'varying vec3 vVertex;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  gl_Position = uMVP * mix(vertex4, uEM * vertex4, aMaterial.z);',
    '}'
  ].join('\n');

  ShaderFlat.fragment = [
    'precision mediump float;',
    'uniform vec3 uColor;',
    ShaderBase.strings.colorSpaceGLSL,
    'void main() {',
    '  gl_FragColor = encodeRGBM(uColor);',
    '}'
  ].join('\n');

  ShaderFlat.updateUniforms = function (mesh, main) {
    mesh.getGL().uniform3fv(this.uniforms.uColor, mesh.getFlatColor());
    ShaderBase.updateUniforms.call(this, mesh, main);
  };

  module.exports = ShaderFlat;
});
