define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var ShaderBase = require('render/shaders/ShaderBase');

  var ShaderMatcap = ShaderBase.getCopy();
  ShaderMatcap.vertexName = ShaderMatcap.fragmentName = 'Matcap';

  ShaderMatcap.textures = {};

  ShaderMatcap.loadTexture = function (gl, img, idMaterial) {
    var idTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, idTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    ShaderMatcap.setTextureParameters(gl, img);
    gl.bindTexture(gl.TEXTURE_2D, null);
    ShaderMatcap.textures[idMaterial] = idTex;
  };

  var texPath = 'resources/matcaps/';
  ShaderMatcap.matcaps = [{
    path: texPath + 'matcapFV.jpg',
    name: 'matcap FV' // too lazy to tr
  }, {
    path: texPath + 'redClay.jpg',
    name: 'Red clay' // too lazy to tr
  }, {
    path: texPath + 'skinHazardousarts.jpg',
    name: 'Skin hazardousarts' // too lazy to tr
  }, {
    path: texPath + 'skinHazardousarts2.jpg',
    name: 'Skin Hazardousarts2' // too lazy to tr
  }, {
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
  }];

  ShaderMatcap.uniforms = {};
  ShaderMatcap.attributes = {};

  ShaderMatcap.uniformNames = ['uTexture0', 'uAlbedo'];
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
    render.setTexture0(ShaderMatcap.textures[render.getMatcap()] || ShaderMatcap.textures[0]);
    gl.bindTexture(gl.TEXTURE_2D, render.getTexture0());
    gl.uniform1i(uniforms.uTexture0, 0);

    gl.uniform3fv(uniforms.uAlbedo, render.getAlbedo());
    ShaderBase.updateUniforms.call(this, render, main);
  };

  module.exports = ShaderMatcap;
});