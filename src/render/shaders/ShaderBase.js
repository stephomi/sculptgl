define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var getOptionsURL = require('misc/getOptionsURL');
  var Utils = require('misc/Utils');
  var Attribute = require('render/Attribute');
  var colorSpaceGLSL = require('text!render/shaders/glsl/colorSpace.glsl');
  var curvatureGLSL = require('text!render/shaders/glsl/curvature.glsl');

  var vec3 = glm.vec3;

  var ShaderBase = {};
  ShaderBase.vertexName = 'VertexName';
  ShaderBase.fragmentName = 'FragmentName';

  ShaderBase.activeAttributes = {
    vertex: true,
    normal: true,
    material: true,
    color: true
  };

  ShaderBase.showSymmetryLine = getOptionsURL().mirrorline;
  ShaderBase.darkenUnselected = getOptionsURL().darkenunselected;
  ShaderBase.uniformNames = {};
  ShaderBase.uniformNames.commonUniforms = ['uMV', 'uMVP', 'uN', 'uEM', 'uEN', 'uFlat', 'uPlaneO', 'uPlaneN', 'uSym', 'uCurvature', 'uAlpha', 'uFov', 'uDarken'];

  ShaderBase.strings = {};
  ShaderBase.strings.colorSpaceGLSL = colorSpaceGLSL;
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
    'uniform int uSym;',
    'uniform int uDarken;',
    'uniform float uCurvature;',
    'uniform float uFov;',
    'varying float vMasking;',
    'uniform int uFlat;'
  ].join('\n');
  ShaderBase.strings.fragColorFunction = [
    curvatureGLSL,
    colorSpaceGLSL,
    '#extension GL_OES_standard_derivatives : enable',
    'vec3 getNormal() {',
    '  #ifndef GL_OES_standard_derivatives',
    '    return normalize(gl_FrontFacing ? vNormal : -vNormal);',
    '  #else',
    '    return uFlat == 0 ? normalize(gl_FrontFacing ? vNormal : -vNormal) : -normalize(cross(dFdy(vVertex), dFdx(vVertex)));',
    '  #endif',
    '}',
    'vec4 encodeFragColor(const in vec3 frag, const in float alpha) {',
    '  vec3 col = computeCurvature(vVertex, vNormal, frag, uCurvature, uFov);',
    '  if(uDarken == 1) col *= 0.3;',
    '  col *= (0.3 + 0.7 * vMasking);',
    '  if(uSym == 1 && abs(dot(uPlaneN, vVertex - uPlaneO)) < 0.15)',
    '      col = min(col * 1.5, 1.0);',
    '  return alpha != 1.0 ? vec4(col * alpha, alpha) : encodeRGBM(col);',
    '}'
  ].join('\n');

  var moveExtension = function (str) {
    // move extension enable/require to the top of file
    var matches = str.match(/^\s*(#extension).*/gm);
    if (!matches) return str;
    var extMap = {};
    var exts = '';

    for (var i = 0, nb = matches.length; i < nb; ++i) {
      var ext = matches[i].substr(matches[i].indexOf('#extension'));
      str = str.replace(matches[i], '');
      if (extMap[ext])
        continue;
      extMap[ext] = true;
      exts += ext + '\n';
    }
    str = exts + str;
    return str;
  };

  ShaderBase.getOrCreate = function (gl) {
    if (this.program)
      return this;

    var vname = '\n#define SHADER_NAME ' + this.vertexName + '\n';
    var fname = '\n#define SHADER_NAME ' + this.fragmentName + '\n';

    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, moveExtension(this.vertex + vname));
    gl.compileShader(vShader);

    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, moveExtension(this.fragment + fname));
    gl.compileShader(fShader);

    var program = this.program = gl.createProgram();

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    var logV = gl.getShaderInfoLog(vShader);
    var logF = gl.getShaderInfoLog(fShader);
    var logP = gl.getProgramInfoLog(program);
    if (logV) console.warn(this.vertexName + ' (vertex)\n' + logV);
    if (logF) console.warn(this.fragmentName + ' (fragment)\n' + logF);
    if (logP) console.warn(this.fragmentName + ' (program)\n' + logP);

    this.initAttributes(gl);
    this.initUniforms(gl);

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

      var sels = main.getSelectedMeshes();
      var darken = ShaderBase.darkenUnselected && sels.length !== 0 && sels.indexOf(mesh) === -1;
      var useSym = ShaderBase.showSymmetryLine && (mesh === main.getMesh()) && main.getSculpt().getSymmetry();

      var uniforms = this.uniforms;

      gl.uniformMatrix4fv(uniforms.uEM, false, mesh.getEditMatrix());
      gl.uniformMatrix3fv(uniforms.uEN, false, mesh.getEN());
      gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
      gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
      gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

      gl.uniform1i(uniforms.uDarken, darken ? 1 : 0);
      gl.uniform1i(uniforms.uFlat, mesh.getFlatShading());
      gl.uniform3fv(uniforms.uPlaneO, vec3.transformMat4(tmp, mesh.getSymmetryOrigin(), mesh.getMV()));
      gl.uniform3fv(uniforms.uPlaneN, vec3.normalize(tmp, vec3.transformMat3(tmp, mesh.getSymmetryNormal(), mesh.getN())));
      gl.uniform1i(uniforms.uSym, useSym ? 1 : 0);
      gl.uniform1f(uniforms.uAlpha, mesh.getOpacity());

      gl.uniform1f(uniforms.uCurvature, mesh.getCurvature());
      var cam = main.getCamera();
      gl.uniform1f(uniforms.uFov, cam.isOrthographic() ? -Math.abs(cam._trans[2]) * 25.0 : cam.getFov());
    };
  })();
  ShaderBase.draw = function (render, main) {
    var gl = render.getGL();
    gl.useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);
    this.drawBuffer(render);
  };
  ShaderBase.drawBuffer = function (render) {
    var gl = render.getGL();
    if (render.isUsingDrawArrays()) {
      gl.drawArrays(render.getMode(), 0, render.getCount());
    } else {
      render.getIndexBuffer().bind();
      gl.drawElements(render.getMode(), render.getCount(), gl.UNSIGNED_INT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  };
  ShaderBase.setTextureParameters = function (gl, tex) {
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
  };
  ShaderBase.onLoadTexture0 = function (gl, tex, main) {
    this.texture0 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    ShaderBase.setTextureParameters(gl, tex);
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

  module.exports = ShaderBase;
});