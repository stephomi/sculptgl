define([
  'lib/glMatrix',
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (glm, ShaderBase, Attribute) {

  'use strict';

  var mat4 = glm.mat4;

  var glfloat = 0x1406;

  var ShaderNormal = {};
  ShaderNormal.uniforms = {};
  ShaderNormal.attributes = {};
  ShaderNormal.program = undefined;

  ShaderNormal.uniformNames = ['uMV', 'uMVP'];
  [].push.apply(ShaderNormal.uniformNames, ShaderBase.uniformNames.picking);

  ShaderNormal.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'void main() {',
    '  vec4 vert4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(aNormal);',
    '  vVertex = vec3(uMV * vert4);',
    '  gl_Position = uMVP * vert4;',
    '}'
  ].join('\n');

  ShaderNormal.fragment = [
    'precision mediump float;',
    ShaderBase.strings.pickingUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    ShaderBase.strings.pickingFunction,
    'void main() {',
    '  vec3 fragColor = vNormal * 0.5 + 0.5;',
    '  fragColor = picking(fragColor);',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
  ].join('\n');
  /** Draw */
  ShaderNormal.draw = function (render, sculptgl) {
    render.gl_.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
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
  };
  /** Bind attributes */
  ShaderNormal.bindAttributes = function (render) {
    var attrs = ShaderNormal.attributes;
    attrs.aVertex.bindToBuffer(render.vertexBuffer_);
    attrs.aNormal.bindToBuffer(render.normalBuffer_);
  };
  /** Updates uniforms */
  ShaderNormal.updateUniforms = function (render, sculptgl) {
    var gl = render.gl_;
    var camera = sculptgl.scene_.getCamera();
    var uniforms = this.uniforms;
    var mvMatrix = mat4.mul(mat4.create(), camera.view_, render.mesh_.getMatrix());

    gl.uniformMatrix4fv(uniforms.uMV, false, mvMatrix);
    gl.uniformMatrix4fv(uniforms.uMVP, false, mat4.mul(mat4.create(), camera.proj_, mvMatrix));

    ShaderBase.updateUniforms.call(this, render, sculptgl, mvMatrix);
  };

  return ShaderNormal;
});