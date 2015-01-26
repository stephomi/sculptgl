define([
  'render/Shader',
  'render/Buffer',
  'render/shaders/ShaderMatcap'
], function (Shader, Buffer, ShaderMatcap) {

  'use strict';

  function Render(gl, mesh) {
    this.mesh_ = mesh;
    this.gl_ = gl;

    this.shader_ = new Shader(gl);
    this.shaderWireframe_ = new Shader(gl);

    this.flatShading_ = false;
    this.showWireframe_ = false;

    this.vertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.normalBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.colorBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.materialBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.texCoordBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this.indexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this.wireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this.texture0_ = null;
    this.matcap_ = 0; // the chosen matcap texture index

    // local edit buffers
    this.localVertexBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.localNormalBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.localColorBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.localMaterialBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.localTexCoordBuffer_ = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this.localIndexBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this.localWireframeBuffer_ = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    this.exposure_ = 1.0;
    // these material values overrides the vertex attributes
    // it's here for debug or preview
    this.albedo_ = new Float32Array([-1.0, -1.0, -1.0]);
    this.roughness_ = -0.18;
    this.metallic_ = -0.78;
  }

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    getGL: function () {
      return this.gl_;
    },
    getMesh: function () {
      return this.mesh_;
    },
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
    getShader: function () {
      return this.shader_;
    },
    getShaderType: function () {
      return this.getShader().getType();
    },
    getVertexBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localVertexBuffer_ : this.vertexBuffer_;
    },
    getNormalBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localNormalBuffer_ : this.normalBuffer_;
    },
    getColorBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localColorBuffer_ : this.colorBuffer_;
    },
    getMaterialBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localMaterialBuffer_ : this.materialBuffer_;
    },
    getTexCoordBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localTexCoordBuffer_ : this.texCoordBuffer_;
    },
    getIndexBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localIndexBuffer_ : this.indexBuffer_;
    },
    getWireframeBuffer: function () {
      return this.mesh_.isLocalEdit() ? this.localWireframeBuffer_ : this.wireframeBuffer_;
    },
    /** Return true if the render is using drawArrays instead of drawElements */
    isUsingDrawArrays: function () {
      return Render.ONLY_DRAW_ARRAYS ? true : this.getFlatShading();
    },
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this.shader_.isUsingTexCoords() && !this.mesh_.isLocalEdit();
    },
    isTransparent: function () {
      return this.shader_.isTransparent();
    },
    getFlatShading: function () {
      return this.flatShading_ && !this.mesh_.isLocalEdit();
    },
    getShowWireframe: function () {
      return this.showWireframe_;
    },
    getTexture0: function () {
      return this.texture0_;
    },
    setTexture0: function (tex) {
      this.texture0_ = tex;
    },
    setMatcap: function (idMat) {
      this.matcap_ = idMat;
      this.setTexture0(ShaderMatcap.textures[idMat]);
    },
    setShowWireframe: function (showWireframe) {
      this.showWireframe_ = Render.ONLY_DRAW_ARRAYS ? false : showWireframe;
      this.updateWireframeBuffer();
    },
    setFlatShading: function (flatShading) {
      this.flatShading_ = flatShading;
      this.updateFlatShading();
      this.updateBuffers();
    },
    setShader: function (shaderType) {
      if (shaderType === Shader.mode.UV && !this.mesh_.hasUV())
        return;
      this.shader_.setType(shaderType);
      if (this.mesh_.hasUV()) {
        this.mesh_.updateDuplicateGeometry();
        this.mesh_.updateDuplicateColorsAndMaterials();
        if (this.isUsingTexCoords())
          this.updateFlatShading();
      }
      this.updateBuffers();
    },
    updateFlatShading: function (iFaces) {
      if (this.isUsingDrawArrays())
        this.mesh_.updateDrawArrays(this.getFlatShading(), iFaces);
    },
    initRender: function () {
      this.shaderWireframe_.setType(Shader.mode.WIREFRAME);
      if (this.getShaderType() === Shader.mode.MATCAP && !this.texture0_)
        this.setMatcap(0);
      this.setShader(this.getShaderType());
      this.setShowWireframe(this.getShowWireframe());
    },
    render: function (main) {
      this.shader_.draw(this, main);
      if (this.getShowWireframe())
        this.shaderWireframe_.draw(this, main);
    },
    updateVertexBuffer: function () {
      this.getVertexBuffer().update(this.mesh_.getRenderVertices());
    },
    updateNormalBuffer: function () {
      this.getNormalBuffer().update(this.mesh_.getRenderNormals());
    },
    updateColorBuffer: function () {
      this.getColorBuffer().update(this.mesh_.getRenderColors());
    },
    updateMaterialBuffer: function () {
      this.getMaterialBuffer().update(this.mesh_.getRenderMaterials());
    },
    updateTexCoordBuffer: function () {
      if (this.isUsingTexCoords())
        this.getTexCoordBuffer().update(this.mesh_.getRenderTexCoords());
    },
    updateIndexBuffer: function () {
      if (!this.isUsingDrawArrays())
        this.getIndexBuffer().update(this.mesh_.getRenderTriangles());
    },
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.getWireframeBuffer().update(this.mesh_.getWireframe());
    },
    updateGeometryBuffers: function () {
      this.updateVertexBuffer();
      this.updateNormalBuffer();
    },
    updateBuffers: function () {
      this.updateGeometryBuffers();
      this.updateColorBuffer();
      this.updateMaterialBuffer();
      this.updateTexCoordBuffer();
      this.updateIndexBuffer();
      this.updateWireframeBuffer();
    },
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
    copyRenderConfig: function (mesh) {
      this.setFlatShading(mesh.getFlatShading());
      this.setShowWireframe(mesh.getShowWireframe());
      this.setShader(mesh.getShaderType());
      this.setTexture0(mesh.getTexture0());
      this.setRoughness(mesh.getRoughness());
      this.setMetallic(mesh.getMetallic());
      this.setExposure(mesh.getExposure());
    }
  };

  return Render;
});