define([
  'lib/glMatrix',
  'object/Mesh',
  'render/Render',
  'editor/Subdivision',
  'editor/Multiresolution'
], function (glm, Mesh, Render, Subdivision, Multiresolution) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function Multimesh(gl) {
    this.gl_ = gl;

    this.meshes_ = [];
    this.sel_ = 0;
    this.render_ = new Render(gl, this);

    this.center_ = [0.0, 0.0, 0.0]; //center of mesh, local space (before mesh transform)
    this.matTransform_ = mat4.create(); //transformation matrix of the mesh
    this.scale_ = -1.0; //used for export in order to keep the same scale as import...
  }

  Multimesh.SCALE = 100.0;

  Multimesh.prototype = {
    // // getters
    /** Return the current mesh */
    getCurrent: function () {
      return this.meshes_[this.sel_];
    },
    /** Return transformation matrix */
    getMatrix: function () {
      return this.matTransform_;
    },
    /** Return the scale (which is applied in the transform matrix) */
    getScale: function () {
      return this.scale_;
    },
    /** Add an extra level to the mesh (loop subdivision) */
    addLevel: function () {
      if ((this.meshes_.length - 1) !== this.sel_)
        return this.getCurrent();
      var baseMesh = this.getCurrent();
      var newMesh = new Mesh(this.gl_);
      Subdivision.fullSubdivision(baseMesh, newMesh);
      this.pushMesh(newMesh);
      return newMesh;
    },
    /** Go to one level below in mesh resolution */
    lowerLevel: function () {
      if (this.sel_ === 0)
        return this.meshes_[0];
      Multiresolution.lowerAnalysis(this.getCurrent(), this.meshes_[--this.sel_]);
      this.updateResolution();
      return this.getCurrent();
    },
    /** Go to one level higher in mesh resolution, if available */
    higherLevel: function () {
      if (this.sel_ === this.meshes_.length - 1)
        return this.getCurrent();
      Multiresolution.higherSynthesis(this.getCurrent(), this.meshes_[++this.sel_]);
      this.updateResolution();
      return this.getCurrent();
    },
    /** Update the mesh after a change in resolution */
    updateResolution: function () {
      this.updateMesh();
      var render = this.render_;
      if (render.getShowWireframe()) {
        this.updateCacheWireframe(render.isUsingDrawArrays());
        render.updateLinesBuffer();
      }
      this.updateBuffers(true, true);
    },
    /** Initialize the mesh, octree, topology, geometry, bbox, transformation */
    init: function () {
      var mesh = this.meshes_[0];
      mesh.init();
      var box = mesh.octree_.aabbSplit_;
      this.center_ = [(box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5];
      //scale and center
      var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
      var scale = this.scale_ = Multimesh.SCALE / diag;
      mat4.scale(this.matTransform_, this.matTransform_, [scale, scale, scale]);
      this.moveTo([0.0, 0.0, 0.0]);
      this.toto = mat4.create();
      mat4.translate(this.toto, mat4.create(), vec3.sub([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], this.center_));
    },
    /** Move the mesh center to a certain point */
    moveTo: function (destination) {
      mat4.translate(this.matTransform_, this.matTransform_, vec3.sub(destination, destination, this.center_));
    },
    /** Initialize rendering */
    initRender: function (textures, shaders, shaderType, flatShading, showWireframe) {
      var render = this.render_;
      render.initBuffers();
      render.initShaderWireframe(shaders);

      render.setFlatShading(flatShading);
      if (render.isUsingDrawArrays())
        this.updateCacheDrawArrays(render.getFlatShading());

      render.setShowWireframe(showWireframe);
      if (render.getShowWireframe()) {
        this.updateCacheWireframe(render.isUsingDrawArrays());
        render.updateLinesBuffer();
      }

      this.updateShaders(shaderType, textures, shaders);
      this.updateBuffers(true, true);
    },
    /** Initialize buffers and shaders */
    updateShaders: function (shaderType, textures, shaders) {
      this.render_.updateShaders(shaderType, textures, shaders);
    },
    /** Set flat shading rendering */
    setFlatShading: function (value) {
      var render = this.render_;
      render.setFlatShading(value);
      if (render.isUsingDrawArrays())
        this.updateCacheDrawArrays(render.getFlatShading());
      if (render.getShowWireframe()) {
        this.updateCacheWireframe(render.isUsingDrawArrays());
        render.updateLinesBuffer();
      }
      this.updateBuffers(true, true);
    },
    /** Set wireframe display */
    setShowWireframe: function (value) {
      var render = this.render_;
      render.setShowWireframe(value);
      if (render.getShowWireframe())
        this.updateCacheWireframe(render.isUsingDrawArrays());
      render.updateLinesBuffer();
    },
    /** Update the rendering buffers */
    updateBuffers: function (updateColors, updateIndex) {
      this.render_.updateBuffers(updateColors, updateIndex);
    },
    updateMesh: function (iTris, iVerts) {
      this.updateGeometry(iTris, iVerts);
      var render = this.render_;
      if (render.isUsingDrawArrays())
        this.updateCacheDrawArrays(render.getFlatShading(), iTris);
    },
    /** Render the mesh */
    render: function (camera, picking) {
      this.render_.render(camera, picking);
    },
    /** Change the resolution */
    selectResolution: function (sel) {
      while (this.sel_ > sel) {
        this.lowerLevel();
      }
      while (this.sel_ < sel) {
        this.higherLevel();
      }
    },
    /** Find a select index of a mesh */
    findIndexFromMesh: function (mesh) {
      var meshes = this.meshes_;
      for (var i = 0, l = meshes.length; i < l; ++i) {
        if (mesh === meshes[i])
          return i;
      }
    },
    /** Change the resolution */
    selectMesh: function (mesh) {
      var val = this.findIndexFromMesh(mesh);
      this.selectResolution(val);
    },
    /** Push a mesh */
    pushMesh: function (mesh) {
      this.meshes_.push(mesh);
      this.sel_ = this.meshes_.length - 1;
      this.updateResolution();
    },
    /** Pop the last mesh */
    popMesh: function () {
      this.meshes_.pop();
      this.sel_ = this.meshes_.length - 1;
      this.updateResolution();
    }
  };

  var createFunc = function (meshProto) {
    return function () {
      var mesh = this.getCurrent();
      return meshProto.apply(mesh, arguments);
    };
  };

  var MultiProto = Multimesh.prototype;
  var MeshProto = Mesh.prototype;
  var protos = Object.keys(Mesh.prototype);
  for (var i = 0, l = protos.length; i < l; ++i) {
    var proto = protos[i];
    MultiProto[proto] = MultiProto[proto] || createFunc(MeshProto[proto]);
  }

  return Multimesh;
});