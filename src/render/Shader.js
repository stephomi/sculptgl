define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  function Shader(gl) {
    this.gl_ = gl; //webgl context
    this.type_ = Shader.mode.MATERIAL; //type of shader

    this.program_ = null; //program shader
    this.fragmentShader_ = null; //fragment shader
    this.vertexShader_ = null; //fragment shader

    this.attributes_ = {}; //attributes
    this.uniforms_ = {}; //uniforms
  }

  //the rendering mode
  Shader.mode = {
    PHONG: 0,
    TRANSPARENCY: 1,
    WIREFRAME: 2,
    NORMAL: 3,
    MATERIAL: 4
  };

  var ShaderConfig = {};
  ShaderConfig[Shader.mode.PHONG] = {
    vertex: 'phongVertex',
    fragment: 'phongFragment',
    attributes: ['aVertex', 'aNormal', 'aColor'],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[Shader.mode.WIREFRAME] = {
    vertex: 'wireframeVertex',
    fragment: 'wireframeFragment',
    attributes: ['aVertex'],
    uniforms: ['uMVP']
  };
  ShaderConfig[Shader.mode.TRANSPARENCY] = {
    vertex: 'transparencyVertex',
    fragment: 'transparencyFragment',
    attributes: ['aVertex', 'aNormal', 'aColor'],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[Shader.mode.NORMAL] = {
    vertex: 'normalVertex',
    fragment: 'normalFragment',
    attributes: ['aVertex', 'aNormal'],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[Shader.mode.MATERIAL] = {
    vertex: 'reflectionVertex',
    fragment: 'reflectionFragment',
    attributes: ['aVertex', 'aNormal', 'aColor'],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared', 'uTexture0']
  };

  Shader.prototype = {
    getType: function () {
      return Math.min(this.type_, Shader.mode.MATERIAL);
    },
    getConfig: function () {
      return ShaderConfig[this.getType()];
    },
    /** Initialize the shaders on the mesh */
    init: function (shaders) {
      var gl = this.gl_;

      this.loadShaders(shaders);

      if (this.program_) gl.deleteProgram(this.program_);
      this.program_ = gl.createProgram();
      var program = this.program_;

      gl.attachShader(program, this.vertexShader_);
      gl.attachShader(program, this.fragmentShader_);
      gl.linkProgram(program);
      gl.useProgram(program);

      this.initAttributes();
      this.initUniforms();

      gl.detachShader(program, this.fragmentShader_);
      gl.deleteShader(this.fragmentShader_);
      gl.detachShader(program, this.vertexShader_);
      gl.deleteShader(this.vertexShader_);
    },
    /** Load vertex and fragment shaders */
    loadShaders: function (shaders) {
      var gl = this.gl_;
      var config = this.getConfig();
      this.vertexShader_ = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(this.vertexShader_, shaders[config.vertex]);
      gl.compileShader(this.vertexShader_);
      this.fragmentShader_ = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(this.fragmentShader_, shaders[config.fragment]);
      gl.compileShader(this.fragmentShader_);
    },
    /** Initialize attributes */
    initAttributes: function () {
      var gl = this.gl_;
      var program = this.program_;
      var aConfig = this.getConfig().attributes;
      var attributes = this.attributes_ = {};
      for (var i = 0, l = aConfig.length; i < l; ++i) {
        var name = aConfig[i];
        attributes[name] = gl.getAttribLocation(program, name);
      }
    },
    /** Initialize uniforms */
    initUniforms: function () {
      var gl = this.gl_;
      var program = this.program_;
      var uConfig = this.getConfig().uniforms;
      var uniforms = this.uniforms_ = {};
      for (var i = 0, l = uConfig.length; i < l; ++i) {
        var name = uConfig[i];
        uniforms[name] = gl.getUniformLocation(program, name);
      }
    },
    /** Draw */
    draw: function (render, camera, picking) {
      var gl = this.gl_;
      gl.useProgram(this.program_);
      this.bindAttributes(render);
      this.updateUniforms(render, camera, picking);
      var type = this.getType();
      if (type === Shader.mode.TRANSPARENCY) {
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        this.drawBuffer(render);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      } else if (type === Shader.mode.WIREFRAME) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, render.wireframeBuffer_);
        gl.enable(gl.BLEND);
        gl.drawElements(gl.LINES, render.multimesh_.getCurrent().getNbEdges() * 2, Utils.elementIndexType, 0);
        gl.disable(gl.BLEND);
      } else {
        this.drawBuffer(render);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },
    /** Draw buffer */
    drawBuffer: function (render) {
      var lengthIndexArray = render.multimesh_.getCurrent().getNbTriangles() * 3;
      var gl = this.gl_;
      if (render.flatShading_ === true)
        gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
      else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, render.indexBuffer_);
        gl.drawElements(gl.TRIANGLES, lengthIndexArray, Utils.elementIndexType, 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },
    /** Bind attributes */
    bindAttributes: function (render) {
      var gl = this.gl_;
      var att = this.attributes_;

      var aVertex = att.aVertex;
      if (aVertex !== undefined) {
        gl.enableVertexAttribArray(aVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, render.vertexBuffer_);
        gl.vertexAttribPointer(aVertex, 3, gl.FLOAT, false, 0, 0);
      }
      var aNormal = att.aNormal;
      if (aNormal !== undefined) {
        gl.enableVertexAttribArray(aNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, render.normalBuffer_);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
      }
      var aColor = att.aColor;
      if (aColor !== undefined) {
        gl.enableVertexAttribArray(aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, render.colorBuffer_);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
      }
    },
    /** Updates uniforms */
    updateUniforms: function (render, camera, picking) {
      var gl = this.gl_;
      var uniforms = this.uniforms_;
      var mMatrix = render.multimesh_.getMatrix();
      var mvMatrix;

      var unif = uniforms.uMV;
      if (unif) {
        mvMatrix = mat4.mul(mat4.create(), camera.view_, mMatrix);
        gl.uniformMatrix4fv(unif, false, mvMatrix);
      }
      unif = uniforms.uMVP;
      if (unif) {
        mvMatrix = mvMatrix ? mvMatrix : mat4.mul(mat4.create(), camera.view_, mMatrix);
        gl.uniformMatrix4fv(unif, false, mat4.mul(mat4.create(), camera.proj_, mvMatrix));
      }
      unif = uniforms.uN;
      if (unif) {
        mvMatrix = mvMatrix ? mvMatrix : mat4.mul(mat4.create(), camera.view_, mMatrix);
        gl.uniformMatrix3fv(unif, false, mat3.normalFromMat4(mat3.create(), mvMatrix));
      }
      unif = uniforms.uCenterPicking;
      if (unif) {
        mvMatrix = mvMatrix ? mvMatrix : mat4.mul(mat4.create(), camera.view_, mMatrix);
        gl.uniform3fv(unif, vec3.transformMat4([0.0, 0.0, 0.0], picking.interPoint_, mvMatrix));
      }
      unif = uniforms.uRadiusSquared;
      if (unif) {
        gl.uniform1f(unif, picking.rWorldSqr_);
      }
      unif = uniforms.uTexture0;
      if (unif) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, render.reflectionLoc_);
        gl.uniform1i(unif, 0);
      }
    }
  };

  return Shader;
});