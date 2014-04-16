define([
  'lib/jQuery',
  'editor/Sculpt',
  'gui/Gui',
  'math3d/Camera',
  'math3d/Picking',
  'misc/Export',
  'misc/Import',
  'misc/Utils',
  'object/Background',
  'object/Mesh',
  'object/Multimesh',
  'render/Shader',
  'states/States'
], function ($, Sculpt, Gui, Camera, Picking, Export, Import, Utils, Background, Mesh, Multimesh, Shader, States) {

  'use strict';

  function SculptGL() {
    this.gl_ = null; //webgl context

    //controllers stuffs
    this.mouseX_ = 0; //the x position
    this.mouseY_ = 0; //the y position
    this.lastMouseX_ = 0; //the last x position
    this.lastMouseY_ = 0; //the last y position
    this.sumDisplacement_ = 0; //sum of the displacement mouse
    this.mouseButton_ = 0; //which mouse button is pressed
    this.cameraTimer_ = -1; //interval id (used for zqsd/wasd/arrow moves)

    //symmetry stuffs
    this.symmetry_ = false; //if symmetric sculpting is enabled
    this.continuous_ = false; //continuous sculpting
    this.sculptTimer_ = -1; //continuous interval timer
    this.ptPlane_ = [0, 0, 0]; //point origin of the plane symmetry
    this.nPlane_ = [1, 0, 0]; //normal of plane symmetry

    //core of the app
    this.states_ = new States(); //for undo-redo
    this.camera_ = new Camera(); //the camera
    this.picking_ = new Picking(this.camera_); //the ray picking
    this.pickingSym_ = new Picking(this.camera_); //the symmetrical picking
    this.sculpt_ = new Sculpt(this.states_); //sculpting management
    this.background_ = null; //the background
    this.multimesh_ = null; //the multiresolution mesh
    this.mesh_ = null; //the mesh

    //datas
    this.textures_ = {}; //textures
    this.shaders_ = {}; //shaders
    this.sphere_ = ''; //sphere

    //ui stuffs
    this.gui_ = new Gui(this); //gui
    this.focusGui_ = false; //gui

    //functions
    this.resetSphere_ = this.resetSphere; //load sphere
    this.undo_ = this.onUndo; //undo last action
    this.redo_ = this.onRedo; //redo last action
  }

  SculptGL.prototype = {
    /** Initialization */
    start: function () {
      this.initWebGL();
      this.loadShaders();
      this.gui_.initGui();
      this.onWindowResize();
      this.loadTextures();
      this.initEvents();
    },
    /** Initialize */
    initEvents: function () {
      var self = this;
      var $canvas = $('#canvas');
      $('#fileopen').change(function (event) {
        self.loadFile(event);
      });
      $('#backgroundopen').change(function (event) {
        self.loadBackground(event);
      });
      $canvas.mousedown(function (event) {
        self.onMouseDown(event);
      });
      $canvas.mouseup(function (event) {
        self.onMouseUp(event);
      });
      $canvas.mousewheel(function (event) {
        self.onMouseWheel(event);
      });
      $canvas.mousemove(function (event) {
        self.onMouseMove(event);
      });
      $canvas.mouseout(function (event) {
        self.onMouseOut(event);
      });
      $canvas[0].addEventListener('webglcontextlost', self.onContextLost, false);
      $canvas[0].addEventListener('webglcontextrestored', self.onContextRestored, false);
      $(window).keydown(function (event) {
        self.onKeyDown(event);
      });
      $(window).keyup(function (event) {
        self.onKeyUp(event);
      });
      $(window).resize(function (event) {
        self.onWindowResize(event);
      });
    },
    /** Load webgl context */
    initWebGL: function () {
      // TODO : add an option to toggle antialias if possible ?
      var attributes = {
        antialias: true,
        stencil: true
      };
      try {
        this.gl_ = $('#canvas')[0].getContext('webgl', attributes) || $('#canvas')[0].getContext('experimental-webgl', attributes);
      } catch (e) {
        window.alert('Could not initialise WebGL.');
      }
      var gl = this.gl_;
      if (gl) {
        if (gl.getExtension('OES_element_index_uint')) {
          Utils.elementIndexType = gl.UNSIGNED_INT;
          Utils.indexArrayType = Uint32Array;
        } else {
          Utils.elementIndexType = gl.UNSIGNED_SHORT;
          Utils.indexArrayType = Uint16Array;
        }
        gl.viewportWidth = $(window).width();
        gl.viewportHeight = $(window).height();
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
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
      sphereXhr.responseType = 'arraybuffer';
      sphereXhr.onload = function () {
        var reader = new FileReader();
        reader.onload = function (evt) {
          self.sphere_ = evt.target.result;
          self.resetSphere();
        };
        reader.readAsBinaryString(new Blob([this.response]));
      };
      sphereXhr.send(null);
    },
    /** Render mesh */
    render: function () {
      var gl = this.gl_;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.camera_.updateView();
      if (this.background_) {
        gl.depthMask(false);
        this.background_.render();
        gl.depthMask(true);
      }
      if (this.multimesh_)
        this.multimesh_.render(this.camera_, this.picking_);
    },
    /** Called when the window is resized */
    onWindowResize: function () {
      var newWidth = $(window).width(),
        newHeight = $(window).height();
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
    /** Key pressed event */
    onKeyDown: function (event) {
      event.stopPropagation();
      if (!this.focusGui_)
        event.preventDefault();
      var key = event.which;
      if (event.ctrlKey && key === 90) { //z key
        this.onUndo();
        return;
      } else if (event.ctrlKey && key === 89) { //y key
        this.onRedo();
        return;
      }
      var gui = this.gui_;
      switch (key) {
      case 48: // 0
      case 96: // NUMPAD 0
        gui.setSculptTool(Sculpt.tool.SCALE);
        break;
      case 49: // 1
      case 97: // NUMPAD 1
        gui.setSculptTool(Sculpt.tool.BRUSH);
        break;
      case 50: // 2
      case 98: // NUMPAD 2
        gui.setSculptTool(Sculpt.tool.INFLATE);
        break;
      case 51: // 3
      case 99: // NUMPAD 3
        gui.setSculptTool(Sculpt.tool.ROTATE);
        break;
      case 52: // 4
      case 100: // NUMPAD 4
        gui.setSculptTool(Sculpt.tool.SMOOTH);
        break;
      case 53: // 5
      case 101: // NUMPAD 5
        gui.setSculptTool(Sculpt.tool.FLATTEN);
        break;
      case 54: // 6
      case 102: // NUMPAD 6
        gui.setSculptTool(Sculpt.tool.PINCH);
        break;
      case 55: // 7
      case 103: // NUMPAD 7
        gui.setSculptTool(Sculpt.tool.CREASE);
        break;
      case 56: // 8
      case 104: // NUMPAD 8
        gui.setSculptTool(Sculpt.tool.DRAG);
        break;
      case 57: // 9
      case 105: // NUMPAD 9
        gui.setSculptTool(Sculpt.tool.COLOR);
        break;
      case 78: // N
        gui.setNegative(!this.sculpt_.negative_);
        break;
      case 37: // LEFT
      case 81: // Q
      case 65: // A
        this.camera_.moveX_ = -1;
        break;
      case 39: // RIGHT
      case 68: // D
        this.camera_.moveX_ = 1;
        break;
      case 38: // UP
      case 90: // Z
      case 87: // W
        this.camera_.moveZ_ = -1;
        break;
      case 40: // DOWN
      case 83: // S
        this.camera_.moveZ_ = 1;
        break;
      }
      var self = this;
      if (this.cameraTimer_ === -1) {
        this.cameraTimer_ = setInterval(function () {
          self.camera_.updateTranslation();
          self.render();
        }, 20);
      }
    },
    /** Key released event */
    onKeyUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var key = event.which;
      switch (key) {
      case 37: // LEFT
      case 81: // Q
      case 65: // A
      case 39: // RIGHT
      case 68: // D
        this.camera_.moveX_ = 0;
        break;
      case 38: // UP
      case 90: // Z
      case 87: // W
      case 40: // DOWN
      case 83: // S
        this.camera_.moveZ_ = 0;
        break;
      case 70: //F
        this.camera_.resetViewFront();
        this.render();
        break;
      case 84: //T
        this.camera_.resetViewTop();
        this.render();
        break;
      case 76: //L
        this.camera_.resetViewLeft();
        this.render();
        break;
      }
      if (this.cameraTimer_ !== -1 && this.camera_.moveX_ === 0 && this.camera_.moveZ_ === 0) {
        clearInterval(this.cameraTimer_);
        this.cameraTimer_ = -1;
      }
    },
    /** Mouse pressed event */
    onMouseDown: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var mouseX = this.mouseX_ = event.pageX;
      var mouseY = this.mouseY_ = event.pageY;
      var button = this.mouseButton_ = event.which;
      if (button === 1 && !event.altKey) {
        if (this.multimesh_) {
          this.sumDisplacement_ = 0;
          var tool = this.sculpt_.tool_;
          this.sculpt_.startSculpt(this);
          if (tool === Sculpt.tool.ROTATE)
            this.sculpt_.startRotate(this);
          else if (tool === Sculpt.tool.SCALE)
            this.sculpt_.startScale(this);
          else if (this.continuous_ && tool !== Sculpt.tool.DRAG) {
            var self = this;
            this.sculptTimer_ = setInterval(function () {
              self.sculpt_.sculptStroke(self);
              self.render();
            }, 20);
          } else
            this.sculpt_.sculptStroke(this);
        }
      }
      if (button === 3 || (button === 1 && this.picking_.multimesh_ === null) || (event.altKey && button !== 0)) {
        this.mouseButton_ = 3;
        if (this.camera_.usePivot_)
          this.picking_.intersectionMouseMesh(this.multimesh_, mouseX, mouseY);
        this.camera_.start(mouseX, mouseY, this.picking_);
      }
    },
    /** Mouse released event */
    onMouseUp: function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.multimesh_)
        this.multimesh_.checkLeavesUpdate();
      if (this.sculptTimer_ !== -1) {
        clearInterval(this.sculptTimer_);
        this.sculptTimer_ = -1;
      }
      this.mouseButton_ = 0;
    },
    /** Mouse out event */
    onMouseOut: function () {
      if (this.multimesh_)
        this.multimesh_.checkLeavesUpdate();
      if (this.sculptTimer_ !== -1) {
        clearInterval(this.sculptTimer_);
        this.sculptTimer_ = -1;
      }
      this.mouseButton_ = 0;
    },
    /** Mouse wheel event */
    onMouseWheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var dy = event.deltaY;
      dy = dy > 1.0 ? 1.0 : dy < -1.0 ? -1.0 : dy;
      this.camera_.zoom(dy * 0.02);
      this.render();
    },
    /** Mouse move event */
    onMouseMove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      var mouseX = this.mouseX_ = event.pageX;
      var mouseY = this.mouseY_ = event.pageY;
      var button = this.mouseButton_;
      var tool = this.sculpt_.tool_;
      var st = Sculpt.tool;
      var modifierPressed = event.altKey || event.ctrlKey || event.shiftKey;
      if (this.continuous_ && this.sculptTimer_ !== -1 && !modifierPressed) {
        return;
      }
      if (this.multimesh_ && (button !== 1 || (tool !== st.ROTATE && tool !== st.DRAG && tool !== st.SCALE)))
        this.picking_.intersectionMouseMesh(this.multimesh_, mouseX, mouseY);
      if (button === 1 && !event.altKey)
        this.sculpt_.sculptStroke(this);
      else if (button === 2 || (event.altKey && event.shiftKey && button !== 0))
        this.camera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
      else if (event.altKey && event.ctrlKey && button !== 0)
        this.camera_.zoom((mouseY - this.lastMouseY_) / 3000);
      else if (button === 3 || (event.altKey && !event.shiftKey && !event.ctrlKey && button !== 0))
        this.camera_.rotate(mouseX, mouseY);
      this.lastMouseX_ = mouseX;
      this.lastMouseY_ = mouseY;
      this.render();
    },
    /** WebGL context is lost */
    onContextLost: function () {
      window.alert('shit happens : context lost');
    },
    /** WebGL context is restored */
    onContextRestored: function () {
      window.alert('context is restored');
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
        if (fileType === 'obj')
          Import.importOBJ(evt.target.result, self.mesh_);
        else if (fileType === 'stl')
          Import.importSTL(evt.target.result, self.mesh_);
        else if (fileType === 'ply')
          Import.importPLY(evt.target.result, self.mesh_);
        self.endMeshLoad();
        $('#fileopen').replaceWith($('#fileopen').clone(true));
      };
      if (fileType === 'obj')
        reader.readAsText(file);
      else if (fileType === 'stl')
        reader.readAsBinaryString(file);
      else if (fileType === 'ply')
        reader.readAsBinaryString(file);
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
    /** Open file */
    resetSphere: function () {
      this.startMeshLoad();
      Import.importOBJ(this.sphere_, this.mesh_);
      this.endMeshLoad();
    },
    /** Initialization before loading the mesh */
    startMeshLoad: function () {
      this.mesh_ = new Mesh(this.gl_);
      this.multimesh_ = new Multimesh(this.gl_);
      this.multimesh_.meshes_.push(this.mesh_);
      this.states_.reset();
      this.states_.multimesh_ = this.multimesh_;
      this.sculpt_.multimesh_ = this.multimesh_;
      //reset flags (not necessary...)
      Mesh.TAG_FLAG = 1;
      Mesh.SCULPT_FLAG = 1;
      Mesh.STATE_FLAG = 1;
    },
    /** The loading is finished, set stuffs ... and update camera */
    endMeshLoad: function () {
      var gui = this.gui_;
      var multimesh = this.multimesh_;
      multimesh.init();
      this.camera_.reset();
      multimesh.initRender(this.textures_, this.shaders_, gui.getShader(), gui.getFlatShading(), gui.getWireframe());
      gui.updateMesh();
      this.render();
    },
    /** When the user undos an action */
    onUndo: function () {
      this.states_.undo();
      this.multimesh_.updateHistory();
      this.render();
      this.gui_.updateMesh();
    },
    /** When the user redos an action */
    onRedo: function () {
      this.states_.redo();
      this.multimesh_.updateHistory();
      this.render();
      this.gui_.updateMesh();
    }
  };

  return SculptGL;
});