define([
  'misc/getOptionsURL',
  'render/Shader',
  'render/Buffer',
  'render/shaders/ShaderMatcap'
], function (getOptionsURL, Shader, Buffer, ShaderMatcap) {

  'use strict';

  var Render = function (gl, mesh) {
    this._mesh = mesh;
    this._gl = gl;

    this._shader = new Shader(gl);
    this._shaderWireframe = new Shader(gl);

    var opts = getOptionsURL();
    this._flatShading = opts.flatshading;
    this._showWireframe = opts.wireframe;
    this._matcap = Math.min(opts.matcap, ShaderMatcap.matcaps.length - 1); // matcap id
    this._curvature = Math.min(opts.curvature, 5.0);
    this._texture0 = null;

    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this._normalBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this._colorBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this._materialBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this._texCoordBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this._indexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this._wireframeBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    // these material values overrides the vertex attributes
    // it's here for debug or preview
    this._albedo = new Float32Array([-1.0, -1.0, -1.0]);
    this._roughness = -0.18;
    this._metallic = -0.78;
    this._alpha = 1.0;

    this._flatColor = new Float32Array([1.0, 0.0, 0.0]);
    this._mode = gl.TRIANGLES;
  };

  Render.ONLY_DRAW_ARRAYS = false;

  Render.prototype = {
    getCount: function () {
      var gl = this._gl;
      if (this._mode === gl.TRIANGLES)
        return this._mesh.getNbTriangles() * 3;
      if (this._mode === gl.LINES)
        return this._mesh.getNbVertices();
      return 0;
    },
    getFlatColor: function () {
      return this._flatColor;
    },
    getGL: function () {
      return this._gl;
    },
    getMesh: function () {
      return this._mesh;
    },
    getMode: function () {
      return this._mode;
    },
    getAlbedo: function () {
      return this._albedo;
    },
    getRoughness: function () {
      return this._roughness;
    },
    getMetallic: function () {
      return this._metallic;
    },
    setMode: function (mode) {
      this._mode = mode;
    },
    setFlatColor: function (val) {
      this._flatColor.set(val);
    },
    setAlbedo: function (val) {
      this._albedo.set(val);
    },
    setRoughness: function (val) {
      this._roughness = val;
    },
    setMetallic: function (val) {
      this._metallic = val;
    },
    getShader: function () {
      return this._shader;
    },
    getShaderType: function () {
      return this.getShader().getType();
    },
    getVertexBuffer: function () {
      return this._vertexBuffer;
    },
    getNormalBuffer: function () {
      return this._normalBuffer;
    },
    getColorBuffer: function () {
      return this._colorBuffer;
    },
    getMaterialBuffer: function () {
      return this._materialBuffer;
    },
    getTexCoordBuffer: function () {
      return this._texCoordBuffer;
    },
    getIndexBuffer: function () {
      return this._indexBuffer;
    },
    getWireframeBuffer: function () {
      return this._wireframeBuffer;
    },
    /** Return true if the render is using drawArrays instead of drawElements */
    isUsingDrawArrays: function () {
      return Render.ONLY_DRAW_ARRAYS ? true : this.getFlatShading();
    },
    /** Return true if the shader is using UVs */
    isUsingTexCoords: function () {
      return this._shader.isUsingTexCoords();
    },
    setOpacity: function (alpha) {
      this._alpha = alpha;
    },
    getOpacity: function () {
      return this._alpha;
    },
    setCurvature: function (cur) {
      this._curvature = cur;
    },
    getCurvature: function () {
      return this._curvature;
    },
    isTransparent: function () {
      return this._alpha < 0.99;
    },
    getFlatShading: function () {
      return this._flatShading;
    },
    getShowWireframe: function () {
      return this._showWireframe;
    },
    getTexture0: function () {
      return this._texture0;
    },
    setTexture0: function (tex) {
      this._texture0 = tex;
    },
    getMatcap: function () {
      return this._matcap;
    },
    setMatcap: function (idMat) {
      this._matcap = idMat;
    },
    setShowWireframe: function (showWireframe) {
      this._showWireframe = Render.ONLY_DRAW_ARRAYS ? false : showWireframe;
      this.updateWireframeBuffer();
    },
    setFlatShading: function (flatShading) {
      this._flatShading = flatShading;
      this.updateFlatShading();
      this.updateBuffers();
    },
    setShader: function (shaderType) {
      var hasUV = this._mesh.hasUV();
      if (shaderType === 'UV' && !hasUV)
        return;
      this._shader.setType(shaderType);
      if (hasUV) {
        this._mesh.updateDuplicateGeometry();
        this._mesh.updateDuplicateColorsAndMaterials();
        if (this.isUsingTexCoords())
          this.updateFlatShading();
      }
      this.updateBuffers();
    },
    updateFlatShading: function (iFaces) {
      if (this.isUsingDrawArrays())
        this._mesh.updateDrawArrays(this.getFlatShading(), iFaces);
    },
    initRender: function () {
      this._shaderWireframe.setType('WIREFRAME');
      if (this.getShaderType() === 'MATCAP' && !this._texture0)
        this.setMatcap(this._matcap);
      this.setShader(this.getShaderType());
      this.setShowWireframe(this.getShowWireframe());
    },
    render: function (main) {
      this._shader.draw(this, main);
      if (this.getShowWireframe())
        this._shaderWireframe.draw(this, main);
    },
    renderFlatColor: function (main) {
      Shader.FLAT.getOrCreate(this.getGL()).draw(this, main);
    },
    updateVertexBuffer: function () {
      this.getVertexBuffer().update(this._mesh.getRenderVertices());
    },
    updateNormalBuffer: function () {
      this.getNormalBuffer().update(this._mesh.getRenderNormals());
    },
    updateColorBuffer: function () {
      this.getColorBuffer().update(this._mesh.getRenderColors());
    },
    updateMaterialBuffer: function () {
      this.getMaterialBuffer().update(this._mesh.getRenderMaterials());
    },
    updateTexCoordBuffer: function () {
      if (this.isUsingTexCoords())
        this.getTexCoordBuffer().update(this._mesh.getRenderTexCoords());
    },
    updateIndexBuffer: function () {
      if (!this.isUsingDrawArrays())
        this.getIndexBuffer().update(this._mesh.getRenderTriangles());
    },
    updateWireframeBuffer: function () {
      if (this.getShowWireframe())
        this.getWireframeBuffer().update(this._mesh.getWireframe());
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
      this.setMatcap(mesh.getMatcap());
      this.setTexture0(mesh.getTexture0());
      this.setCurvature(mesh.getCurvature());
      this.setOpacity(mesh.getOpacity());
    }
  };

  return Render;
});