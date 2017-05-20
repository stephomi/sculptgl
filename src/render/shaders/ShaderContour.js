import getOptionsURL from 'misc/getOptionsURL';
import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';
import outlineGLSL from 'render/shaders/glsl/outline.glsl';

var ShaderContour = ShaderBase.getCopy();
ShaderContour.vertexName = ShaderContour.fragmentName = 'SobelContour';

ShaderContour.color = getOptionsURL().outlinecolor;
ShaderContour.uniforms = {};
ShaderContour.attributes = {};

ShaderContour.uniformNames = ['uTexture0', 'uColor', 'uInvSize'];

ShaderContour.vertex = [
  'attribute vec2 aVertex;',
  'varying vec2 vTexCoord;',
  'void main() {',
  '  vTexCoord = aVertex * 0.5 + 0.5;',
  '  gl_Position = vec4(aVertex, 0.0, 1.0);',
  '}'
].join('\n');

ShaderContour.fragment = [
  '#extension GL_OES_standard_derivatives : enable',
  'uniform sampler2D uTexture0;',
  'uniform vec4 uColor;',
  'varying vec2 vTexCoord;',
  'uniform vec2 uInvSize;',
  outlineGLSL,
  ShaderBase.strings.colorSpaceGLSL,
  'void main() {',
  '  float mag = outlineDistance(vTexCoord, uTexture0, uInvSize);',
  '  if (mag < 1.5) discard;',
  '  gl_FragColor = vec4(sRGBToLinear(uColor.rgb) * uColor.a, uColor.a);',
  '}'
].join('\n');

ShaderContour.draw = function (rtt) {
  var gl = rtt.getGL();
  gl.useProgram(this.program);

  ShaderContour.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, rtt.getTexture());
  gl.uniform1i(this.uniforms.uTexture0, 0);
  gl.uniform4fv(this.uniforms.uColor, ShaderContour.color);

  gl.uniform2fv(this.uniforms.uInvSize, rtt.getInverseSize());

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
ShaderContour.initAttributes = function (gl) {
  ShaderContour.attributes.aVertex = new Attribute(gl, ShaderContour.program, 'aVertex', 2, gl.FLOAT);
};

export default ShaderContour;
