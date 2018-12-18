import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';

var ShaderUV = ShaderBase.getCopy();
ShaderUV.vertexName = ShaderUV.fragmentName = 'ShowUV';

ShaderUV.texPath = 'resources/uv.png';

ShaderUV.uniforms = {};
ShaderUV.attributes = {};

ShaderUV.uniformNames = ['uTexture0', 'uAlbedo'];
Array.prototype.push.apply(ShaderUV.uniformNames, ShaderBase.uniformNames.commonUniforms);

ShaderUV.vertex = [
  'attribute vec3 aVertex;',
  'attribute vec3 aNormal;',
  'attribute vec3 aColor;',
  'attribute vec2 aTexCoord;',
  'attribute vec3 aMaterial;',
  ShaderBase.strings.vertUniforms,
  'varying vec3 vVertex;',
  'varying vec3 vNormal;',
  'varying vec3 vColor;',
  'varying vec2 vTexCoord;',
  'varying float vMasking;',
  'uniform vec3 uAlbedo;',
  'void main() {',
  '  vColor = uAlbedo.x >= 0.0 ? uAlbedo : aColor;',
  '  vTexCoord = aTexCoord;',
  '  vMasking = aMaterial.z;',
  '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
  '  vNormal = normalize(uN * vNormal);',
  '  vec4 vertex4 = vec4(aVertex, 1.0);',
  '  vertex4 = mix(vertex4, uEM *vertex4, vMasking);',
  '  vVertex = vec3(uMV * vertex4);',
  '  gl_Position = uMVP * vertex4;',
  '}'
].join('\n');

ShaderUV.fragment = [
  'uniform sampler2D uTexture0;',
  'varying vec3 vVertex;',
  'varying vec3 vNormal;',
  'varying vec3 vColor;',
  'varying vec2 vTexCoord;',
  'uniform float uAlpha;',
  ShaderBase.strings.fragColorUniforms,
  ShaderBase.strings.fragColorFunction,
  'void main() {',
  '  vec3 color = sRGBToLinear(texture2D(uTexture0, vTexCoord).rgb) * sRGBToLinear(vColor);',
  '  gl_FragColor = encodeFragColor(color, uAlpha);',
  '}'
].join('\n');

ShaderUV.draw = ShaderBase.draw;
ShaderUV.drawBuffer = ShaderBase.drawBuffer;
ShaderUV.getOrCreate = ShaderBase.getOrCreate;
ShaderUV.initUniforms = ShaderBase.initUniforms;
ShaderUV.initAttributes = function (gl) {
  ShaderBase.initAttributes.call(this, gl);
  ShaderUV.attributes.aTexCoord = new Attribute(gl, ShaderUV.program, 'aTexCoord', 2, gl.FLOAT);
};
ShaderUV.bindAttributes = function (mesh) {
  ShaderBase.bindAttributes.call(this, mesh);
  ShaderUV.attributes.aTexCoord.bindToBuffer(mesh.getTexCoordBuffer());
};
ShaderUV.updateUniforms = function (mesh, main) {
  var gl = mesh.getGL();
  var uniforms = this.uniforms;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.getOrCreateTexture0(gl, ShaderUV.texPath, main) || this.getDummyTexture(gl));
  gl.uniform1i(uniforms.uTexture0, 0);

  gl.uniform3fv(uniforms.uAlbedo, mesh.getAlbedo());
  ShaderBase.updateUniforms.call(this, mesh, main);
};

export default ShaderUV;
