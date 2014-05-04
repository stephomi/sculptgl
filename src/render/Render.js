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
    this.indexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // indices buffer
    this.wireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // wireframe buffer
    this.texture0_ = null; // a texture
  }

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    /** Return webgl context */
    getGL: function () {
      return this.gl_;
    },
    /** Return the mesh */
    getMesh: function () {
      return this.mesh_;
    },
    /** Return vertex buffer */
    getVertexBuffer: function () {
      return this.vertexBuffer_;
    },
    /** Return normal buffer */
    getNormalBuffer: function () {
      return this.normalBuffer_;
    },
    /** Return color buffer */
    getColorBuffer: function () {
      return this.colorBuffer_;
    },
    /** Return index buffer */
    getIndexBuffer: function () {
      return this.indexBuffer_;
    },
    /** Return wireframe buffer */
    getWireframeBuffer: function () {
      return this.wireframeBuffer_;
    },
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
    /** Return texture 0 */
    getTexture0: function () {
      return this.texture0_;
    },
    /** Set texture 0 */
    setTexture0: function (tex) {
      this.texture0_ = tex;
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
        this.setTexture0(Shader.textures[shaderType]);
      this.shader_.type_ = shaderType;
      this.shader_.init();
    },
    /** Update buffers */
    updateBuffers: function (updateColors, updateIndex, updateWireframe) {
      var mesh = this.mesh_;
      var useDrawArrays = this.isUsingDrawArrays();
      this.getVertexBuffer().update(mesh.getRenderVertices(useDrawArrays));
      this.getNormalBuffer().update(mesh.getRenderNormals(useDrawArrays));
      if (updateColors)
        this.getColorBuffer().update(mesh.getRenderColors(useDrawArrays));
      if (updateIndex && !useDrawArrays)
        this.getIndexBuffer().update(mesh.getRenderIndices());
      if (updateWireframe)
        this.updateWireframeBuffer();
    },
    /** Updates wireframe buffer */
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.getWireframeBuffer().update(this.mesh_.getWireframe(this.isUsingDrawArrays()));
    },
    /** Free gl memory */
    release: function () {
      if (this.getTexture0())
        this.gl_.deleteTexture(this.getTexture0());
      this.getVertexBuffer().release();
      this.getNormalBuffer().release();
      this.getColorBuffer().release();
      this.getIndexBuffer().release();
      this.getWireframeBuffer().release();
    },
  };

  return Render;
});