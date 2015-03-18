define([
  'render/shaders/ShaderBase',
  'text!render/shaders/glsl/curvature.glsl'
], function (ShaderBase, curvatureGLSL) {

  'use strict';

  var ShaderCurvature = ShaderBase.getCopy();
  ShaderCurvature.uniforms = {};
  ShaderCurvature.attributes = {};

  ShaderCurvature.uniformNames = ['uAlbedo'];
  Array.prototype.push.apply(ShaderCurvature.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderCurvature.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aMaterial;',
    'attribute vec3 aColor;',
    ShaderBase.strings.vertUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying float vMasking;',
    'varying vec3 vColor;',
    'uniform vec3 uAlbedo;',
    'void main() {',
    '  vColor = uAlbedo.x >= 0.0 ? uAlbedo : aColor;',
    '  vMasking = aMaterial.z;',
    '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
    '  vNormal = normalize(uN * vNormal);',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vertex4 = mix(vertex4, uEM *vertex4, vMasking);',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderCurvature.fragment = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'uniform float uAlpha;',
    'varying vec3 vColor;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    ShaderBase.strings.colorSpaceGLSL,
    curvatureGLSL,
    'void main() {',
    '  vec3 fragColor = computeCurvature(vVertex, vNormal, vColor);',
    '  gl_FragColor = vec4(applyMaskAndSym(sRGBToLinear(fragColor)), uAlpha);',
    '}'
  ].join('\n');

  ShaderCurvature.updateUniforms = function (render, main) {
    render.getGL().uniform3fv(this.uniforms.uAlbedo, render.getAlbedo());
    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderCurvature;
});