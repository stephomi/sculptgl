define([
  'render/shaders/ShaderBase'
], function (ShaderBase) {

  'use strict';

  var ShaderGrid = ShaderBase.getCopy();
  ShaderGrid.uniforms = {};
  ShaderGrid.attributes = {};
  ShaderGrid.activeAttributes = {
    vertex: true
  };

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
    '  gl_FragColor = vec4(0.2140, 0.2140, 0.2140, 1.0);',
    '}'
  ].join('\n');

  ShaderGrid.draw = function (grid /*, main*/ ) {
    var gl = grid.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(grid);
    this.updateUniforms(grid);
    gl.drawArrays(gl.LINES, 0, grid.getVertexBuffer().size_ / 3);
  };
  ShaderGrid.updateUniforms = function (grid) {
    grid.getGL().uniformMatrix4fv(this.uniforms.uMVP, false, grid.getMVP());
  };

  return ShaderGrid;
});