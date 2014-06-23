define([
  'misc/Utils',
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (Utils, ShaderBase, Attribute) {

  'use strict';

  var glfloat = 0x1406;

  var ShaderUV = {};
  ShaderUV.texPath = 'resources/uv.jpg';

  ShaderUV.uniforms = {};
  ShaderUV.attributes = {};
  ShaderUV.program = undefined;

  ShaderUV.uniformNames = ['uMV', 'uMVP', 'uN', 'uTexture0'];
  [].push.apply(ShaderUV.uniformNames, ShaderBase.uniformNames.picking);

  ShaderUV.vertex = [
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'attribute vec2 aTexCoord;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying vec2 vTexCoord;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vVertex = vec3(uMV * vertex4);',
    '  vColor = aColor;',
    '  vTexCoord = aTexCoord;',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderUV.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    ShaderBase.strings.pickingUniforms,
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vColor;',
    'varying vec2 vTexCoord;',
    ShaderBase.strings.pickingFunction,
    'void main() {',
    '  vec3 fragColor = texture2D(uTexture0, vTexCoord).rgb * vColor;',
    '  fragColor = picking(fragColor);',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderUV.draw = function (render, sculptgl) {
    render.gl_.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, sculptgl);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderUV.getOrCreate = function (gl) {
    return ShaderUV.program ? ShaderUV : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderUV.initAttributes = function (gl) {
    var program = ShaderUV.program;
    var attrs = ShaderUV.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
    attrs.aTexCoord = new Attribute(gl, program, 'aTexCoord', 2, glfloat);
  };
  /** Bind attributes */
  ShaderUV.bindAttributes = function (render) {
    var attrs = ShaderUV.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
    attrs.aTexCoord.bindToBuffer(render.getTexCoordBuffer());
  };
  /** Return or create texture0 */
  ShaderUV.getOrCreateTexture0 = function (gl, sculptgl) {
    if (ShaderUV.texture0)
      return ShaderUV.texture0;
    ShaderUV.texture0 = gl.createTexture();
    var tex = new Image();
    tex.src = ShaderUV.texPath;
    tex.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, ShaderUV.texture0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (Utils.isPowerOfTwo(tex.width) && Utils.isPowerOfTwo(tex.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
      sculptgl.scene_.render();
    };
    return false;
  };
  /** Updates uniforms */
  ShaderUV.updateUniforms = function (render, sculptgl) {
    var gl = render.gl_;
    var uniforms = this.uniforms;
    var mesh = render.getMesh();

    gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
    gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
    gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

    gl.activeTexture(gl.TEXTURE0);
    var tex = this.getOrCreateTexture0(gl, sculptgl);
    if (tex)
      gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(uniforms.uTexture0, 0);

    ShaderBase.updateUniforms.call(this, render, sculptgl);
  };

  return ShaderUV;
});