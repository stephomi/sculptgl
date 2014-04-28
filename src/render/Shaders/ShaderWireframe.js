define([
  'lib/glMatrix',
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (glm, ShaderBase, Attribute) {

  'use strict';

  var mat4 = glm.mat4;

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
    render.wireframeBuffer_.bind();
    gl.enable(gl.BLEND);
    gl.drawElements(gl.LINES, render.mesh_.getNbEdges() * 2, gl.UNSIGNED_INT, 0);
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
    ShaderWireframe.attributes.aVertex.bindToBuffer(render.vertexBuffer_);
  };
  /** Updates uniforms */
  ShaderWireframe.updateUniforms = function (render, sculptgl) {
    var camera = sculptgl.scene_.getCamera();
    var mvMatrix = mat4.mul(mat4.create(), camera.view_, render.mesh_.getMatrix());
    render.gl_.uniformMatrix4fv(this.uniforms.uMVP, false, mat4.mul(mat4.create(), camera.proj_, mvMatrix));
  };

  return ShaderWireframe;
});