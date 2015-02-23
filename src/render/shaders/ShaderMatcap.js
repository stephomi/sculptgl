define([
  'gui/GuiTR',
  'render/shaders/ShaderBase'
], function (TR, ShaderBase) {

  'use strict';

  var ShaderMatcap = ShaderBase.getCopy();
  ShaderMatcap.textures = {};

  var texPath = 'resources/matcaps/';
  ShaderMatcap.matcaps = [{
    path: texPath + 'pearl.jpg',
    name: TR('matcapPearl')
  }, {
    path: texPath + 'clay.jpg',
    name: TR('matcapClay')
  }, {
    path: texPath + 'skin.jpg',
    name: TR('matcapSkin')
  }, {
    path: texPath + 'green.jpg',
    name: TR('matcapGreen')
  }, {
    path: texPath + 'white.jpg',
    name: TR('matcapWhite')
  }, {
    path: texPath + 'bronze.jpg',
    name: TR('matcapBronze')
  }, {
    path: texPath + 'chavant.jpg',
    name: TR('matcapChavant')
  }, {
    path: texPath + 'drink.jpg',
    name: TR('matcapDrink')
  }, {
    path: texPath + 'redvelvet.jpg',
    name: TR('matcapRedVelvet')
  }, {
    path: texPath + 'orange.jpg',
    name: TR('matcapOrange')
  }];

  ShaderMatcap.uniforms = {};
  ShaderMatcap.attributes = {};

  ShaderMatcap.uniformNames = ['uTexture0'];
  Array.prototype.push.apply(ShaderMatcap.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderMatcap.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'attribute vec3 aMaterial;',
    ShaderBase.strings.vertUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying float vMasking;',
    'void main() {',
    '  vColor = aColor;',
    '  vMasking = aMaterial.z;',
    '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
    '  vNormal = normalize(uN * vNormal);',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vertex4 = mix(vertex4, uEM *vertex4, vMasking);',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderMatcap.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'uniform float uAlpha;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    ShaderBase.strings.colorSpaceGLSL,
    'void main() {',
    '  vec3 nm_z = normalize(vVertex);',
    '  vec3 nm_x = cross(nm_z, vec3(0.0, 1.0, 0.0));',
    '  vec3 nm_y = cross(nm_x, nm_z);',
    '  vec2 texCoord = 0.5 + 0.5 * vec2(dot(vNormal, nm_x), dot(vNormal, nm_y));',
    '  vec3 fragColor = texture2D(uTexture0, texCoord).rgb * vColor;',
    '  gl_FragColor = vec4(applyMaskAndSym(sRGBToLinear(fragColor)), uAlpha);',
    '}'
  ].join('\n');

  ShaderMatcap.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, render.getTexture0() || ShaderMatcap.textures[0]);
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderMatcap;
});