import ShaderBase from 'render/shaders/ShaderBase';

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
  'uniform vec3 uColor;',
  'void main() {',
  '  gl_FragColor = vec4(uColor, 1.0);',
  '}'
].join('\n');

ShaderFlat.updateUniforms = function (mesh, main) {
  mesh.getGL().uniform3fv(this.uniforms.uColor, mesh.getFlatColor());
  ShaderBase.updateUniforms.call(this, mesh, main);
};

export default ShaderFlat;
