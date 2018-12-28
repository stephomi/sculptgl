import ShaderBase from 'render/shaders/ShaderBase';
import Attribute from 'render/Attribute';

var ShaderPaintUV = ShaderBase.getCopy();
ShaderPaintUV.CHANNEL_VALUE = 0; // 0 color, 1 roughness, 2 metalness
ShaderPaintUV.vertexName = ShaderPaintUV.fragmentName = 'PaintUV';

ShaderPaintUV.uniforms = {};
ShaderPaintUV.attributes = {};

ShaderPaintUV.uniformNames = ['uChannelPaint'];

ShaderPaintUV.activeAttributes = {
  color: true,
  material: true
};

ShaderPaintUV.vertex = [
  'attribute vec2 aTexCoord;',
  'attribute vec3 aColor;',
  'attribute vec3 aMaterial;',
  'varying vec3 vColor;',
  'varying vec2 vMaterial;',
  'void main() {',
  '  vColor = aColor;',
  '  vMaterial = aMaterial.xy;',
  '  gl_Position = vec4((aTexCoord * 2.0 - 1.0) * vec2(1.0, -1.0), 0.5, 1.0);',
  '}'
].join('\n');

ShaderPaintUV.fragment = [
  'varying vec3 vColor;',
  'varying vec2 vMaterial;',
  'uniform int uChannelPaint;',
  'void main() {',
  '  gl_FragColor = vec4(uChannelPaint == 0 ? vColor : uChannelPaint == 1 ? vMaterial.xxx : vMaterial.yyy, 1.0);',
  '}'
].join('\n');

ShaderPaintUV.initAttributes = function (gl) {
  ShaderBase.initAttributes.call(this, gl);
  ShaderPaintUV.attributes.aTexCoord = new Attribute(gl, ShaderPaintUV.program, 'aTexCoord', 2, gl.FLOAT);
};

ShaderPaintUV.bindAttributes = function (mesh) {
  ShaderBase.bindAttributes.call(this, mesh);
  ShaderPaintUV.attributes.aTexCoord.bindToBuffer(mesh.getTexCoordBuffer());
};

ShaderPaintUV.updateUniforms = function (mesh) {
  var gl = mesh.getGL();
  gl.uniform1i(this.uniforms.uChannelPaint, ShaderPaintUV.CHANNEL_VALUE);
};

export default ShaderPaintUV;
