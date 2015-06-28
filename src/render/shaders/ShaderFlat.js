define([
  'render/shaders/ShaderBase'
], function (ShaderBase) {

  'use strict';

  var ShaderFlat = ShaderBase.getCopy();
  ShaderFlat.vertexName = ShaderFlat.fragmentName = 'FlatColor';

  ShaderFlat.uniforms = {};
  ShaderFlat.attributes = {};
  ShaderFlat.activeAttributes = {
    vertex: true,
    material: true
  };

  ShaderFlat.uniformNames = [];
  Array.prototype.push.apply(ShaderFlat.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderFlat.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aMaterial;',
    ShaderBase.strings.vertUniforms,
    'varying vec3 vVertex;',
    'varying float vMasking;',
    'void main() {',
    '  vMasking = aMaterial.z;',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  gl_Position = uMVP * mix(vertex4, uEM * vertex4, vMasking);',
    '}'
  ].join('\n');

  ShaderFlat.fragment = [
    'precision mediump float;',
    'void main() {',
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  return ShaderFlat;
});