define([
  'render/Shader',
  'render/Buffer'
], function (Shader, Buffer) {

  'use strict';

  function Render(gl, mesh) {
    this.mesh_ = mesh; // webgl context
    this.gl_ = gl; // webgl context

    this.shader_ = new Shader(gl); // the program shader for the mesh
    this.shaderWireframe_ = new Shader(gl); // the program shader for the wireframe

    this.flatShading_ = false; // use of drawArrays vs drawElements
    this.showWireframe_ = true; // show wireframe

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); // vertices buffer
    this.normalBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); // normals buffer
    this.colorBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); // colors buffer
    this.indexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // indexes buffer
    this.wireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // wireframe buffer
    this.reflectionLoc_ = null; // texture reflection
  }

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    /** Return true if the render is using drawArrays instead of drawElements */
    isUsingDrawArrays: function () {
      return Render.ONLY_DRAW_ARRAYS ? true : this.getFlatShading();
    },
    isTransparent: function () {
      return this.shader_.type_ === Shader.mode.TRANSPARENCY;
    },
    /** Return flat shading */
    getFlatShading: function () {
      return this.flatShading_;
    },
    /** Return show wireframe */
    getShowWireframe: function () {
      return this.showWireframe_;
    },
    /** Set show wireframe */
    setShowWireframe: function (showWireframe) {
      this.showWireframe_ = Render.ONLY_DRAW_ARRAYS ? false : showWireframe;
      this.updateWireframe();
      this.updateWireframeBuffer();
    },
    /** Set flat shading */
    setFlatShading: function (flatShading) {
      this.flatShading_ = flatShading;
      this.updateFlatShading();
      this.updateWireframe();
      this.updateBuffers(true, true, true);
    },
    /** Update flat shading buffers */
    updateFlatShading: function (iTris) {
      if (this.isUsingDrawArrays())
        this.mesh_.updateDrawArrays(this.getFlatShading(), iTris);
    },
    /** Update wireframe buffers */
    updateWireframe: function () {
      if (this.getShowWireframe())
        this.mesh_.updateWireframe(this.isUsingDrawArrays());
    },
    /** Initialize rendering */
    initRender: function () {
      this.initShaderWireframe();
      this.updateShaders(this.shader_.type_);
      this.setShowWireframe(this.getShowWireframe());
      this.setFlatShading(this.getFlatShading());
    },
    /** Creates the wireframe shader */
    initShaderWireframe: function () {
      this.shaderWireframe_.type_ = Shader.mode.WIREFRAME;
      this.shaderWireframe_.init();
    },
    /** Render the mesh */
    render: function (sculptgl) {
      this.shader_.draw(this, sculptgl);
      if (this.getShowWireframe())
        this.shaderWireframe_.draw(this, sculptgl);
    },
    /** Update the shaders on the mesh, load the texture(s) first if the shaders need it */
    updateShaders: function (shaderType) {
      if (shaderType >= Shader.mode.MATCAP)
        this.reflectionLoc_ = Shader.textures[shaderType];
      this.shader_.type_ = shaderType;
      this.shader_.init();
    },
    /** Update buffers */
    updateBuffers: function (updateColors, updateIndex, updateWireframe) {
      var mesh = this.mesh_;
      var useDrawArrays = this.isUsingDrawArrays();
      this.vertexBuffer_.update(mesh.getRenderVertices(useDrawArrays));
      this.normalBuffer_.update(mesh.getRenderNormals(useDrawArrays));
      if (updateColors)
        this.colorBuffer_.update(mesh.getRenderColors(useDrawArrays));
      if (updateIndex && !useDrawArrays)
        this.indexBuffer_.update(mesh.getIndices());
      if (updateWireframe)
        this.updateWireframeBuffer();
    },
    /** Updates wireframe buffer */
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.wireframeBuffer_.update(this.mesh_.getWireframe(this.isUsingDrawArrays()));
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
  };

  return Render;
});