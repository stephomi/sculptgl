define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderGrid = {};
  ShaderGrid.uniforms = {};
  ShaderGrid.attributes = {};
  ShaderGrid.program = undefined;

  ShaderGrid.uniformNames = ['uMVP'];

  ShaderGrid.vertex = [
    'attribute vec3 aVertex;',
    'uniform mat4 uMVP;',
    'void main() {',
    '  gl_Position = uMVP * vec4(aVertex, 1.0);',
    '}'
  ].join('\n');

  ShaderGrid.fragment = [
    'precision mediump float;',
    'void main() {',
    '  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderGrid.draw = function (grid /*, main*/ ) {
    var gl = grid.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(grid);
    this.updateUniforms(grid);
    gl.drawArrays(gl.LINES, 0, grid.getVertexBuffer().size_ / 3);
  };
  /** Get or create the shader */
  ShaderGrid.getOrCreate = function (gl) {
    return ShaderGrid.program ? ShaderGrid : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderGrid.initAttributes = function (gl) {
    ShaderGrid.attributes.aVertex = new Attribute(gl, ShaderGrid.program, 'aVertex', 3, glfloat);
  };
  /** Bind attributes */
  ShaderGrid.bindAttributes = function (grid) {
    ShaderGrid.attributes.aVertex.bindToBuffer(grid.getVertexBuffer());
  };
  /** Updates uniforms */
  ShaderGrid.updateUniforms = function (grid) {
    grid.getGL().uniformMatrix4fv(this.uniforms.uMVP, false, grid.getMVP());
  };

  return ShaderGrid;
});