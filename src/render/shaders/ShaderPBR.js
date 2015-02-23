define([
  'render/shaders/ShaderBase',
  'text!render/shaders/glsl/pbr.glsl'
], function (ShaderBase, pbrGLSL) {

  'use strict';

  var ShaderPBR = ShaderBase.getCopy();
  ShaderPBR.uniforms = {};
  ShaderPBR.attributes = {};

  ShaderPBR.uniformNames = ['uIblTransform', 'uTexture0', 'uAlbedo', 'uRoughness', 'uMetallic', 'uExposure'];
  Array.prototype.push.apply(ShaderPBR.uniformNames, ShaderBase.uniformNames.commonUniforms);

  ShaderPBR.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'attribute vec3 aMaterial;',
    ShaderBase.strings.vertUniforms,
    'uniform float uRoughness;',
    'uniform float uMetallic;',
    'uniform vec3 uAlbedo;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vAlbedo;',
    'varying float vRoughness;',
    'varying float vMetallic;',
    'varying float vMasking;',
    'void main() {',
    '  vAlbedo = uAlbedo.x >= 0.0 ? uAlbedo : aColor;',
    '  vRoughness = uRoughness >= 0.0 ? uRoughness : aMaterial.x;',
    '  vMetallic = uMetallic >= 0.0 ? uMetallic : aMaterial.y;',
    '  vMasking = aMaterial.z;',
    '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
    '  vNormal = normalize(uN * vNormal);',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vertex4 = mix(vertex4, uEM * vertex4, vMasking);',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderPBR.fragment = [
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vAlbedo;',
    'varying float vRoughness;',
    'varying float vMetallic;',
    'uniform float uAlpha;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    pbrGLSL,
    '',
    'void main(void) {',
    '  vec3 normal = normalize(vNormal);',
    '  if(!gl_FrontFacing) normal =- normal;',
    '  vec3 eye = normalize(vVertex);',
    '  environmentTransform = getEnvironmentTransform( uIblTransform );',
    '',
    '  float roughness = max( 0.0001, vRoughness );',
    '  vec3 albedo = vAlbedo * (1.0 - vMetallic);',
    '  vec3 specular = mix( vec3(0.04), vAlbedo, vMetallic);',
    '',
    '  vec3 color = uExposure * computeIBL_UE4( normal, -eye, albedo, roughness, specular );',
    '  gl_FragColor = vec4(applyMaskAndSym(color.rgb), uAlpha);',
    '}'
  ].join('\n');

  ShaderPBR.onLoadEnvironment = function (xhr, gl, main) {
    if (xhr.status !== 200)
      return;
    this.texture0 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(xhr.response));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (main)
      main.render();
  };
  ShaderPBR.getOrCreateEnvironment = function (gl, main) {
    if (this.texture0 !== undefined) return this.texture0;
    this.texture0 = null;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://stephaneginier.com/archive/panorama_prefilter_luv.bin', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = ShaderPBR.onLoadEnvironment.bind(this, xhr, gl, main);
    xhr.send(null);

    return false;
  };
  ShaderPBR.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;

    gl.uniformMatrix4fv(uniforms.uIblTransform, false, main.getCamera().view_);

    gl.uniform3fv(uniforms.uAlbedo, render.getAlbedo());
    gl.uniform1f(uniforms.uRoughness, render.getRoughness());
    gl.uniform1f(uniforms.uMetallic, render.getMetallic());
    gl.uniform1f(uniforms.uExposure, render.getExposure());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ShaderPBR.getOrCreateEnvironment(gl, main) || null);
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderPBR;
});