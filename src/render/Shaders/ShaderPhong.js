define([
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderPhong = {};
  ShaderPhong.uniforms = {};
  ShaderPhong.attributes = {};
  ShaderPhong.program = undefined;

  ShaderPhong.uniformNames = ['uMV', 'uMVP', 'uN'];
  [].push.apply(ShaderPhong.uniformNames, ShaderBase.uniformNames.picking);

  ShaderPhong.vertex = [
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

  ShaderPhong.fragment = [
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
    '  vec3 normal;',
    '  vec3 fragColor;',
    '  if(gl_FrontFacing) {',
    '    normal = vNormal;',
    '    fragColor = vColor;',
    '  } else {',
    '    normal = -vNormal;',
    '    fragColor = colorBackface;',
    '  }',
    '  float dotLN = dot(normal, vecLight);',
    '  vec3 vecR = normalize(2.0 * dotLN * normal - vecLight);',
    '  float dotRVpow = pow(dot(vecR, vecLight), shininess);',
    '  vec3 ambiant = fragColor * 0.5;',
    '  vec3 diffuse = fragColor * 0.5 * max(0.0, dotLN);',
    '  vec3 specular = fragColor * 0.8 * max(0.0, dotRVpow);',
    '  fragColor = ambiant + diffuse + specular;',
    '  fragColor = picking(fragColor);',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderPhong.draw = function (render, sculptgl) {
    render.gl_.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderPhong.getOrCreate = function (gl) {
    return ShaderPhong.program ? ShaderPhong : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderPhong.initAttributes = function (gl) {
    var program = ShaderPhong.program;
    var attrs = ShaderPhong.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
  };
  /** Bind attributes */
  ShaderPhong.bindAttributes = function (render) {
    var attrs = ShaderPhong.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
  };
  /** Updates uniforms */
  ShaderPhong.updateUniforms = function (render, sculptgl) {
    var gl = render.gl_;
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    ShaderBase.updateUniforms.call(this, render, sculptgl);
  };

  return ShaderPhong;
});