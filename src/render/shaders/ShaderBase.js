define([
  'lib/glMatrix',
  'misc/Utils',
  'render/Attribute',
  'text!render/shaders/glsl/colorSpace.glsl'
], function (glm, Utils, Attribute, colorSpace) {

  'use strict';

  var vec3 = glm.vec3;

  var ShaderBase = {};
  ShaderBase.activeAttributes = {
    vertex: true,
    normal: true,
    material: true,
    color: true
  };

  ShaderBase.SHOW_SYMMETRY_LINE = false;
  ShaderBase.uniformNames = {};
  ShaderBase.uniformNames.commonUniforms = ['uMV', 'uMVP', 'uN', 'uEM', 'uEN', 'uPlaneO', 'uPlaneN', 'uScale', 'uAlpha'];

  ShaderBase.strings = {};
  ShaderBase.strings.colorSpaceGLSL = colorSpace;
  ShaderBase.strings.vertUniforms = [
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'uniform mat4 uEM;',
    'uniform mat3 uEN;',
    'uniform float uAlpha;'
  ].join('\n');
  ShaderBase.strings.fragColorUniforms = [
    'uniform vec3 uPlaneN;',
    'uniform vec3 uPlaneO;',
    'uniform float uScale;',
    'varying float vMasking;'
  ].join('\n');
  ShaderBase.strings.fragColorFunction = [
    'vec3 applyMaskAndSym(const in vec3 frag) {',
    '  vec3 col = frag * (0.3 + 0.7 * vMasking);',
    '  if(uScale > 0.0 && abs(dot(uPlaneN, vVertex - uPlaneO)) < 0.15 / uScale)',
    '      return min(col * 1.5, 1.0);',
    '  return col;',
    '}'
  ].join('\n');

  ShaderBase.getOrCreate = function (gl) {
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, this.vertex);
    gl.compileShader(vShader);

    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, this.fragment);
    gl.compileShader(fShader);

    var program = this.program = gl.createProgram();

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    this.initAttributes(gl);
    // this.initUniforms(gl);
    ShaderBase.initUniforms.call(this, gl);

    // no clean up for quick webgl inspector debugging
    // gl.detachShader(program, fShader);
    // gl.deleteShader(fShader);
    // gl.detachShader(program, vShader);
    // gl.deleteShader(vShader);
    return this;
  };
  ShaderBase.initUniforms = function (gl) {
    var program = this.program;
    var unifNames = this.uniformNames;
    var unifs = this.uniforms;
    for (var i = 0, l = unifNames.length; i < l; ++i) {
      var name = unifNames[i];
      unifs[name] = gl.getUniformLocation(program, name);
    }
  };
  ShaderBase.updateUniforms = (function () {
    var tmp = [0.0, 0.0, 0.0];
    return function (render, main) {
      var gl = render.getGL();
      var mesh = render.getMesh();
      var useSym = ShaderBase.SHOW_SYMMETRY_LINE && (mesh === main.getMesh()) && main.getSculpt().getSymmetry();

      var uniforms = this.uniforms;

      gl.uniformMatrix4fv(uniforms.uEM, false, mesh.getEditMatrix());
      gl.uniformMatrix3fv(uniforms.uEN, false, mesh.getEN());
      gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
      gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
      gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

      gl.uniform3fv(uniforms.uPlaneO, vec3.transformMat4(tmp, mesh.getSymmetryOrigin(), mesh.getMV()));
      gl.uniform3fv(uniforms.uPlaneN, vec3.transformMat3(tmp, mesh.getSymmetryNormal(), mesh.getN()));
      gl.uniform1f(uniforms.uScale, useSym ? mesh.getScale() : -1.0);
      gl.uniform1f(uniforms.uAlpha, mesh.getOpacity());
    };
  })();
  ShaderBase.draw = function (render, main) {
    var gl = render.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);

    var isTR = render.getMesh().isTransparent();
    if (isTR) {
      gl.depthMask(false);
      gl.enable(gl.BLEND);
    }
    this.drawBuffer(render);
    if (isTR) {
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
  };
  ShaderBase.drawBuffer = function (render) {
    var lengthIndexArray = render.getMesh().getRenderNbTriangles() * 3;
    var gl = render.getGL();
    if (render.isUsingDrawArrays())
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
    else {
      render.getIndexBuffer().bind();
      gl.drawElements(gl.TRIANGLES, lengthIndexArray, gl.UNSIGNED_INT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  };
  ShaderBase.onLoadTexture0 = function (gl, tex, main) {
    this.texture0 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture0);
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
    if (main)
      main.render();
  };
  ShaderBase.getOrCreateTexture0 = function (gl, texPath, main) {
    if (this.texture0 !== undefined)
      return this.texture0;
    this.texture0 = null; // trigger loading
    var tex = new Image();
    tex.src = texPath;
    tex.onload = this.onLoadTexture0.bind(this, gl, tex, main);
    return false;
  };
  ShaderBase.initAttributes = function (gl) {
    var program = this.program;
    var attrs = this.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, gl.FLOAT);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, gl.FLOAT);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, gl.FLOAT);
    attrs.aMaterial = new Attribute(gl, program, 'aMaterial', 3, gl.FLOAT);
  };
  ShaderBase.bindAttributes = function (render) {
    var attrs = this.attributes;
    var active = this.activeAttributes;
    if (active.vertex) attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    if (active.normal) attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    if (active.color) attrs.aColor.bindToBuffer(render.getColorBuffer());
    if (active.material) attrs.aMaterial.bindToBuffer(render.getMaterialBuffer());
  };

  ShaderBase.getCopy = function () {
    var keys = Object.keys(ShaderBase);
    var obj = {};
    for (var i = 0, nb = keys.length; i < nb; ++i)
      obj[keys[i]] = this[keys[i]];
    obj.program = null;
    return obj;
  };

  return ShaderBase;
});