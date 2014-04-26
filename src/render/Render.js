define([
  'render/Shader',
  'render/Buffer'
], function (Shader, Buffer) {

  'use strict';

  function Render(gl, mesh) {
    this.mesh_ = mesh; //webgl context
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

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    /** Return true if the render is using drawArrays instead of drawElements */
    isUsingDrawArrays: function () {
      return Render.ONLY_DRAW_ARRAYS ? true : this.getFlatShading();
    },
    /** Set show wireframe */
    setShowWireframe: function (showWireframe) {
      this.showWireframe_ = showWireframe;
    },
    /** Return show wireframe */
    getShowWireframe: function () {
      return Render.ONLY_DRAW_ARRAYS ? false : this.showWireframe_;
    },
    /** Set flat shading */
    setFlatShading: function (flatShading) {
      this.flatShading_ = flatShading;
    },
    /** Return flat shading */
    getFlatShading: function () {
      return this.flatShading_;
    },
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
      if (this.getShowWireframe())
        this.shaderWireframe_.draw(this, camera, picking);
    },
    /** Update buffers */
    updateBuffers: function (updateColors, updateIndex) {
      if (this.isUsingDrawArrays())
        this.updateDrawArrays(updateColors);
      else
        this.updateDrawElements(updateColors, updateIndex);
    },
    /** Updates DrawArrays buffers */
    updateDrawArrays: function (updateColors) {
      var mesh = this.mesh_;
      this.vertexBuffer_.update(mesh.getCacheDrawArraysV());
      this.normalBuffer_.update(mesh.getCacheDrawArraysN());
      if (updateColors)
        this.colorBuffer_.update(mesh.getCacheDrawArraysC());
    },
    /** Updates DrawElements buffers */
    updateDrawElements: function (updateColors, updateIndex) {
      var mesh = this.mesh_;
      this.vertexBuffer_.update(mesh.getVertices());
      this.normalBuffer_.update(mesh.getNormals());
      if (updateColors)
        this.colorBuffer_.update(mesh.getColors());
      if (updateIndex)
        this.indexBuffer_.update(mesh.getIndices());
    },
    /** Updates wireframe buffer */
    updateLinesBuffer: function () {
      var mesh = this.mesh_;
      var lineBuffer = this.isUsingDrawArrays() ? mesh.getCacheDrawArraysWireframe() : mesh.getCacheDrawElementsWireframe();
      this.wireframeBuffer_.update(lineBuffer);
    }
  };

  return Render;
});