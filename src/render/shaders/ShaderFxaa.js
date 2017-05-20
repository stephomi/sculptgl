import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';
import getOptionsURL from 'misc/getOptionsURL';
import fxaaGLSL from 'render/shaders/glsl/fxaa.glsl';

var ShaderFxaa = ShaderBase.getCopy();
ShaderFxaa.vertexName = ShaderFxaa.fragmentName = 'Fxaa';

ShaderFxaa.FILMIC = getOptionsURL().filmic; // edited by the gui

ShaderFxaa.uniforms = {};
ShaderFxaa.attributes = {};

ShaderFxaa.uniformNames = ['uTexture0', 'uInvSize'];

ShaderFxaa.vertex = [
  'attribute vec2 aVertex;',
  'uniform vec2 uInvSize;',
  'varying vec2 vUVNW;',
  'varying vec2 vUVNE;',
  'varying vec2 vUVSW;',
  'varying vec2 vUVSE;',
  'varying vec2 vUVM;',
  'void main() {',
  '  vUVM = aVertex * 0.5 + 0.5;',
  '  vUVNW = vUVM + vec2(-1.0, -1.0) * uInvSize;',
  '  vUVNE = vUVM + vec2(1.0, -1.0) * uInvSize;',
  '  vUVSW = vUVM + vec2(-1.0, 1.0) * uInvSize;',
  '  vUVSE = vUVM + vec2(1.0, 1.0) * uInvSize;',
  '  gl_Position = vec4(aVertex, 0.5, 1.0);',
  '}'
].join('\n');

ShaderFxaa.fragment = [
  'uniform sampler2D uTexture0;',
  'uniform vec2 uInvSize;',
  'varying vec2 vUVNW;',
  'varying vec2 vUVNE;',
  'varying vec2 vUVSW;',
  'varying vec2 vUVSE;',
  'varying vec2 vUVM;',
  fxaaGLSL,
  ShaderBase.strings.colorSpaceGLSL,
  'void main() {',
  '  gl_FragColor = vec4(fxaa(uTexture0, vUVNW, vUVNE, vUVSW, vUVSE, vUVM, uInvSize), 1.0);',
  '}'
].join('\n');

ShaderFxaa.draw = function (rtt, main) {
  var gl = rtt.getGL();
  gl.useProgram(this.program);

  ShaderFxaa.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, main._rttMerge.getTexture());
  gl.uniform1i(this.uniforms.uTexture0, 0);

  gl.uniform2fv(this.uniforms.uInvSize, rtt.getInverseSize());

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
ShaderFxaa.initAttributes = function (gl) {
  ShaderFxaa.attributes.aVertex = new Attribute(gl, ShaderFxaa.program, 'aVertex', 2, gl.FLOAT);
};

export default ShaderFxaa;
