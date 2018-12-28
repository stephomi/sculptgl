import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';

var ShaderBlur = ShaderBase.getCopy();
ShaderBlur.vertexName = ShaderBlur.fragmentName = 'Blur';

ShaderBlur.INPUT_TEXTURE = null;

ShaderBlur.uniforms = {};
ShaderBlur.attributes = {};

ShaderBlur.uniformNames = ['uTexture0', 'uInvSize'];

ShaderBlur.vertex = [
  'attribute vec2 aVertex;',
  'varying vec2 vTexCoord;',
  'void main() {',
  '  vTexCoord = aVertex * 0.5 + 0.5;',
  '  gl_Position = vec4(aVertex, 0.5, 1.0);',
  '}'
].join('\n');

ShaderBlur.fragment = [
  'uniform sampler2D uTexture0;',
  'varying vec2 vTexCoord;',
  'uniform vec2 uInvSize;',
  ShaderBase.strings.colorSpaceGLSL,
  'void main() {',
  '    const int KER_SIZE = 8;',
  '    vec4 avg = texture2D(uTexture0, vTexCoord);',
  '    if (avg.a < 0.1) {',
  '        for (int i = -KER_SIZE; i <= KER_SIZE; ++i) {',
  '            for (int j = -KER_SIZE; j <= KER_SIZE; ++j) {',
  '                if (i == 0 && j == 0) continue;',
  '                vec4 fetch = texture2D(uTexture0, vTexCoord + vec2(i, j) * uInvSize);',
  '                avg.rgb += sRGBToLinear(fetch.rgb) * fetch.a;',
  '                avg.a += fetch.a;',
  '            }',
  '        }',
  '        avg.rgb = avg.a == 0.0 ? vec3(0.0) : linearTosRGB(avg.rgb / avg.a);',
  '    }',
  '    gl_FragColor = vec4(avg.rgb, 1.0);',
  '}'
].join('\n');

ShaderBlur.draw = function (rtt) {
  var gl = rtt.getGL();
  gl.useProgram(this.program);

  ShaderBlur.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, ShaderBlur.INPUT_TEXTURE.getTexture());
  gl.uniform1i(this.uniforms.uTexture0, 0);

  gl.uniform2fv(this.uniforms.uInvSize, ShaderBlur.INPUT_TEXTURE.getInverseSize());

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
ShaderBlur.initAttributes = function (gl) {
  ShaderBlur.attributes.aVertex = new Attribute(gl, ShaderBlur.program, 'aVertex', 2, gl.FLOAT);
};

export default ShaderBlur;
