define([
  'misc/Utils',
  'misc/Import',
  'editor/Sculpt',
  'gui/Gui',
  'math3d/Camera',
  'math3d/Picking',
  'mesh/Background',
  'mesh/Grid',
  'mesh/Mesh',
  'mesh/multiresolution/Multimesh',
  'states/States',
  'render/Render',
  'render/shaders/ShaderMatcap'
], function (Utils, Import, Sculpt, Gui, Camera, Picking, Background, Grid, Mesh, Multimesh, States, Render, ShaderMatcap) {

  'use strict';

  function SculptGL() {
    this.gl_ = null; // webgl context
    this.canvas_ = document.getElementById('canvas');

    // controllers stuffs
    this.mouseX_ = 0; // the x position
    this.mouseY_ = 0; // the y position
    this.lastMouseX_ = 0; // the last x position
    this.lastMouseY_ = 0; // the last y position
    this.sumDisplacement_ = 0; // sum of the displacement mouse
    this.mouseButton_ = 0; // which mouse button is pressed

    // core of the app
    this.states_ = new States(this); // for undo-redo
    this.sculpt_ = new Sculpt(this.states_); // sculpting management
    this.camera_ = new Camera(); // the camera
    this.picking_ = new Picking(this.camera_); // the ray picking
    this.pickingSym_ = new Picking(this.camera_); // the symmetrical picking

    // renderable stuffs
    this.showGrid_ = true;
    this.grid_ = null; // the grid
    this.background_ = null; // the background
    this.meshes_ = []; // the meshes
    this.mesh_ = null; // the selected mesh

    // ui stuffs
    this.gui_ = new Gui(this); // gui
    this.focusGui_ = false; // if the gui is being focused

    // misc stuffs
    this.preventRender_ = false; // prevent multiple render per render

    // datas
    this.initMeshPath_ = 'resources/sphere.obj'; // sphere
    this.initMesh_ = ''; // sphere
  }

  SculptGL.prototype = {
    getBackground: function () {
      return this.background_;
    },
    getCanvas: function () {
      return this.canvas_;
    },
    getCamera: function () {
      return this.camera_;
    },
    getGui: function () {
      return this.gui_;
    },
    getMeshes: function () {
      return this.meshes_;
    },
    getMesh: function () {
      return this.mesh_;
    },
    getPicking: function () {
      return this.picking_;
    },
    getPickingSymmetry: function () {
      return this.pickingSym_;
    },
    getSculpt: function () {
      return this.sculpt_;
    },
    getStates: function () {
      return this.states_;
    },
    setMesh: function (mesh) {
      this.mesh_ = mesh;
      this.getGui().updateMesh();
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
      this.background_.render();
      this.computeMatricesAndSort();
      if (this.showGrid_) this.grid_.render();
      for (var i = 0, meshes = this.meshes_, nb = meshes.length; i < nb; ++i)
        meshes[i].render(this);
    },
    /** Pre compute matrices and sort meshes */
    computeMatricesAndSort: function () {
      var meshes = this.meshes_;
      var cam = this.camera_;
      this.grid_.computeMatrices(cam);
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
    /** Initialization */
    start: function () {
      this.initWebGL();
      this.background_ = new Background(this.gl_);
      this.grid_ = new Grid(this.gl_);
      this.loadTextures();
      this.gui_.initGui();
      this.onCanvasResize();
      this.initEvents();
    },
    /** Load webgl context */
    initWebGL: function () {
      // TODO : add an option to toggle antialias if possible ?
      var attributes = {
        antialias: true,
        stencil: true
      };
      var canvas = document.getElementById('canvas');
      var gl = this.gl_ = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
      if (!gl) {
        window.alert('Could not initialise WebGL. You should try Chrome or Firefox.');
      }
      if (gl) {
        if (!gl.getExtension('OES_element_index_uint')) {
          Render.ONLY_DRAW_ARRAYS = true;
        }
        gl.viewportWidth = window.innerWidth;
        gl.viewportHeight = window.innerHeight;
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
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
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.bindTexture(gl.TEXTURE_2D, null);
          ShaderMatcap.textures[idMaterial] = idTex;
          if (idMaterial === 0)
            self.loadSphere();
        };
      };
      for (var i = 0, mats = ShaderMatcap.matcaps, l = mats.length; i < l; ++i)
        loadTex(mats[i].path, i);
    },
    /** Called when the window is resized */
    onCanvasResize: function () {
      var newWidth = this.gl_.viewportWidth = this.camera_.width_ = this.canvas_.width;
      var newHeight = this.gl_.viewportHeight = this.camera_.height_ = this.canvas_.height;
      this.background_.onResize(newWidth, newHeight);
      this.gl_.viewport(0, 0, newWidth, newHeight);
      this.camera_.updateProjection();
      this.render();
    },
    /** Initialize */
    initEvents: function () {
      var canvas = this.canvas_;
      var mouseThrottled = Utils.throttle(this.onMouseMove.bind(this), 16.66);
      canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
      canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
      canvas.addEventListener('mouseout', this.onMouseOut.bind(this), false);
      canvas.addEventListener('mouseover', this.onMouseOver.bind(this), false);
      canvas.addEventListener('mousemove', mouseThrottled, false);
      canvas.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);
      canvas.addEventListener('DOMMouseScroll', this.onMouseWheel.bind(this), false);
      canvas.addEventListener('webglcontextlost', this.onContextLost, false);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
      document.getElementById('fileopen').addEventListener('change', this.loadFile.bind(this), false);
      document.getElementById('backgroundopen').addEventListener('change', this.loadBackground.bind(this), false);
    },
    /** Load background */
    loadBackground: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      var reader = new FileReader();
      var canvas = this.getCanvas();
      var self = this;
      reader.onload = function (evt) {
        var bg = new Image();
        bg.src = evt.target.result;
        self.getBackground().loadBackgroundTexture(bg);
        self.getBackground().onResize(canvas.width, canvas.height);
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
    computeBoundingBoxMeshes: function (meshes) {
      var bigBound = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (var i = 0, l = meshes.length; i < l; ++i) {
        var bound = meshes[i].getBound();
        if (bound[0] < bigBound[0]) bigBound[0] = bound[0];
        if (bound[1] < bigBound[1]) bigBound[1] = bound[1];
        if (bound[2] < bigBound[2]) bigBound[2] = bound[2];
        if (bound[3] > bigBound[3]) bigBound[3] = bound[3];
        if (bound[4] > bigBound[4]) bigBound[4] = bound[4];
        if (bound[5] > bigBound[5]) bigBound[5] = bound[5];
      }
      return bigBound;
    },
    centerMeshes: function (meshes) {
      var box = this.computeBoundingBoxMeshes(meshes);
      var trans = [-(box[0] + box[3]) * 0.5, -(box[1] + box[4]) * 0.5, -(box[2] + box[5]) * 0.5];
      for (var i = 0, l = meshes.length; i < l; ++i)
        meshes[i].translate(trans);
    },
    /** Load a file */
    loadScene: function (fileData, fileType) {
      var data = fileData || this.initMesh_;
      var type = fileType || this.getFileType(this.initMeshPath_);
      var newMeshes;
      if (type === 'obj') newMeshes = Import.importOBJ(data, this.gl_);
      else if (type === 'stl') newMeshes = Import.importSTL(data, this.gl_);
      else if (type === 'ply') newMeshes = Import.importPLY(data, this.gl_);
      var nbNewMeshes = newMeshes.length;
      if (nbNewMeshes === 0) return;
      var meshes = this.meshes_;
      var multimeshes = [];
      for (var i = 0; i < nbNewMeshes; ++i) {
        var mesh = new Multimesh(newMeshes[i]);
        mesh.init();
        mesh.initRender();
        meshes.push(mesh);
        multimeshes.push(mesh);
      }
      this.centerMeshes(multimeshes);
      this.states_.pushStateAdd(multimeshes);
      this.setMesh(meshes[meshes.length - 1]);
      this.camera_.reset();
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
    /** Clear the scene */
    clearScene: function () {
      this.states_.pushStateRemove(this.meshes_.slice());
      this.meshes_.length = 0;
      this.setMesh(null);
    },
    /** Reset the scene */
    resetScene: function () {
      this.clearScene();
      this.loadScene();
      var ctrlTopo = this.getGui().ctrlTopology_;
      while (this.meshes_[0].getNbFaces() < 20000)
        ctrlTopo.subdivide();
      this.states_.reset();
    },
    /** Delete the current selected mesh */
    deleteCurrentMesh: function () {
      if (!this.mesh_) return;
      this.states_.pushStateRemove(this.mesh_);
      this.meshes_.splice(this.meshes_.indexOf(this.mesh_), 1);
      this.setMesh(null);
    },
    /** WebGL context is lost */
    onContextLost: function () {
      window.alert('shit happens : context lost');
    },
    /** WebGL context is restored */
    onContextRestored: function () {
      window.alert('context is restored');
    },
    /** Mouse over event */
    onMouseOver: function () {
      this.focusGui_ = false;
    },
    /** Mouse out event */
    onMouseOut: function (event) {
      this.focusGui_ = true;
      this.onMouseUp(event);
    },
    /** Mouse released event */
    onMouseUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.canvas_.style.cursor = 'default';
      this.mouseButton_ = 0;
      Multimesh.RENDER_HINT = Multimesh.NONE;
      this.render();
    },
    /** Mouse wheel event */
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var delta = Math.max(-1.0, Math.min(1.0, (event.wheelDelta || -event.detail)));
      this.camera_.zoom(delta * 0.02);
      Multimesh.RENDER_HINT = Multimesh.CAMERA;
      this.render();
    },
    /** Set mouse position from event */
    setMousePosition: function (event) {
      this.mouseX_ = event.offsetX === undefined ? event.layerX : event.offsetX;
      this.mouseY_ = event.offsetY === undefined ? event.layerY : event.offsetY;
    },
    /** Mouse pressed event */
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.setMousePosition(event);
      var mouseX = this.mouseX_;
      var mouseY = this.mouseY_;
      var button = this.mouseButton_ = event.which;
      if (button === 1) {
        this.sumDisplacement_ = 0;
        this.sculpt_.start(this);
      }
      var picking = this.picking_;
      var pickedMesh = picking.getMesh();
      if (button === 1 && pickedMesh)
        this.canvas_.style.cursor = 'none';
      if (!pickedMesh && event.ctrlKey)
        this.mouseButton_ = 4; // zoom camera if no picking
      else if (!pickedMesh && event.altKey)
        this.mouseButton_ = 2; // pan camera if no picking
      else if (button === 3 || (button === 1 && !pickedMesh)) {
        this.mouseButton_ = 3; // rotate camera
        if (this.camera_.usePivot_)
          picking.intersectionMouseMeshes(this.meshes_, mouseX, mouseY);
        this.camera_.start(mouseX, mouseY, picking);
      }
    },
    /** Mouse move event */
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.setMousePosition(event);
      var mouseX = this.mouseX_;
      var mouseY = this.mouseY_;
      var button = this.mouseButton_;
      if (button !== 1 || this.sculpt_.allowPicking()) {
        Multimesh.RENDER_HINT = Multimesh.PICKING;
        if (this.mesh_ && button === 1)
          this.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
        else
          this.picking_.intersectionMouseMeshes(this.meshes_, mouseX, mouseY);
        if (this.sculpt_.getSymmetry() && this.mesh_)
          this.pickingSym_.intersectionMouseMesh(this.mesh_, mouseX, mouseY, true);
      }
      if (button !== 0) {
        if (button === 2) {
          this.camera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        } else if (button === 4) {
          this.camera_.zoom((mouseX - this.lastMouseX_) / 3000);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        } else if (button === 3) {
          this.camera_.rotate(mouseX, mouseY);
          Multimesh.RENDER_HINT = Multimesh.CAMERA;
        } else if (button === 1) {
          Multimesh.RENDER_HINT = Multimesh.SCULPT;
          this.sculpt_.update(this);
        }
      }
      this.lastMouseX_ = mouseX;
      this.lastMouseY_ = mouseY;
      this.render();
    },
    getIndexMesh: function (mesh) {
      var meshes = this.meshes_;
      for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
        var testMesh = meshes[i];
        // a bit ugly... but when we convert a Mesh to a Multimesh
        // we should consider the mesh as equal (an uniqueID would be cleaner...)
        if (testMesh === mesh || (testMesh.getMeshOrigin && testMesh.getMeshOrigin() === mesh))
          return i;
      }
      return -1;
    },
    /** Replace a mesh in the scene */
    replaceMesh: function (mesh, newMesh) {
      var index = this.getIndexMesh(mesh);
      if (index >= 0) this.meshes_[index] = newMesh;
      if (this.mesh_ === mesh) this.setMesh(newMesh);
    }
  };

  return SculptGL;
});