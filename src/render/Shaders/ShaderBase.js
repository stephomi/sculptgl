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
    'void picking(inout vec3 frag) {',
    '  vec3 vecDistance = vVertex - uInter;',
    '  float dotSquared = dot(vecDistance, vecDistance);',
    '  if(dotSquared < uRadius2 * 1.06 && dotSquared > uRadius2 * 0.94)',
    '    frag *= 0.5;',
    '  if(uScale > 0.0) {',
    '    vecDistance = vVertex - uInterSym;',
    '    dotSquared = dot(vecDistance, vecDistance);',
    '    if(dotSquared < uRadius2 * 1.06 && dotSquared > uRadius2 * 0.94)',
    '      frag *= 0.5;',
    '    if(abs(dot(uPlaneN, vVertex - uPlaneO)) < 0.15 / uScale) {',
    '      frag = min(frag * 1.3, 1.0);',
    '    }',
    '  }',
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
  ShaderBase.updateUniforms = function (render, sculptgl, mvMatrix) {
    var gl = render.gl_;
    var scene = sculptgl.scene_;
    var picking = scene.getPicking();
    var pickingSym = scene.getSymmetryPicking();
    var mesh = render.mesh_;
    var useSym = (mesh === sculptgl.mesh_) && sculptgl.sculpt_.getSymmetry();

    var uniforms = this.uniforms;
    gl.uniform3fv(uniforms.uInter, vec3.transformMat4([0.0, 0.0, 0.0], picking.getIntersectionPoint(), mvMatrix));
    gl.uniform3fv(uniforms.uInterSym, vec3.transformMat4([0.0, 0.0, 0.0], pickingSym.getIntersectionPoint(), mvMatrix));
    gl.uniform3fv(uniforms.uPlaneO, vec3.transformMat4([0.0, 0.0, 0.0], mesh.getCenter(), mvMatrix));
    var nMat = mat3.normalFromMat4(mat3.create(), mvMatrix);
    gl.uniform3fv(uniforms.uPlaneN, vec3.transformMat3([0.0, 0.0, 0.0], mesh.getSymmetryNormal(), nMat));
    gl.uniform1f(uniforms.uScale, useSym ? mesh.getScale() : -1.0);
    gl.uniform1f(uniforms.uRadius2, picking.mesh_ ? picking.getWorldRadius2() : -1.0);
  };
  /** Draw buffer */
  ShaderBase.drawBuffer = function (render) {
    var lengthIndexArray = render.mesh_.getNbTriangles() * 3;
    var gl = render.gl_;
    if (render.isUsingDrawArrays())
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
    else {
      render.indexBuffer_.bind();
      gl.drawElements(gl.TRIANGLES, lengthIndexArray, gl.UNSIGNED_INT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  };

  return ShaderBase;
});