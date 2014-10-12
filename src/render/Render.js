define([
  'render/Shader',
  'render/Buffer',
  'render/shaders/ShaderMatcap'
], function (Shader, Buffer, ShaderMatcap) {

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
    this.materialBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); // materials buffer
    this.texCoordBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // texCoords buffer
    this.indexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // indices buffer
    this.wireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // wireframe buffer
    this.texture0_ = null; // a texture
    this.matcap_ = 0; // the chosen matcap texture index

    this.exposure_ = 1.0;
    // these material values overrides the vertex attributes
    // it's here for debug or preview
    this.albedo_ = [-1.0, -1.0, -1.0];
    this.roughness_ = -0.18;
    this.metallic_ = -0.78;
  }

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    getAlbedo: function () {
      return this.albedo_;
    },
    getRoughness: function () {
      return this.roughness_;
    },
    getMetallic: function () {
      return this.metallic_;
    },
    getExposure: function () {
      return this.exposure_;
    },
    setAlbedo: function (val) {
      this.albedo_[0] = val[0];
      this.albedo_[1] = val[1];
      this.albedo_[2] = val[2];
    },
    setRoughness: function (val) {
      this.roughness_ = val;
    },
    setMetallic: function (val) {
      this.metallic_ = val;
    },
    setExposure: function (val) {
      this.exposure_ = val;
    },
    /** Return webgl context */
    getGL: function () {
      return this.gl_;
    },
    /** Return the mesh */
    getMesh: function () {
      return this.mesh_;
    },
    getShader: function () {
      return this.shader_;
    },
    getShaderType: function () {
      return this.getShader().getType();
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
    /** Return material buffer */
    getMaterialBuffer: function () {
      return this.materialBuffer_;
    },
    /** Return texCoord buffer */
    getTexCoordBuffer: function () {
      return this.texCoordBuffer_;
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
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this.shader_.isUsingTexCoords();
    },
    /** Return true if the shader is using alpha transparency stuffs */
    isTransparent: function () {
      return this.shader_.isTransparent();
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
    /** Set matcap texture */
    setMatcap: function (idMat) {
      this.matcap_ = idMat;
      this.setTexture0(ShaderMatcap.textures[idMat]);
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
      this.mesh_.updateDuplicateGeometry();
      this.mesh_.updateDuplicateColorsAndMaterials();
      if (this.isUsingTexCoords())
        this.updateFlatShading();
      this.updateBuffers();
    },
    /** Update flat shading buffers */
    updateFlatShading: function (iFaces) {
      if (this.isUsingDrawArrays())
        this.mesh_.updateDrawArrays(this.getFlatShading(), iFaces);
    },
    /** Initialize rendering */
    initRender: function () {
      this.shaderWireframe_.setType(Shader.mode.WIREFRAME);
      if (this.shader_.getType() === Shader.mode.MATCAP && !this.texture0_)
        this.setMatcap(0);
      this.setShader(this.shader_.type_);
      this.setShowWireframe(this.getShowWireframe());
    },
    /** Render the mesh */
    render: function (main) {
      this.shader_.draw(this, main);
      if (this.getShowWireframe())
        this.shaderWireframe_.draw(this, main);
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
    /** Updates material buffer */
    updateMaterialBuffer: function () {
      this.getMaterialBuffer().update(this.mesh_.getRenderMaterials(this.isUsingDrawArrays()));
    },
    /** Updates texCoord buffer */
    updateTexCoordBuffer: function () {
      if (this.isUsingTexCoords())
        this.getTexCoordBuffer().update(this.mesh_.getRenderTexCoords());
    },
    /** Updates index buffer */
    updateIndexBuffer: function () {
      if (!this.isUsingDrawArrays())
        this.getIndexBuffer().update(this.mesh_.getRenderTriangles());
    },
    /** Updates wireframe buffer */
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.getWireframeBuffer().update(this.mesh_.getWireframe());
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
      this.updateMaterialBuffer();
      this.updateTexCoordBuffer();
      this.updateIndexBuffer();
      this.updateWireframeBuffer();
    },
    /** Free gl memory */
    release: function () {
      if (this.getTexture0())
        this.getGL().deleteTexture(this.getTexture0());
      this.getVertexBuffer().release();
      this.getNormalBuffer().release();
      this.getColorBuffer().release();
      this.getMaterialBuffer().release();
      this.getIndexBuffer().release();
      this.getWireframeBuffer().release();
    },
  };

  return Render;
});