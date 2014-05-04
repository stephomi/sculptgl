define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderMatcap = {};
  ShaderMatcap.uniforms = {};
  ShaderMatcap.attributes = {};
  ShaderMatcap.program = undefined;

  ShaderMatcap.uniformNames = ['uMV', 'uMVP', 'uN', 'uTexture0'];
  [].push.apply(ShaderMatcap.uniformNames, ShaderBase.uniformNames.picking);

  ShaderMatcap.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vVertex = vec3(uMV * vertex4);',
    '  vColor = aColor;',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderMatcap.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    ShaderBase.strings.pickingUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    ShaderBase.strings.pickingFunction,
    'void main() {',
    '  vec3 nm_z = normalize(vVertex);',
    '  vec3 nm_x = cross(nm_z, vec3(0.0, 1.0, 0.0));',
    '  vec3 nm_y = cross(nm_x, nm_z);',
    '  vec2 texCoord = vec2(0.5 * dot(vNormal, nm_x) + 0.5, - 0.5 * dot(vNormal, nm_y) - 0.5);',
    '  vec3 fragColor = texture2D(uTexture0, texCoord).rgb * vColor;',
    '  fragColor = picking(fragColor);',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderMatcap.draw = function (render, sculptgl) {
    render.gl_.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderMatcap.getOrCreate = function (gl) {
    return ShaderMatcap.program ? ShaderMatcap : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderMatcap.initAttributes = function (gl) {
    var program = ShaderMatcap.program;
    var attrs = ShaderMatcap.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
  };
  /** Bind attributes */
  ShaderMatcap.bindAttributes = function (render) {
    var attrs = ShaderMatcap.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
  };
  /** Updates uniforms */
  ShaderMatcap.updateUniforms = function (render, sculptgl) {
    var gl = render.gl_;
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, render.getTexture0());
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, sculptgl);
  };

  return ShaderMatcap;
});