define([
  'misc/Utils',
  'misc/Export',
  'misc/Import',
  'scene/Background',
  'math3d/Camera',
  'mesh/Mesh',
  'mesh/multiresolution/Multimesh',
  'render/Shader',
  'render/shaders/ShaderMatcap',
  'math3d/Picking'
], function (Utils, Export, Import, Background, Camera, Mesh, Multimesh, Shader, ShaderMatcap, Picking) {

  'use strict';

  function Scene(sculptgl, gl) {
    this.sculptgl_ = sculptgl; // sculptgl
    this.gl_ = gl; // webgl context

    // utilities stuffs
    this.camera_ = new Camera(); // the camera
    this.picking_ = new Picking(this.camera_); // the ray picking
    this.pickingSym_ = new Picking(this.camera_); // the symmetrical picking

    // renderable stuffs
    this.background_ = null; // the background
    this.meshes_ = []; // the meshes

    // datas
    this.initMeshPath_ = 'ressources/sphere.ply'; // sphere
    this.initMesh_ = ''; // sphere

    // one render at a time
    this.preventRender_ = false; // prevent multiple render per render

    // functions
    this.resetScene_ = this.resetScene; // reset scene

    this.init();
  }

  Scene.prototype = {
    getCamera: function () {
      return this.camera_;
    },
    getPicking: function () {
      return this.picking_;
    },
    getSymmetryPicking: function () {
      return this.pickingSym_;
    },
    init: function () {
      this.loadTextures();
      this.onWindowResize();
      this.initEvents();
    },
    /** Initialize */
    initEvents: function () {
      document.getElementById('fileopen').addEventListener('change', this.loadFile.bind(this), false);
      document.getElementById('backgroundopen').addEventListener('change', this.loadBackground.bind(this), false);
      window.addEventListener('resize', this.onWindowResize.bind(this), false);
    },
    /** Called when the window is resized */
    onWindowResize: function () {
      var newWidth = window.innerWidth;
      var newHeight = window.innerHeight;
      var canvas = document.getElementById('canvas');
      var camera = this.camera_;
      var gl = this.gl_;
      gl.viewportWidth = canvas.width = camera.width_ = newWidth;
      gl.viewportHeight = canvas.height = camera.height_ = newHeight;
      gl.viewport(0, 0, newWidth, newHeight);
      camera.updateProjection();
      this.render();
    },
    /** Request a render */
    render: function () {
      if (this.preventRender_ === true)
        return;
      window.requestAnimationFrame(this.applyRender.bind(this));
      this.preventRender_ = true;
    },
    /** Render the scene */
    applyRender: function () {
      this.preventRender_ = false;
      var gl = this.gl_;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.camera_.updateView();
      if (this.background_)
        this.background_.render();
      this.computeMatricesAndSort();
      for (var i = 0, meshes = this.meshes_, nb = meshes.length; i < nb; ++i)
        meshes[i].render(this.sculptgl_);
    },
    /** Pre compute matrices and sort meshes */
    computeMatricesAndSort: function () {
      var meshes = this.meshes_;
      var cam = this.camera_;
      for (var i = 0, nb = meshes.length; i < nb; ++i)
        meshes[i].computeMatrices(cam);
      meshes.sort(this.sortFunction.bind(this));
    },
    /**
     * Sort function
     * render transparent meshes after opaque ones
     * transparent meshes rendered (back to front)
     * opaque meshes rendered (front to back)
     */
    sortFunction: function (a, b) {
      var aTr = a.isTransparent();
      var bTr = b.isTransparent();
      if (aTr && !bTr)
        return 1;
      else if (!aTr && bTr)
        return -1;
      else if (aTr && bTr) {
        return b.getDepth() - a.getDepth();
      } else {
        return a.getDepth() - b.getDepth();
      }
    },
    /** Load background */
    loadBackground: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      if (!this.background_)
        this.background_ = new Background(this.gl_);
      var reader = new FileReader();
      var self = this;
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;
        self.background_.loadBackgroundTexture(bg);
        self.render();
        document.getElementById('backgroundopen').value = '';
      };
      reader.readAsDataURL(file);
    },
    /** Return the file type */
    getFileType: function (name) {
      var lower = name.toLowerCase();
      if (lower.endsWith('.obj'))
        return 'obj';
      if (lower.endsWith('.stl'))
        return 'stl';
      if (lower.endsWith('.ply'))
        return 'ply';
      return;
    },
    /** Load file */
    loadFile: function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      var fileType = this.getFileType(file.name);
      if (!fileType)
        return;
      var reader = new FileReader();
      var self = this;
      reader.onload = function (evt) {
        self.loadScene(evt.target.result, fileType);
        document.getElementById('fileopen').value = '';
      };
      if (fileType === 'obj')
        reader.readAsText(file);
      else
        reader.readAsArrayBuffer(file);
    },
    /** Load a file */
    loadScene: function (fileData, fileType) {
      var mesh = this.sculptgl_.mesh_ = new Multimesh(new Mesh(this.gl_));
      var data = fileData || this.initMesh_;
      var type = fileType || this.getFileType(this.initMeshPath_);
      if (type === 'obj')
        Import.importOBJ(data, mesh);
      else if (type === 'stl')
        Import.importSTL(data, mesh);
      else if (type === 'ply')
        Import.importPLY(data, mesh);
      this.endMeshLoad();
    },
    /** The loading is finished, set stuffs ... and update camera */
    endMeshLoad: function () {
      var gui = this.sculptgl_.gui_;
      var mesh = this.sculptgl_.mesh_;
      mesh.init();
      mesh.initRender();
      gui.updateMesh();
      // uncomment this line to create new scene
      // this.meshes_.length = 0;
      this.meshes_.push(mesh);
      this.camera_.reset();
      this.render();
    },
    /** Load textures (preload) */
    loadTextures: function () {
      var self = this;
      var loadTex = function (path, idMaterial) {
        var mat = new Image();
        mat.src = path;
        var gl = self.gl_;
        mat.onload = function () {
          var idTex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, idTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mat);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.bindTexture(gl.TEXTURE_2D, null);
          Shader.textures[idMaterial] = idTex;
          if (idMaterial === 0)
            self.loadSphere();
        };
      };
      for (var i = 0, mats = ShaderMatcap.materials, l = mats.length; i < l; ++i)
        loadTex(mats[i].path, i);
    },
    /** Load the sphere */
    loadSphere: function () {
      var self = this;
      var sphereXhr = new XMLHttpRequest();
      sphereXhr.open('GET', this.initMeshPath_, true);
      var fileType = this.getFileType(this.initMeshPath_);
      if (!fileType)
        return;
      sphereXhr.responseType = fileType === 'obj' ? 'text' : 'arraybuffer';
      sphereXhr.onload = function () {
        self.initMesh_ = this.response;
        self.resetScene();
      };
      sphereXhr.send(null);
    },
    /** Reset the scene */
    resetScene: function () {
      this.meshes_.length = 0;
      this.loadScene();
      var ctrlMulti = this.sculptgl_.gui_.ctrlMultiresolution_;
      ctrlMulti.subdivide();
      ctrlMulti.subdivide();
      this.sculptgl_.states_.reset();
    }
  };

  return Scene;
});