define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderUV = {};
  ShaderUV.texPath = 'resources/uv.jpg';

  ShaderUV.uniforms = {};
  ShaderUV.attributes = {};
  ShaderUV.program = undefined;

  ShaderUV.uniformNames = ['uMV', 'uMVP', 'uN', 'uTexture0'];
  Array.prototype.push.apply(ShaderUV.uniformNames, ShaderBase.uniformNames.symmetryLine);

  ShaderUV.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'attribute vec2 aTexCoord;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vVertex = vec3(uMV * vertex4);',
    '  vColor = aColor;',
    '  vTexCoord = aTexCoord;',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderUV.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    ShaderBase.strings.symmetryLineUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying vec2 vTexCoord;',
    ShaderBase.strings.symmetryLineFunction,
    'void main() {',
    '  vec3 fragColor = texture2D(uTexture0, vTexCoord).rgb * vColor;',
    '  fragColor = symmetryLine(fragColor);',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderUV.draw = function (render, main) {
    render.getGL().useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderUV.getOrCreate = function (gl) {
    return ShaderUV.program ? ShaderUV : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderUV.initAttributes = function (gl) {
    var program = ShaderUV.program;
    var attrs = ShaderUV.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
    attrs.aTexCoord = new Attribute(gl, program, 'aTexCoord', 2, glfloat);
  };
  /** Bind attributes */
  ShaderUV.bindAttributes = function (render) {
    var attrs = ShaderUV.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
    attrs.aTexCoord.bindToBuffer(render.getTexCoordBuffer());
  };
  /** Updates uniforms */
  ShaderUV.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    gl.activeTexture(gl.TEXTURE0);
    var tex = ShaderBase.getOrCreateTexture0.call(this, gl, ShaderUV.texPath, main);
    if (tex)
      gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderUV;
});