define([
  'render/shaders/ShaderBase'
], function (ShaderBase) {

  'use strict';

  var ShaderSelection = ShaderBase.getCopy();
  ShaderSelection.uniforms = {};
  ShaderSelection.attributes = {};
  ShaderSelection.activeAttributes = {
    vertex: true
  };

  ShaderSelection.uniformNames = ['uMVP', 'uColor'];

  ShaderSelection.vertex = [
    'attribute vec3 aVertex;',
    'uniform mat4 uMVP;',
    'void main() {',
    '  gl_Position = uMVP * vec4(aVertex, 1.0);',
    '}'
  ].join('\n');

  ShaderSelection.fragment = [
    'precision mediump float;',
    'uniform vec3 uColor;',
    'void main() {',
    '  gl_FragColor = vec4(uColor, 1.0);',
    '}'
  ].join('\n');

  ShaderSelection.getOrCreate = ShaderBase.getOrCreate;
  ShaderSelection.draw = function (geom, drawCircle, drawSym) {
    var gl = geom.getGL();
    gl.useProgram(this.program);

    gl.uniform3fv(this.uniforms.uColor, geom.getColor());

    if (drawCircle) {
      gl.uniformMatrix4fv(this.uniforms.uMVP, false, geom.getCircleMVP());
      ShaderSelection.attributes.aVertex.bindToBuffer(geom.getCircleBuffer());
      gl.drawArrays(gl.LINE_LOOP, 0, geom.getCircleBuffer().size_ / 3);
    }

    gl.uniformMatrix4fv(this.uniforms.uMVP, false, geom.getDotMVP());
    ShaderSelection.attributes.aVertex.bindToBuffer(geom.getDotBuffer());
    gl.drawArrays(gl.TRIANGLE_FAN, 0, geom.getDotBuffer().size_ / 3);

    if (drawSym) {
      gl.uniformMatrix4fv(this.uniforms.uMVP, false, geom.getDotSymmetryMVP());
      gl.drawArrays(gl.TRIANGLE_FAN, 0, geom.getDotBuffer().size_ / 3);
    }
  };

  return ShaderSelection;
});