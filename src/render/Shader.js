define([
  'lib/glMatrix',
  'render/Attribute',
  'render/ShaderConfigs',
  'misc/Utils'
], function (glm, Attribute, ShaderConfigs, Utils) {

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

  Shader.mode = ShaderConfigs.mode;

  Shader.prototype = {
    /** Return the real type of the shader */
    getType: function () {
      return Math.min(this.type_, Shader.mode.MATERIAL);
    },
    /** Return the configuration of the shader */
    getConfig: function () {
      return ShaderConfigs[this.getType()];
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
        var config = aConfig[i];
        attributes[config.name] = new Attribute(gl, program, config);
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
        render.wireframeBuffer_.bind();
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
        render.indexBuffer_.bind();
        gl.drawElements(gl.TRIANGLES, lengthIndexArray, Utils.elementIndexType, 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },
    /** Bind attributes */
    bindAttributes: function (render) {
      var att = this.attributes_;

      var aVertex = att.aVertex;
      if (aVertex !== undefined)
        aVertex.bindToBuffer(render.vertexBuffer_);

      var aNormal = att.aNormal;
      if (aNormal !== undefined)
        aNormal.bindToBuffer(render.normalBuffer_);

      var aColor = att.aColor;
      if (aColor !== undefined)
        aColor.bindToBuffer(render.colorBuffer_);
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