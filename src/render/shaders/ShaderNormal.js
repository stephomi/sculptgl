import ShaderBase from 'render/shaders/ShaderBase';

var ShaderNormal = ShaderBase.getCopy();
ShaderNormal.vertexName = ShaderNormal.fragmentName = 'ShowNormal';

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
  'varying vec3 vVertex;',
  'varying vec3 vNormal;',
  'uniform float uAlpha;',
  ShaderBase.strings.fragColorUniforms,
  ShaderBase.strings.fragColorFunction,
  'void main() {',
  '  gl_FragColor = encodeFragColor(sRGBToLinear(getNormal() * 0.5 + 0.5), uAlpha);',
  '}'
].join('\n');

export default ShaderNormal;
