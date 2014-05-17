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
    this.material_ = 0; // the chosen material index (texture)
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
    setMaterial: function (idMat) {
      this.material_ = idMat;
      this.setTexture0(Shader.textures[idMat]);
    },
    /** Set show wireframe */
    setShowWireframe: function (showWireframe) {
      this.showWireframe_ = Render.ONLY_DRAW_ARRAYS ? false : showWireframe;
      this.updateWireframeBuffer();
    },
    /** Set flat shading */
    setFlatShading: function (flatShading) {
      this.flatShading_ = flatShading;
      this.updateFlatShading();
      this.updateBuffers();
    },
    /** Set the shader */
    setShader: function (shaderType) {
      this.shader_.setType(shaderType);
    },
    /** Update flat shading buffers */
    updateFlatShading: function (iFaces) {
      if (this.isUsingDrawArrays())
        this.mesh_.updateDrawArrays(this.getFlatShading(), iFaces);
    },
    /** Initialize rendering */
    initRender: function () {
      this.shaderWireframe_.setType(Shader.mode.WIREFRAME);
      if (this.shader_.type_ === Shader.mode.MATCAP && !this.texture0_)
        this.setMaterial(0);
      this.setShader(this.shader_.type_);
      this.setShowWireframe(this.getShowWireframe());
      this.updateBuffers();
    },
    /** Render the mesh */
    render: function (sculptgl) {
      this.shader_.draw(this, sculptgl);
      if (this.getShowWireframe())
        this.shaderWireframe_.draw(this, sculptgl);
    },
    /** Updates color buffer */
    updateVertexBuffer: function () {
      this.getVertexBuffer().update(this.mesh_.getRenderVertices(this.isUsingDrawArrays()));
    },
    /** Updates color buffer */
    updateNormalBuffer: function () {
      this.getNormalBuffer().update(this.mesh_.getRenderNormals(this.isUsingDrawArrays()));
    },
    /** Updates color buffer */
    updateColorBuffer: function () {
      this.getColorBuffer().update(this.mesh_.getRenderColors(this.isUsingDrawArrays()));
    },
    /** Updates index buffer */
    updateIndexBuffer: function () {
      if (!this.isUsingDrawArrays())
        this.getIndexBuffer().update(this.mesh_.getRenderTriangles());
    },
    /** Updates wireframe buffer */
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.getWireframeBuffer().update(this.mesh_.getWireframe(this.isUsingDrawArrays()));
    },
    /** Update vertices and normals the buffers */
    updateGeometryBuffers: function () {
      this.updateVertexBuffer();
      this.updateNormalBuffer();
    },
    /** Update all the buffers */
    updateBuffers: function () {
      this.updateGeometryBuffers();
      this.updateColorBuffer();
      this.updateIndexBuffer();
      this.updateWireframeBuffer();
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