define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderWireframe = {};
  ShaderWireframe.uniforms = {};
  ShaderWireframe.attributes = {};
  ShaderWireframe.program = undefined;

  ShaderWireframe.uniformNames = ['uMVP', 'uEM'];

  ShaderWireframe.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aMaterial;',
    'uniform mat4 uMVP;',
    'uniform mat4 uEM;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vec4 pos = uMVP * mix(vertex4, uEM * vertex4, aMaterial.z);',
    '  pos[3] += 0.0001;',
    '  gl_Position = pos;',
    '}'
  ].join('\n');

  ShaderWireframe.fragment = [
    'precision mediump float;',
    'void main() {',
    '  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.05);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderWireframe.draw = function (render /*, main*/ ) {
    var gl = render.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render);
    render.getWireframeBuffer().bind();
    gl.enable(gl.BLEND);
    gl.drawElements(gl.LINES, render.getMesh().getRenderNbEdges() * 2, gl.UNSIGNED_INT, 0);
    gl.disable(gl.BLEND);
  };
  /** Get or create the shader */
  ShaderWireframe.getOrCreate = function (gl) {
    return ShaderWireframe.program ? ShaderWireframe : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderWireframe.initAttributes = function (gl) {
    ShaderWireframe.attributes.aVertex = new Attribute(gl, ShaderWireframe.program, 'aVertex', 3, glfloat);
    ShaderWireframe.attributes.aMaterial = new Attribute(gl, ShaderWireframe.program, 'aMaterial', 3, glfloat);
  };
  /** Bind attributes */
  ShaderWireframe.bindAttributes = function (render) {
    ShaderWireframe.attributes.aVertex.bindToBuffer(render.getVertexBuffer());
    ShaderWireframe.attributes.aMaterial.bindToBuffer(render.getMaterialBuffer());
  };
  /** Updates uniforms */
  ShaderWireframe.updateUniforms = function (render) {
    render.getGL().uniformMatrix4fv(this.uniforms.uMVP, false, render.getMesh().getMVP());
    render.getGL().uniformMatrix4fv(this.uniforms.uEM, false, render.getMesh().getEditMatrix());
  };

  return ShaderWireframe;
});