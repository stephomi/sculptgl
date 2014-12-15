define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderSelection = {};
  ShaderSelection.uniforms = {};
  ShaderSelection.attributes = {};
  ShaderSelection.program = undefined;

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

  /** Draw */
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
  /** Get or create the shader */
  ShaderSelection.getOrCreate = function (gl) {
    return ShaderSelection.program ? ShaderSelection : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderSelection.initAttributes = function (gl) {
    ShaderSelection.attributes.aVertex = new Attribute(gl, ShaderSelection.program, 'aVertex', 3, glfloat);
  };

  return ShaderSelection;
});