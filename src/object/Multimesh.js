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
      this.meshes_.push(newMesh);
      this.sel_++;

      console.time('subdiv');
      Subdivision.fullSubdivision(baseMesh, newMesh);
      console.timeEnd('subdiv');

      console.time('update mesh');
      this.updateResolution();
      console.timeEnd('update mesh');

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
      if (this.render_.showWireframe_ === true) {
        this.getCurrent().updateCacheWireframe(this.render_.flatShading_);
        this.render_.updateLinesBuffer();
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
      this.render_.initBuffers();
      this.render_.initShaderWireframe(shaders);

      this.render_.flatShading_ = flatShading;
      if (flatShading === true)
        this.getCurrent().updateCacheDrawArrays();

      this.render_.showWireframe_ = showWireframe;
      if (showWireframe === true) {
        this.getCurrent().updateCacheWireframe(flatShading);
        this.render_.updateLinesBuffer();
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
      this.render_.flatShading_ = value;
      if (value === true)
        this.getCurrent().updateCacheDrawArrays();
      if (this.render_.showWireframe_ === true) {
        this.getCurrent().updateCacheWireframe(value);
        this.render_.updateLinesBuffer();
      }
      this.updateBuffers(true, true);
    },
    /** Set wireframe */
    setWireframe: function (value) {
      this.render_.showWireframe_ = value;
      if (value === true)
        this.getCurrent().updateCacheWireframe(this.render_.flatShading_);
      this.render_.updateLinesBuffer();
    },
    /** Update the rendering buffers */
    updateBuffers: function (updateColors, updateIndex) {
      this.render_.updateBuffers(updateColors, updateIndex);
    },
    updateMesh: function (iTris, iVerts) {
      var mesh = this.getCurrent();
      mesh.updateGeometry(iTris, iVerts);
      if (this.render_.flatShading_ === true)
        mesh.updateCacheDrawArrays(iTris, iVerts);
    },
    /** Render the mesh */
    render: function (camera, picking) {
      this.render_.render(camera, picking);
    },
    /** Analyse the cells in the octree that needs an update */
    checkLeavesUpdate: function () {
      this.getCurrent().checkLeavesUpdate();
    },
    /** Update stuffs after undo/redo */
    updateHistory: function () {
      // the history doesn't save the flatShading arrays...
      if (this.render_.flatShading_ === true) {
        this.getCurrent().updateCacheDrawArrays();
        if (this.render_.showWireframe_ === true) {
          this.getCurrent().updateCacheWireframe(true);
          this.render_.updateLinesBuffer();
        }
      }
      this.updateBuffers(true, true);
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
    }
  };

  return Multimesh;
});