define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var getOptionsURL = require('misc/getOptionsURL');
  var ShaderBase = require('render/shaders/ShaderBase');
  var pbrGLSL = require('text!render/shaders/glsl/pbr.glsl');
  var TR = require('gui/GuiTR');

  var mat3 = glm.mat3;

  var ShaderPBR = ShaderBase.getCopy();
  ShaderPBR.vertexName = ShaderPBR.fragmentName = 'ShadingPBR';

  ShaderPBR.textures = {};

  // TODO update i18n strings in a dynamic way
  var texPath = 'resources/environments/';
  ShaderPBR.environments = [{
    path: texPath + 'footPrint.bin',
    sph: [0.96097, 0.856821, 1.11124, -0.313999, -0.358144, -0.625599, 0.0870941, 0.1109, 0.171528, -0.100569, -0.0498991, -0.0302566, 0.02047, 0.0151743, 0.0182682, -0.00652953, -0.0188746, -0.0525354, 0.00192821, -0.0279455, -0.110808, -0.0180287, -0.0227345, -0.0422744, 0.0139192, -0.0187345, -0.0812033],
    name: TR('envFootPrint')
  }, {
    path: texPath + 'glazedPatio.bin',
    sph: [0.475424, 0.460106, 0.407626, -0.0626622, -0.0978501, -0.148369, -0.029662, -0.022522, -0.0109794, -0.0893952, -0.116715, -0.139033, 0.0450059, 0.0514445, 0.0619667, 0.00471057, 0.00393219, 0.00522881, -0.0508041, -0.0540791, -0.0530655, -0.0278953, -0.0258599, -0.0191718, -0.0137735, -0.0186312, -0.0286948],
    name: TR('envGlazedPatio')
  }, {
    path: texPath + 'nicolausChurch.bin',
    sph: [1.67609, 1.52776, 1.05807, -0.261794, -0.293249, -0.225056, 0.0371792, 0.0263728, -0.0174064, 0.142577, 0.121132, 0.0724402, 0.00827981, 0.00263222, 0.00184229, 0.0208164, 0.0128967, 0.0139606, 0.0795516, 0.0909961, 0.0897778, 0.058084, 0.0541786, 0.0401144, -0.0664757, -0.0587091, -0.0386655],
    name: TR('envNicolausChurch')
  }, {
    path: texPath + 'terrace.bin',
    sph: [0.688602, 0.636799, 0.515733, -0.192892, -0.219448, -0.242244, 0.126328, 0.124547, 0.0928089, 0.308754, 0.307826, 0.214901, -0.0713295, -0.0740211, -0.0583892, -0.0283229, -0.0290954, -0.0224256, -0.030012, -0.0302393, -0.0280645, 0.0766113, 0.0653549, 0.0388244, 0.104034, 0.0751443, 0.0221583],
    name: TR('envTerrace')
  }, {
    path: texPath + 'bryantPark.bin',
    sph: [0.583073, 0.794556, 0.966801, -0.218899, -0.334516, -0.690954, -0.0581536, -0.0912214, -0.13112, 0.0180201, 0.0683966, 0.157536, -0.0427475, -0.073612, -0.112892, 0.0490024, 0.06527, 0.0841072, -0.0243839, -0.0429701, -0.0792229, -0.0441213, -0.0562622, -0.0728875, -0.0267015, -0.0586719, -0.11978],
    name: TR('envBryantPark')
  }];
  var opts = getOptionsURL();
  ShaderPBR.idEnv = Math.min(opts.environment, ShaderPBR.environments.length - 1);
  ShaderPBR.exposure = Math.min(opts.exposure, 5);

  ShaderPBR.uniforms = {};
  ShaderPBR.attributes = {};

  ShaderPBR.uniformNames = ['uIblTransform', 'uTexture0', 'uAlbedo', 'uRoughness', 'uMetallic', 'uExposure', 'uSPH'];
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
    'uniform vec3 uSPH[9];',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    pbrGLSL,
    '',
    'void main(void) {',
    '  vec3 normal = getNormal();',
    '  float roughness = max( 0.0001, vRoughness );',
    '  vec3 linColor = sRGBToLinear(vAlbedo);',
    '  vec3 albedo = linColor * (1.0 - vMetallic);',
    '  vec3 specular = mix( vec3(0.04), linColor, vMetallic);',
    '',
    '  vec3 color = uExposure * computeIBL_UE4( normal, -normalize(vVertex), albedo, roughness, specular );',
    '  gl_FragColor = encodeFragColor(color, uAlpha);',
    '}'
  ].join('\n');

  ShaderPBR.onLoadEnvironment = function (xhr, gl, main, env) {
    // nodejs context : status is 0 for some reasons
    if (xhr.status !== 200 && (!xhr.response || !xhr.response.byteLength))
      return;
    env.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, env.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(xhr.response));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (main)
      main.render();
  };
  ShaderPBR.getOrCreateEnvironment = function (gl, main, env) {
    if (env.texture !== undefined) return env.texture;
    env.texture = null;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', env.path, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = ShaderPBR.onLoadEnvironment.bind(this, xhr, gl, main, env);
    xhr.send(null);

    return null;
  };

  ShaderPBR.getOrCreateSPH = function (env) {
    if (env.sphCoef) return env.sphCoef;
    var c0 = 1.0 / (2.0 * Math.sqrt(Math.PI));
    var c1 = -(Math.sqrt(3.0 / Math.PI) * 0.5);
    var c2 = -c1;
    var c3 = c1;
    var c4 = Math.sqrt(15.0 / Math.PI) * 0.5;
    var c5 = -c4;
    var c6 = Math.sqrt(5.0 / Math.PI) * 0.25;
    var c7 = c5;
    var c8 = Math.sqrt(15.0 / Math.PI) * 0.25;
    var coef = [c0, c0, c0, c1, c1, c1, c2, c2, c2, c3, c3, c3, c4, c4, c4, c5, c5, c5, c6, c6, c6, c7, c7, c7, c8, c8, c8];
    var sphCoef = env.sphCoef = new Float32Array(27);
    var sph = env.sph;
    for (var i = 0; i < 27; ++i)
      sphCoef[i] = sph[i] * coef[i];
    return sphCoef;
  };

  var uIBLTmp = mat3.create();
  ShaderPBR.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;

    mat3.fromMat4(uIBLTmp, main.getCamera().getView());
    gl.uniformMatrix3fv(uniforms.uIblTransform, false, mat3.transpose(uIBLTmp, uIBLTmp));

    gl.uniform3fv(uniforms.uAlbedo, render.getAlbedo());
    gl.uniform1f(uniforms.uRoughness, render.getRoughness());
    gl.uniform1f(uniforms.uMetallic, render.getMetallic());
    gl.uniform1f(uniforms.uExposure, ShaderPBR.exposure);

    var env = ShaderPBR.environments[ShaderPBR.idEnv];
    gl.uniform3fv(uniforms.uSPH, ShaderPBR.getOrCreateSPH(env));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ShaderPBR.getOrCreateEnvironment(gl, main, env));
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, main);
  };

  module.exports = ShaderPBR;
});