define([
  'lib/glMatrix',
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (glm, ShaderBase, Attribute) {

  'use strict';

  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  var glfloat = 0x1406;

  var ShaderTransparency = {};
  ShaderTransparency.uniforms = {};
  ShaderTransparency.attributes = {};
  ShaderTransparency.program = undefined;

  ShaderTransparency.uniformNames = ['uMV', 'uMVP', 'uN'];
  [].push.apply(ShaderTransparency.uniformNames, ShaderBase.uniformNames.picking);

  ShaderTransparency.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vColor = aColor;',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderTransparency.fragment = [
    'precision mediump float;',
    ShaderBase.strings.pickingUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'const vec3 colorBackface = vec3(0.81, 0.71, 0.23);',
    'const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);',
    'const float shininess = 100.0;',
    ShaderBase.strings.pickingFunction,
    'void main() {',
    '  vec4 color = vec4(vColor, 0.05);',
    '  vec4 specularColor = color * 0.5;',
    '  specularColor.a = color.a * 3.0;',
    '  float specular = max(dot(-vecLight, -reflect(vecLight, vNormal)), 0.0);',
    '  vec4 fragColor = color + specularColor * (specular + pow(specular, shininess));',
    '  picking(fragColor.rgb);',
    '  gl_FragColor = fragColor;',
    '}'
  ].join('\n');

  /** Draw */
  ShaderTransparency.draw = function (render, sculptgl) {
    var gl = render.gl_;
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    ShaderBase.drawBuffer(render);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
  };
  /** Get or create the shader */
  ShaderTransparency.getOrCreate = function (gl) {
    return ShaderTransparency.program ? ShaderTransparency : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderTransparency.initAttributes = function (gl) {
    var program = ShaderTransparency.program;
    var attrs = ShaderTransparency.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
  };
  /** Bind attributes */
  ShaderTransparency.bindAttributes = function (render) {
    var attrs = ShaderTransparency.attributes;
    attrs.aVertex.bindToBuffer(render.vertexBuffer_);
    attrs.aNormal.bindToBuffer(render.normalBuffer_);
    attrs.aColor.bindToBuffer(render.colorBuffer_);
  };
  /** Updates uniforms */
  ShaderTransparency.updateUniforms = function (render, sculptgl) {
    var gl = render.gl_;
    var camera = sculptgl.scene_.getCamera();
    var uniforms = this.uniforms;
    var mvMatrix = mat4.mul(mat4.create(), camera.view_, render.mesh_.getMatrix());

    gl.uniformMatrix4fv(uniforms.uMV, false, mvMatrix);
    gl.uniformMatrix4fv(uniforms.uMVP, false, mat4.mul(mat4.create(), camera.proj_, mvMatrix));
    gl.uniformMatrix3fv(uniforms.uN, false, mat3.normalFromMat4(mat3.create(), mvMatrix));

    ShaderBase.updateUniforms.call(this, render, sculptgl, mvMatrix);
  };

  return ShaderTransparency;
});