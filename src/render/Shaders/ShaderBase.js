define([
  'lib/glMatrix',
], function (glm) {

  'use strict';

  var vec3 = glm.vec3;
  var mat3 = glm.mat3;

  var ShaderBase = {};

  ShaderBase.uniformNames = {};
  ShaderBase.uniformNames.picking = ['uInter', 'uInterSym', 'uPlaneO', 'uPlaneN', 'uScale', 'uRadius2'];

  ShaderBase.strings = {};
  ShaderBase.strings.pickingUniforms = [
    'uniform vec3 uInter;',
    'uniform vec3 uInterSym;',
    'uniform vec3 uPlaneN;',
    'uniform vec3 uPlaneO;',
    'uniform float uRadius2;',
    'uniform float uScale;'
  ].join('\n');
  ShaderBase.strings.pickingFunction = [
    'bool isInsideSphere(vec3 vTest, vec3 sphCenter) {',
    '  vec3 vecDistance = vTest - sphCenter;',
    '  float distSq = dot(vecDistance, vecDistance);',
    '  return uRadius2 < 0.0 ? distSq < -uRadius2 : distSq < uRadius2 * 1.06 && distSq > uRadius2 * 0.94;',
    '}',
    'vec3 picking(vec3 frag) {',
    '  if(isInsideSphere(vVertex, uInter))',
    '    frag *= 0.5;',
    '  if(uScale > 0.0) {',
    '    if(isInsideSphere(vVertex, uInterSym))',
    '      frag *= 0.5;',
    '    if(abs(dot(uPlaneN, vVertex - uPlaneO)) < 0.15 / uScale) {',
    '      frag = min(frag * 1.3, 1.0);',
    '    }',
    '  }',
    '  return frag;',
    '}'
  ].join('\n');

  /** Get or create Shaders */
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
    ShaderBase.initUniforms.call(this, gl);

    gl.detachShader(program, fShader);
    gl.deleteShader(fShader);
    gl.detachShader(program, vShader);
    gl.deleteShader(vShader);
    return this;
  };
  /** Initialize uniforms */
  ShaderBase.initUniforms = function (gl) {
    var program = this.program;
    var unifNames = this.uniformNames;
    var unifs = this.uniforms;
    for (var i = 0, l = unifNames.length; i < l; ++i) {
      var name = unifNames[i];
      unifs[name] = gl.getUniformLocation(program, name);
    }
  };
  /** Updates uniforms */
  ShaderBase.updateUniforms = (function () {
    var tmp = [0.0, 0.0, 0.0];
    return function (render, sculptgl) {
      var gl = render.gl_;
      var scene = sculptgl.scene_;
      var picking = scene.getPicking();
      var pickingSym = scene.getSymmetryPicking();
      var mesh = render.getMesh();
      var mvMatrix = mesh.getMV();
      var useSym = (mesh === sculptgl.mesh_) && sculptgl.sculpt_.getSymmetry();

      var uniforms = this.uniforms;
      gl.uniform3fv(uniforms.uInter, vec3.transformMat4(tmp, picking.getIntersectionPoint(), mvMatrix));
      gl.uniform3fv(uniforms.uInterSym, vec3.transformMat4(tmp, pickingSym.getIntersectionPoint(), mvMatrix));
      gl.uniform3fv(uniforms.uPlaneO, vec3.transformMat4(tmp, mesh.getCenter(), mvMatrix));
      var nMat = mat3.normalFromMat4(mat3.create(), mvMatrix);
      gl.uniform3fv(uniforms.uPlaneN, vec3.transformMat3(tmp, mesh.getSymmetryNormal(), nMat));
      gl.uniform1f(uniforms.uScale, useSym ? mesh.getScale() : -1.0);
      if (sculptgl.mouseButton_ !== 0)
        gl.uniform1f(uniforms.uRadius2, picking.mesh_ ? -0.05 : 0.0);
      else
        gl.uniform1f(uniforms.uRadius2, picking.mesh_ ? picking.getWorldRadius2() : 0.0);
    };
  })();
  /** Draw buffer */
  ShaderBase.drawBuffer = function (render) {
    var lengthIndexArray = render.getMesh().getRenderNbTriangles() * 3;
    var gl = render.gl_;
    if (render.isUsingDrawArrays())
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
    else {
      render.getIndexBuffer().bind();
      gl.drawElements(gl.TRIANGLES, lengthIndexArray, gl.UNSIGNED_INT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  };

  return ShaderBase;
});