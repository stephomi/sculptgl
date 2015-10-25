define(function (require, exports, module) {

  'use strict';

  var ShaderBase = require('render/shaders/ShaderBase');

  var ShaderWireframe = ShaderBase.getCopy();
  ShaderWireframe.vertexName = ShaderWireframe.fragmentName = 'Wireframe';

  ShaderWireframe.uniforms = {};
  ShaderWireframe.attributes = {};
  ShaderWireframe.activeAttributes = {
    vertex: true,
    material: true
  };

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
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.4);',
    '}'
  ].join('\n');

  ShaderWireframe.getOrCreate = ShaderBase.getOrCreate;
  ShaderWireframe.draw = function (render /*, main*/ ) {
    var gl = render.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render);
    render.getWireframeBuffer().bind();

    gl.drawElements(gl.LINES, render.getMesh().getRenderNbEdges() * 2, gl.UNSIGNED_INT, 0);
  };
  ShaderWireframe.updateUniforms = function (render) {
    render.getGL().uniformMatrix4fv(this.uniforms.uMVP, false, render.getMesh().getMVP());
    render.getGL().uniformMatrix4fv(this.uniforms.uEM, false, render.getMesh().getEditMatrix());
  };

  module.exports = ShaderWireframe;
});