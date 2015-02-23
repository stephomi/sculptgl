define([
  'render/shaders/ShaderBase'
], function (ShaderBase) {

  'use strict';

  var ShaderNormal = ShaderBase.getCopy();
  ShaderNormal.uniforms = {};
  ShaderNormal.attributes = {};
  ShaderNormal.activeAttributes = {
    vertex: true,
    normal: true,
    material: true
  };

  ShaderNormal.uniformNames = [];
  Array.prototype.push.apply(ShaderNormal.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderNormal.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aMaterial;',
    ShaderBase.strings.vertUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying float vMasking;',
    'void main() {',
    '  vMasking = aMaterial.z;',
    '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
    '  vNormal = normalize(uN * vNormal);',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vertex4 = mix(vertex4, uEM *vertex4, vMasking);',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderNormal.fragment = [
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'uniform float uAlpha;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    ShaderBase.strings.colorSpaceGLSL,
    'void main() {',
    '  gl_FragColor = vec4(applyMaskAndSym(sRGBToLinear(vNormal * 0.5 + 0.5)), uAlpha);',
    '}'
  ].join('\n');

  return ShaderNormal;
});