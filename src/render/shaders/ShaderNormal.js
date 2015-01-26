define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderNormal = {};
  ShaderNormal.uniforms = {};
  ShaderNormal.attributes = {};
  ShaderNormal.program = undefined;

  ShaderNormal.uniformNames = ['uMV', 'uMVP', 'uN'];
  Array.prototype.push.apply(ShaderNormal.uniformNames, ShaderBase.uniformNames.symmetryLine);

  ShaderNormal.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aMaterial;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying float vMasking;',
    'void main() {',
    '  vec4 vert4 = vec4(aVertex, 1.0);',
    '  vNormal = uN * normalize(aNormal);',
    '  vVertex = vec3(uMV * vert4);',
    '  vMasking = aMaterial.z;',
    '  gl_Position = uMVP * vert4;',
    '}'
  ].join('\n');

  ShaderNormal.fragment = [
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    'void main() {',
    '  gl_FragColor = getFragColor(vNormal * 0.5 + 0.5);',
    '}'
  ].join('\n');
  /** Draw */
  ShaderNormal.draw = function (render, main) {
    render.getGL().useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderNormal.getOrCreate = function (gl) {
    return ShaderNormal.program ? ShaderNormal : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderNormal.initAttributes = function (gl) {
    var program = ShaderNormal.program;
    var attrs = ShaderNormal.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aMaterial = new Attribute(gl, program, 'aMaterial', 3, glfloat);
  };
  /** Bind attributes */
  ShaderNormal.bindAttributes = function (render) {
    var attrs = ShaderNormal.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aMaterial.bindToBuffer(render.getMaterialBuffer());
  };
  /** Updates uniforms */
  ShaderNormal.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderNormal;
});