define([
  'render/Shader',
  'render/Buffer'
], function (Shader, Buffer) {

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

    this.vSize_ = 0;
    this.iSize_ = 0;
  }

  Render.prototype = {
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffers: function () {
      var gl = this.gl_;
      this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      this.normalBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      this.colorBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      this.indexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
      this.wireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    },
    /** Free gl memory */
    release: function () {
      this.gl_.deleteTexture(this.reflectionLoc_);
      this.vertexBuffer_.release();
      this.normalBuffer_.release();
      this.colorBuffer_.release();
      this.indexBuffer_.release();
      this.wireframeBuffer_.release();
    },
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
      var mesh = this.multimesh_.getCurrent();
      this.vertexBuffer_.update(mesh.cacheDrawArraysV_);
      this.normalBuffer_.update(mesh.cacheDrawArraysN_);
      if (updateColors)
        this.colorBuffer_.update(mesh.cacheDrawArraysC_);
    },
    /** Updates DrawElements buffers */
    updateDrawElements: function (updateColors, updateIndex) {
      var mesh = this.multimesh_.getCurrent();
      this.vertexBuffer_.update(mesh.verticesXYZ_);
      this.normalBuffer_.update(mesh.normalsXYZ_);
      if (updateColors)
        this.colorBuffer_.update(mesh.colorsRGB_);
      if (updateIndex)
        this.indexBuffer_.update(mesh.indicesABC_);
    },
    /** Updates wireframe buffer */
    updateLinesBuffer: function () {
      var mesh = this.multimesh_.getCurrent();
      var lineBuffer = this.flatShading_ ? mesh.cacheDrawArraysWireframe_ : mesh.cacheDrawElementsWireframe_;
      this.wireframeBuffer_.update(lineBuffer);
    }
  };

  return Render;
});