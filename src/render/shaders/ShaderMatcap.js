import TR from 'gui/GuiTR';
import ShaderBase from 'render/shaders/ShaderBase';

var ShaderMatcap = ShaderBase.getCopy();
ShaderMatcap.vertexName = ShaderMatcap.fragmentName = 'Matcap';

ShaderMatcap.textures = {};

ShaderMatcap.createTexture = function (gl, img, idMaterial) {
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
  'attribute vec3 aVertex;',
  'attribute vec3 aNormal;',
  'attribute vec3 aColor;',
  'attribute vec3 aMaterial;',
  ShaderBase.strings.vertUniforms,
  'varying vec3 vVertex;',
  'varying vec3 vNormal;',
  'varying vec3 vColor;',
  'varying float vMasking;',
  'varying vec3 vVertexPres;',
  'uniform vec3 uAlbedo;',
  'void main() {',
  '  vColor = uAlbedo.x >= 0.0 ? uAlbedo : aColor;',
  '  vMasking = aMaterial.z;',
  '  vNormal = mix(aNormal, uEN * aNormal, vMasking);',
  '  vNormal = normalize(uN * vNormal);',
  '  vec4 vertex4 = vec4(aVertex, 1.0);',
  '  vertex4 = mix(vertex4, uEM * vertex4, vMasking);',
  '  vVertex = vec3(uMV * vertex4);',
  // annoying stuffs : on mobile + with ortho matrix 
  // there's a precision issue with vVertex lerp between VS and FS
  // it is caused by the big ortho z translation factor, one solutions
  // is to use highp, one another to compute the matcap UV in the VS (but 
  // no flat shading in that case)
  '  vVertexPres = vVertex / max(1.0, abs(uMV[3][2]));',
  '  gl_Position = uMVP * vertex4;',
  '}'
].join('\n');

ShaderMatcap.fragment = [
  'uniform sampler2D uTexture0;',
  'varying vec3 vVertex;',
  'varying vec3 vVertexPres;',
  'varying vec3 vNormal;',
  'varying vec3 vColor;',
  'uniform float uAlpha;',
  ShaderBase.strings.fragColorUniforms,
  ShaderBase.strings.fragColorFunction,
  'void main() {',
  '  vec3 normal = getNormal();',
  '  vec3 nm_z = normalize(vVertexPres);',
  '  vec3 nm_x = vec3(-nm_z.z, 0.0, nm_z.x);',
  '  vec3 nm_y = cross(nm_x, nm_z);',
  '  vec2 texCoord = 0.5 + 0.5 * vec2(dot(normal, nm_x), dot(normal, nm_y));',
  '  vec3 color = sRGBToLinear(texture2D(uTexture0, texCoord).rgb) * sRGBToLinear(vColor);',
  '  gl_FragColor = encodeFragColor(color, uAlpha);',
  '}'
].join('\n');

ShaderMatcap.updateUniforms = function (mesh, main) {
  var gl = mesh.getGL();
  var uniforms = this.uniforms;

  gl.activeTexture(gl.TEXTURE0);
  mesh.setTexture0(ShaderMatcap.textures[mesh.getMatcap()]);
  gl.bindTexture(gl.TEXTURE_2D, mesh.getTexture0() || this.getDummyTexture(gl));
  gl.uniform1i(uniforms.uTexture0, 0);

  gl.uniform3fv(uniforms.uAlbedo, mesh.getAlbedo());
  ShaderBase.updateUniforms.call(this, mesh, main);
};

export default ShaderMatcap;
