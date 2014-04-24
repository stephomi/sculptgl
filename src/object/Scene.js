define([
  'lib/jQuery',
  'object/Background',
  'misc/Export',
  'misc/Import',
  'math3d/Camera',
  'object/Mesh',
  'object/Multimesh',
  'render/Shader',
  'math3d/Picking'
], function ($, Background, Export, Import, Camera, Mesh, Multimesh, Shader, Picking) {

  'use strict';

  function Scene(sculptgl, gl) {
    this.sculptgl_ = sculptgl; //sculptgl
    this.gl_ = gl; //webgl context

    //utilities stuffs
    this.camera_ = new Camera(); //the camera
    this.picking_ = new Picking(this.camera_); //the ray picking
    this.pickingSym_ = new Picking(this.camera_); //the symmetrical picking

    //renderable stuffs
    this.background_ = null; //the background
    this.multimeshes_ = []; //the meshes

    //datas
    this.textures_ = {}; //textures
    this.shaders_ = {}; //shaders
    this.sphere_ = ''; //sphere

    //functions
    this.resetScene_ = this.resetScene; //reset scene

    this.init();
  }

  Scene.prototype = {
    init: function () {
      this.loadShaders();
      this.loadTextures();
      this.onWindowResize();
      this.initEvents();
    },
    /** Initialize */
    initEvents: function () {
      $('#fileopen').change(this.loadFile.bind(this));
      $('#backgroundopen').change(this.loadBackground.bind(this));
      $(window).resize(this.onWindowResize.bind(this));
    },
    /** Called when the window is resized */
    onWindowResize: function () {
      var newWidth = $(window).width();
      var newHeight = $(window).height();
      this.camera_.width_ = newWidth;
      this.camera_.height_ = newHeight;
      $('#canvas').attr('width', newWidth);
      $('#canvas').attr('height', newHeight);
      var gl = this.gl_;
      gl.viewportWidth = newWidth;
      gl.viewportHeight = newHeight;
      gl.viewport(0, 0, newWidth, newHeight);
      this.camera_.updateProjection();
      this.render();
    },
    /** Render the scene */
    render: function () {
      var gl = this.gl_;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.camera_.updateView();
      if (this.background_)
        this.background_.render();
      for (var i = 0, meshes = this.multimeshes_, nb = meshes.length; i < nb; ++i)
        meshes[i].render(this.camera_, this.picking_);
    },
    /** Load background */
    loadBackground: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      if (!this.background_) {
        this.background_ = new Background(this.gl_);
        this.background_.init(this.shaders_);
      }
      var reader = new FileReader();
      var self = this;
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;
        self.background_.loadBackgroundTexture(bg);
        self.render();
        $('#backgroundopen').replaceWith($('#backgroundopen').clone(true));
      };
      reader.readAsDataURL(file);
    },
    /** Load file */
    loadFile: function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      var name = file.name.toLowerCase();
      var fileType = '';
      fileType = name.endsWith('.obj') ? 'obj' : fileType;
      fileType = name.endsWith('.stl') ? 'stl' : fileType;
      fileType = name.endsWith('.ply') ? 'ply' : fileType;
      if (fileType === '')
        return;
      var reader = new FileReader();
      var self = this;
      reader.onload = function (evt) {
        self.startMeshLoad();
        var mesh = self.sculptgl_.multimesh_.getCurrent();
        if (fileType === 'obj')
          Import.importOBJ(evt.target.result, mesh);
        else if (fileType === 'stl')
          Import.importSTL(evt.target.result, mesh);
        else if (fileType === 'ply')
          Import.importPLY(evt.target.result, mesh);
        self.endMeshLoad();
        $('#fileopen').replaceWith($('#fileopen').clone(true));
      };
      if (fileType === 'obj')
        reader.readAsText(file);
      else if (fileType === 'stl')
        reader.readAsArrayBuffer(file);
      else if (fileType === 'ply')
        reader.readAsArrayBuffer(file);
    },
    /** Open file */
    resetScene: function () {
      this.startMeshLoad();
      Import.importOBJ(this.sphere_, this.sculptgl_.multimesh_.getCurrent());
      this.endMeshLoad();
    },
    /** Initialization before loading the mesh */
    startMeshLoad: function () {
      this.sculptgl_.multimesh_ = new Multimesh(this.gl_);
      this.sculptgl_.multimesh_.meshes_.push(new Mesh(this.gl_));
      this.sculptgl_.states_.reset();
      this.sculptgl_.sculpt_.multimesh_ = this.sculptgl_.multimesh_;
      //reset flags (not necessary...)
      Mesh.TAG_FLAG = 1;
      Mesh.SCULPT_FLAG = 1;
      Mesh.STATE_FLAG = 1;
    },
    /** The loading is finished, set stuffs ... and update camera */
    endMeshLoad: function () {
      var gui = this.sculptgl_.gui_;
      var multimesh = this.sculptgl_.multimesh_;
      multimesh.init();
      this.camera_.reset();
      multimesh.initRender(this.textures_, this.shaders_, gui.getShader(), gui.getFlatShading(), gui.getWireframe());
      gui.updateMesh();
      // uncomment this line to create new scene
      //this.multimeshes_.length = 0;
      this.multimeshes_.push(multimesh);
      this.render();
    },
    /** Load textures (preload) */
    loadTextures: function () {
      var self = this;
      var loadTex = function (path, mode) {
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
          self.textures_[mode] = idTex;
          if (mode === Shader.mode.MATERIAL)
            self.loadSphere();
        };
      };
      loadTex('ressources/clay.jpg', Shader.mode.MATERIAL);
      loadTex('ressources/chavant.jpg', Shader.mode.MATERIAL + 1);
      loadTex('ressources/skin.jpg', Shader.mode.MATERIAL + 2);
      loadTex('ressources/drink.jpg', Shader.mode.MATERIAL + 3);
      loadTex('ressources/redvelvet.jpg', Shader.mode.MATERIAL + 4);
      loadTex('ressources/orange.jpg', Shader.mode.MATERIAL + 5);
      loadTex('ressources/bronze.jpg', Shader.mode.MATERIAL + 6);
    },
    /** Load shaders as a string */
    loadShaders: function () {
      var xhrShader = function (path) {
        var shaderXhr = new XMLHttpRequest();
        shaderXhr.open('GET', path, false);
        shaderXhr.send(null);
        return shaderXhr.responseText;
      };
      var shaders = this.shaders_;
      shaders.phongVertex = xhrShader('shaders/phong.vert');
      shaders.phongFragment = xhrShader('shaders/phong.frag');
      shaders.transparencyVertex = xhrShader('shaders/transparency.vert');
      shaders.transparencyFragment = xhrShader('shaders/transparency.frag');
      shaders.wireframeVertex = xhrShader('shaders/wireframe.vert');
      shaders.wireframeFragment = xhrShader('shaders/wireframe.frag');
      shaders.normalVertex = xhrShader('shaders/normal.vert');
      shaders.normalFragment = xhrShader('shaders/normal.frag');
      shaders.reflectionVertex = xhrShader('shaders/reflection.vert');
      shaders.reflectionFragment = xhrShader('shaders/reflection.frag');
      shaders.backgroundVertex = xhrShader('shaders/background.vert');
      shaders.backgroundFragment = xhrShader('shaders/background.frag');
    },
    /** Load the sphere */
    loadSphere: function () {
      var self = this;
      var sphereXhr = new XMLHttpRequest();
      sphereXhr.open('GET', 'ressources/sphere.obj', true);
      sphereXhr.responseType = 'text';
      sphereXhr.onload = function () {
        self.sphere_ = this.response;
        self.resetScene();
      };
      sphereXhr.send(null);
    }
  };

  return Scene;
});