define([
  'render/Shader'
], function (Shader) {

  'use strict';

  function Render(gl, mesh) {
    this.multimesh_ = mesh; //webgl context
    this.gl_ = gl; //webgl context

    this.shader_ = new Shader(gl); //the program shader for the mesh
    this.shaderWireframe_ = new Shader(gl); //the program shader for the wireframe

    this.flatShading_ = false; //use of drawArrays vs drawElements
    this.showWireframe_ = true; //show wireframe

    this.vertexBuffer_ = null; //vertices buffer
    this.normalBuffer_ = null; //normals buffer
    this.colorBuffer_ = null; //colors buffer
    this.indexBuffer_ = null; //indexes buffer
    this.wireframeBuffer_ = null; //wireframe buffer
    this.reflectionLoc_ = null; //texture reflection
  }

  Render.prototype = {
    /** Creates the wireframe shader */
    initShaderWireframe: function (shaders) {
      this.shaderWireframe_.type_ = Shader.mode.WIREFRAME;
      this.shaderWireframe_.init(shaders);
    },
    /** Update the shaders on the mesh, load the texture(s) first if the shaders need it */
    updateShaders: function (shaderType, textures, shaders) {
      if (shaderType >= Shader.mode.MATERIAL)
        this.reflectionLoc_ = textures[shaderType];
      this.shader_.type_ = shaderType;
      this.shader_.init(shaders);
    },
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffers: function () {
      var gl = this.gl_;
      this.vertexBuffer_ = gl.createBuffer();
      this.normalBuffer_ = gl.createBuffer();
      this.colorBuffer_ = gl.createBuffer();
      this.indexBuffer_ = gl.createBuffer();
      this.wireframeBuffer_ = gl.createBuffer();
    },
    /** Render the mesh */
    render: function (camera, picking) {
      this.shader_.draw(this, camera, picking);
      if (this.showWireframe_ === true)
        this.shaderWireframe_.draw(this, camera, picking);
    },
    /** Update buffers */
    updateBuffers: function (updateColors, updateIndex) {
      if (this.flatShading_ === true)
        this.updateDrawArrays(updateColors);
      else
        this.updateDrawElements(updateColors, updateIndex);
    },
    /** Updates DrawArrays buffers */
    updateDrawArrays: function (updateColors) {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysV_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysN_, gl.DYNAMIC_DRAW);

      if (updateColors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysC_, gl.DYNAMIC_DRAW);
      }
    },
    /** Updates DrawElements buffers */
    updateDrawElements: function (updateColors, updateIndex) {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.verticesXYZ_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normalsXYZ_, gl.DYNAMIC_DRAW);

      if (updateColors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.colorsRGB_, gl.DYNAMIC_DRAW);
      }

      if (updateIndex) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indicesABC_, gl.STATIC_DRAW);
      }
    },
    /** Updates wireframe buffer */
    updateLinesBuffer: function () {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();
      var lineBuffer = this.flatShading_ ? mesh.cacheDrawArraysWireframe_ : mesh.cacheDrawElementsWireframe_;

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer_);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineBuffer, gl.STATIC_DRAW);
    }
  };

  return Render;
});