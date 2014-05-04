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

  ShaderWireframe.uniformNames = ['uMVP'];

  ShaderWireframe.vertex = [
    'attribute vec3 aVertex;',
    'uniform mat4 uMVP;',
    'void main()',
    '{',
    '  vec4 pos = uMVP * vec4(aVertex, 1.0);',
    '  pos[3] += 0.0001;',
    '  gl_Position =  pos;',
    '}'
  ].join('\n');

  ShaderWireframe.fragment = [
    'precision mediump float;',
    'void main()',
    '{',
    '  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderWireframe.draw = function (render, sculptgl) {
    var gl = render.gl_;
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
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
  };
  /** Bind attributes */
  ShaderWireframe.bindAttributes = function (render) {
    ShaderWireframe.attributes.aVertex.bindToBuffer(render.getVertexBuffer());
  };
  /** Updates uniforms */
  ShaderWireframe.updateUniforms = function (render /*, sculptgl*/ ) {
    render.gl_.uniformMatrix4fv(this.uniforms.uMVP, false, render.getMesh().getMVP());
  };

  return ShaderWireframe;
});