import { mat3 } from 'gl-matrix';
import getOptionsURL from 'misc/getOptionsURL';
import ShaderBase from 'render/shaders/ShaderBase';
import pbrGLSL from 'render/shaders/glsl/pbr.glsl';

var ShaderPBR = ShaderBase.getCopy();
ShaderPBR.vertexName = ShaderPBR.fragmentName = 'ShadingPBR';

ShaderPBR.textures = {};

var texPath = 'resources/environments/';
ShaderPBR.environments = [{
  // https://hdrihaven.com/hdri/?h=mpumalanga_veld
  path: texPath + 'mpumalanga_veld_1k.png',
  sph: [0.136819, 0.174125, 0.253762, 0.027778, 0.056838, 0.131221, 0.074356, 0.086793, 0.099181, -0.079040, -0.091269, -0.102346, -0.027550, -0.032300, -0.039217, 0.031822, 0.034773, 0.039945, 0.017235, 0.021044, 0.026136, -0.106608, -0.118640, -0.132761, 0.041000, 0.049794, 0.061183],
  exposure: 2.5,
  name: 'Mpumalanga veld'
}, {
  // https://hdrihaven.com/hdri/?h=venetian_crossroads
  path: texPath + 'venetian_crossroads_1k.png',
  sph: [0.200626, 0.198426, 0.209579, 0.090452, 0.127807, 0.188390, 0.093188, 0.103245, 0.106131, 0.033349, 0.054751, 0.067044, 0.074350, 0.081670, 0.079716, 0.063127, 0.085940, 0.101710, 0.007751, 0.005710, -0.000791, 0.104134, 0.103979, 0.094236, -0.022747, -0.028166, -0.037714],
  exposure: 2.5,
  name: 'Venetian crossroads'
}, {
  // https://hdrihaven.com/hdri/?h=studio_small_01
  path: texPath + 'studio_small_01_1k.png',
  sph: [0.534107, 0.589985, 0.617478, 0.119999, 0.130480, 0.128019, 0.089872, 0.088707, 0.088017, 0.099999, 0.151282, 0.138458, 0.005015, 0.035588, 0.027592, 0.114999, 0.116739, 0.120579, -0.057997, -0.069532, -0.070401, 0.385123, 0.411714, 0.454725, 0.303242, 0.333004, 0.350270],
  exposure: 0.5,
  name: 'Studio small 01'
}, {
  // https://hdrihaven.com/hdri/?h=moonless_golf
  path: texPath + 'moonless_golf_1k.png',
  sph: [0.137579, 0.112906, 0.093470, 0.070711, 0.066043, 0.065337, -0.029564, -0.020720, -0.007737, -0.037254, -0.033270, -0.028294, -0.023847, -0.021208, -0.018767, -0.007873, -0.002587, 0.003955, 0.009241, 0.007711, 0.006063, 0.017917, 0.011733, 0.007669, 0.036859, 0.026285, 0.014740],
  exposure: 1.0,
  name: 'Moonless golf'
}, {
  // https://hdrihaven.com/hdri/?h=winter_river
  path: texPath + 'winter_river_1k.png',
  sph: [0.560145, 0.554695, 0.513523, -0.213105, -0.155190, -0.063568, 0.135182, 0.114211, 0.069349, 0.172852, 0.151820, 0.105477, 0.065753, 0.064050, 0.052622, 0.096352, 0.086557, 0.063826, 0.021830, 0.016560, 0.008804, 0.186193, 0.163720, 0.119627, 0.025363, 0.022278, 0.014461],
  exposure: 0.5,
  name: 'Winter river'
}];

var opts = getOptionsURL();
ShaderPBR.idEnv = Math.min(opts.environment, ShaderPBR.environments.length - 1);
ShaderPBR.exposure = opts.exposure === undefined ? ShaderPBR.environments[ShaderPBR.idEnv].exposure : Math.min(opts.exposure, 5);

ShaderPBR.uniforms = {};
ShaderPBR.attributes = {};

ShaderPBR.uniformNames = ['uIblTransform', 'uTexture0', 'uAlbedo', 'uRoughness', 'uMetallic', 'uExposure', 'uSPH', 'uEnvSize'];
Array.prototype.push.apply(ShaderPBR.uniformNames, ShaderBase.uniformNames.commonUniforms);

ShaderPBR.vertex = [
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

// ShaderPBR.onLoadEnvironment = function (gl, tex, main, env) {
ShaderPBR.onLoadEnvironment = function (xhr, gl, main, env) {
  // nodejs context : status is 0 for some reasons
  if (xhr.status && xhr.status !== 200 && (!xhr.response || !xhr.response.byteLength))
    return;

  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  var w = xhr.width || Math.sqrt(xhr.response.byteLength / 8);
  var h = w * 2;
  env.size = [w, h];

  env.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, env.texture);

  if (xhr.response) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(xhr.response));
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, xhr);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (main) main.render();
};

ShaderPBR.getOrCreateEnvironment = function (gl, main, env) {
  if (env.texture !== undefined) return env.texture;
  env.texture = null;

  if (env.path.endsWith('png')) {
    var image = new Image();
    image.src = env.path;
    image.onload = ShaderPBR.onLoadEnvironment.bind(this, image, gl, main, env);
    return null;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', env.path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = ShaderPBR.onLoadEnvironment.bind(this, xhr, gl, main, env);
  xhr.send(null);
  return null;
};

var uIBLTmp = mat3.create();
ShaderPBR.updateUniforms = function (mesh, main) {
  var gl = mesh.getGL();
  var uniforms = this.uniforms;

  mat3.fromMat4(uIBLTmp, main.getCamera().getView());
  gl.uniformMatrix3fv(uniforms.uIblTransform, false, mat3.transpose(uIBLTmp, uIBLTmp));

  gl.uniform3fv(uniforms.uAlbedo, mesh.getAlbedo());
  gl.uniform1f(uniforms.uRoughness, mesh.getRoughness());
  gl.uniform1f(uniforms.uMetallic, mesh.getMetallic());
  gl.uniform1f(uniforms.uExposure, ShaderPBR.exposure);

  var env = ShaderPBR.environments[ShaderPBR.idEnv];
  gl.uniform3fv(uniforms.uSPH, env.sph);
  if (env.size) gl.uniform2fv(uniforms.uEnvSize, env.size);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, ShaderPBR.getOrCreateEnvironment(gl, main, env) || this.getDummyTexture(gl));
  gl.uniform1i(uniforms.uTexture0, 0);

  ShaderBase.updateUniforms.call(this, mesh, main);
};

export default ShaderPBR;
