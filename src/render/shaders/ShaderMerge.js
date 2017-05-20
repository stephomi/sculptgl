import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';
import getOptionsURL from 'misc/getOptionsURL';

var ShaderMerge = ShaderBase.getCopy();
ShaderMerge.vertexName = ShaderMerge.fragmentName = 'Merge';

ShaderMerge.FILMIC = getOptionsURL().filmic; // edited by the gui

ShaderMerge.uniforms = {};
ShaderMerge.attributes = {};

ShaderMerge.uniformNames = ['uTexture0', 'uTexture1', 'uFilmic'];

ShaderMerge.vertex = [
  'attribute vec2 aVertex;',
  'varying vec2 vTexCoord;',
  'void main() {',
  '  vTexCoord = aVertex * 0.5 + 0.5;',
  '  gl_Position = vec4(aVertex, 0.5, 1.0);',
  '}'
].join('\n');

ShaderMerge.fragment = [
  'uniform sampler2D uTexture0;',
  'uniform sampler2D uTexture1;',
  'uniform int uFilmic;',
  'varying vec2 vTexCoord;',
  ShaderBase.strings.colorSpaceGLSL,
  'void main() {',
  '  vec4 transparent = texture2D(uTexture1, vTexCoord);',
  '  vec3 color = decodeRGBM(texture2D(uTexture0, vTexCoord))*(1.0-transparent.a) + transparent.rgb;',
  // http://filmicgames.com/archives/75
  '  if(uFilmic == 1){',
  '    vec3 x = max(vec3(0.0), color - vec3(0.004));',
  '    gl_FragColor = vec4((x*(6.2*x+0.5))/(x*(6.2*x+1.7)+0.06), 1.0);',
  '  }else{',
  '    gl_FragColor = vec4(linearTosRGB(color), 1.0);',
  '  }',
  '}'
].join('\n');

ShaderMerge.draw = function (rtt, main) {
  var gl = rtt.getGL();
  gl.useProgram(this.program);

  ShaderMerge.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, main._rttOpaque.getTexture());
  gl.uniform1i(this.uniforms.uTexture0, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, main._rttTransparent.getTexture());
  gl.uniform1i(this.uniforms.uTexture1, 1);

  gl.uniform1i(this.uniforms.uFilmic, ShaderMerge.FILMIC);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
ShaderMerge.initAttributes = function (gl) {
  ShaderMerge.attributes.aVertex = new Attribute(gl, ShaderMerge.program, 'aVertex', 2, gl.FLOAT);
};

export default ShaderMerge;
