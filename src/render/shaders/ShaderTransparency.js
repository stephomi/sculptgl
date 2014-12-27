define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderTransparency = {};
  ShaderTransparency.uniforms = {};
  ShaderTransparency.attributes = {};
  ShaderTransparency.program = undefined;

  ShaderTransparency.uniformNames = ['uMV', 'uMVP', 'uN'];
  Array.prototype.push.apply(ShaderTransparency.uniformNames, ShaderBase.uniformNames.symmetryLine);

  ShaderTransparency.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'attribute vec3 aMaterial;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying float vMasking;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vColor = aColor;',
    '  vVertex = vec3(uMV * vertex4);',
    '  vMasking = aMaterial.z;',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderTransparency.fragment = [
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);',
    'const float shininess = 100.0;',
    ShaderBase.strings.fragColorUniforms,
    ShaderBase.strings.fragColorFunction,
    'void main() {',
    '  vec4 color = vec4(vColor, 0.05);',
    '  vec4 specularColor = color * 0.5;',
    '  specularColor.a = color.a * 3.0;',
    '  float specular = max(dot(-vecLight, -reflect(vecLight, vNormal)), 0.0);',
    '  vec4 fragColor = color + specularColor * (specular + pow(specular, shininess));',
    '  gl_FragColor = getFragColor(fragColor);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderTransparency.draw = function (render, main) {
    var gl = render.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);

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
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
  };
  /** Updates uniforms */
  ShaderTransparency.updateUniforms = function (render, main) {
    var gl = render.getGL();
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    ShaderBase.updateUniforms.call(this, render, main);
  };

  return ShaderTransparency;
});