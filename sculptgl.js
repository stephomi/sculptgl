'use strict';

function SculptGL()
{
  this.gl_ = null; //webgl context

  //controllers stuffs
  this.lastMouseX_ = 0; //the last position of the mouse in x
  this.lastMouseY_ = 0; //the last position of the mouse in y
  this.sumDisplacement_ = 0; //sum of the displacement mouse
  this.mouseButton_ = 0; //which mouse button is pressed
  this.cameraTimer_ = -1; //interval id (used for zqsd/wasd/arrow moves)
  this.usePenRadius_ = true; //the pen pressure acts on the tool's radius
  this.usePenIntensity_ = false; //the pen pressure acts on the tool's intensity

  //symmetry stuffs
  this.symmetry_ = false; //if symmetric sculpting is enabled
  this.continuous_ = false; //continuous sculpting
  this.sculptTimer_ = -1; //continuous interval timer
  this.pressureRadius_ = 0; //for continuous sculpting
  this.pressureIntensity_ = 0; //for continuous sculpting
  this.mouseX_ = 0; //for continuous sculpting
  this.mouseY_ = 0; //for continuous sculpting
  this.ptPlane_ = [0, 0, 0]; //point origin of the plane symmetry
  this.nPlane_ = [1, 0, 0]; //normal of plane symmetry

  //core of the app
  this.states_ = new States(); //for undo-redo
  this.camera_ = new Camera(); //the camera
  this.picking_ = new Picking(this.camera_); //the ray picking
  this.pickingSym_ = new Picking(this.camera_); //the symmetrical picking
  this.sculpt_ = new Sculpt(this.states_); //sculpting management
  this.mesh_ = null; //the mesh

  //datas
  this.textures_ = []; //textures
  this.shaders_ = {}; //shaders
  this.sphere_ = ''; //sphere

  //ui stuffs
  this.gui_ = new Gui(this); //gui

  //functions
  this.resetSphere_ = this.resetSphere; //load sphere
  this.open_ = this.openFile; //open file button (trigger hidden html input...)
  this.save_ = this.saveFile; //save file function
  this.undo_ = this.onUndo; //undo last action
  this.redo_ = this.onRedo; //redo last action

  //exporters
  this.keyVerold_ = ''; //verold api key
  this.exportVerold_ = this.exportVerold; //upload file on verold
  this.keySketchfab_ = ''; //sketchfab api key
  this.exportSketchfab_ = this.exportSketchfab; //upload file on sketchfab
}

SculptGL.elementIndexType = 0; //element index type (ushort or uint)
SculptGL.indexArrayType = Uint16Array; //typed array for index element (uint16Array or uint32Array)

SculptGL.prototype = {
  /** Initialization */
  start: function ()
  {
    var self = this;
    $('#fileopen').change(function (event)
    {
      self.loadFile(event);
    });
    this.initWebGL();
    this.loadShaders();
    this.gui_.initGui();
    this.onWindowResize();
    this.loadTextures();
    this.initEvents();
  },

  /** Initialize */
  initEvents: function ()
  {
    var self = this;
    var $canvas = $('#canvas');
    $canvas.mousedown(function (event)
    {
      self.onMouseDown(event);
    });
    $canvas.mouseup(function (event)
    {
      self.onMouseUp(event);
    });
    $canvas.mousewheel(function (event, delta)
    {
      self.onMouseWheel(event, delta);
    });
    $canvas.mousemove(function (event)
    {
      self.onMouseMove(event);
    });
    $canvas.mouseout(function (event)
    {
      self.onMouseOut(event);
    });
    $canvas[0].addEventListener('webglcontextlost', self.onContextLost, false);
    $canvas[0].addEventListener('webglcontextrestored', self.onContextRestored, false);
    $(window).keydown(function (event)
    {
      self.onKeyDown(event);
    });
    $(window).keyup(function (event)
    {
      self.onKeyUp(event);
    });
    $(window).resize(function (event)
    {
      self.onWindowResize(event);
    });
  },

  /** Load webgl context */
  initWebGL: function ()
  {
    var attributes = {
      antialias: false,
      stencil: true
    };
    try
    {
      this.gl_ = $('#canvas')[0].getContext('webgl', attributes) || $('#canvas')[0].getContext('experimental-webgl', attributes);
    }
    catch (e)
    {
      alert('Could not initialise WebGL.');
    }
    var gl = this.gl_;
    if (gl)
    {
      if (gl.getExtension('OES_element_index_uint'))
      {
        SculptGL.elementIndexType = gl.UNSIGNED_INT;
        SculptGL.indexArrayType = Uint32Array;
      }
      else
      {
        SculptGL.elementIndexType = gl.UNSIGNED_SHORT;
        SculptGL.indexArrayType = Uint16Array;
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
  loadTextures: function ()
  {
    var mat1 = new Image();
    var self = this;
    mat1.onload = function ()
    {
      self.loadSphere();
    };
    mat1.src = 'ressources/clay.jpg';
    var mat2 = new Image();
    mat2.src = 'ressources/chavant.jpg';
    var mat3 = new Image();
    mat3.src = 'ressources/skin.jpg';
    var mat4 = new Image();
    mat4.src = 'ressources/drink.jpg';
    var mat5 = new Image();
    mat5.src = 'ressources/redvelvet.jpg';
    var mat6 = new Image();
    mat6.src = 'ressources/orange.jpg';
    var mat7 = new Image();
    mat7.src = 'ressources/bronze.jpg';
    this.textures_.push(mat1, mat2, mat3, mat4, mat5, mat6, mat7);
  },

  /** Load shaders as a string */
  loadShaders: function ()
  {
    var xhrShader = function (path)
    {
      var shaderXhr = new XMLHttpRequest();
      shaderXhr.open('GET', path, false);
      shaderXhr.send(null);
      return shaderXhr.responseText;
    };
    var shaders = this.shaders_;
    shaders.phongVertex = xhrShader('shaders/phongVertex.glsl');
    shaders.phongFragment = xhrShader('shaders/phongFragment.glsl');
    shaders.wireframeVertex = xhrShader('shaders/wireframeVertex.glsl');
    shaders.wireframeFragment = xhrShader('shaders/wireframeFragment.glsl');
    shaders.transparencyVertex = xhrShader('shaders/transparencyVertex.glsl');
    shaders.transparencyFragment = xhrShader('shaders/transparencyFragment.glsl');
    shaders.reflectionVertex = xhrShader('shaders/reflectionVertex.glsl');
    shaders.reflectionFragment = xhrShader('shaders/reflectionFragment.glsl');
  },

  /** Load the sphere */
  loadSphere: function ()
  {
    var sphereXhr = new XMLHttpRequest();
    sphereXhr.open('GET', 'ressources/sphere.obj', true);
    var self = this;
    sphereXhr.onload = function ()
    {
      self.sphere_ = this.responseText;
      self.resetSphere();
    };
    sphereXhr.send(null);
  },

  /** Render mesh */
  render: function ()
  {
    var gl = this.gl_;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.camera_.updateView();
    if (this.mesh_)
      this.mesh_.render(this.camera_, this.picking_);
  },

  /** Called when the window is resized */
  onWindowResize: function ()
  {
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
  onKeyDown: function (event)
  {
    event.stopPropagation();
    var key = event.which;
    if (event.ctrlKey && key === 90) //z key
    {
      this.onUndo();
      return;
    }
    else if (event.ctrlKey && key === 89) //y key
    {
      this.onRedo();
      return;
    }
    switch (key)
    {
    case 49: // 1
    case 97: // NUMPAD 1
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.BRUSH);
      break;
    case 50: // 2
    case 98: // NUMPAD 2
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.INFLATE);
      break;
    case 51: // 3
    case 99: // NUMPAD 3
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.ROTATE);
      break;
    case 52: // 4
    case 100: // NUMPAD 4
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.SMOOTH);
      break;
    case 53: // 5
    case 101: // NUMPAD 5
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.FLATTEN);
      break;
    case 54: // 6
    case 102: // NUMPAD 6
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.PINCH);
      break;
    case 55: // 7
    case 103: // NUMPAD 7
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.CREASE);
      break;
    case 56: // 8
    case 104: // NUMPAD 8
      this.gui_.ctrlSculpt_.setValue(Sculpt.tool.DRAG);
      break;
    case 78: // N
      this.gui_.ctrlNegative_.setValue(!this.sculpt_.negative_);
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
    if (this.cameraTimer_ === -1)
      this.cameraTimer_ = setInterval(function ()
      {
        self.camera_.updateTranslation();
        self.render();
      }, 20);
  },

  /** Key released event */
  onKeyUp: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    var key = event.which;
    switch (key)
    {
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
    }
    if (this.cameraTimer_ !== -1 && this.camera_.moveX_ === 0 && this.camera_.moveZ_ === 0)
    {
      clearInterval(this.cameraTimer_);
      this.cameraTimer_ = -1;
    }
  },

  /** Mouse pressed event */
  onMouseDown: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    var mouseX = event.pageX,
      mouseY = event.pageY;
    this.mouseButton_ = event.which;
    var button = event.which;
    var pressure = Tablet.pressure();
    var pressureRadius = this.usePenRadius_ ? pressure : 1;
    var pressureIntensity = this.usePenIntensity_ ? pressure : 1;
    if (button === 1)
    {
      if (this.mesh_)
      {
        this.sumDisplacement_ = 0;
        this.states_.start();
        if (this.sculpt_.tool_ === Sculpt.tool.ROTATE)
          this.sculpt_.startRotate(this.picking_, mouseX, mouseY, this.pickingSym_, this.ptPlane_, this.nPlane_, this.symmetry_);
        else if (this.continuous_ && this.sculpt_.tool_ !== Sculpt.tool.DRAG)
        {
          this.pressureRadius_ = pressureRadius;
          this.pressureIntensity_ = pressureIntensity;
          this.mouseX_ = mouseX;
          this.mouseY_ = mouseY;
          var self = this;
          this.sculptTimer_ = setInterval(function ()
          {
            self.sculpt_.sculptStroke(self.mouseX_, self.mouseY_, self.pressureRadius_, self.pressureIntensity_, self);
            self.render();
          }, 20);
        }
        else
          this.sculpt_.sculptStroke(mouseX, mouseY, pressureRadius, pressureIntensity, this);
      }
    }
    else if (button === 3)
      this.camera_.start(mouseX, mouseY);
  },

  /** Mouse released event */
  onMouseUp: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    if (this.mesh_)
      this.mesh_.checkLeavesUpdate();
    if (this.sculptTimer_ !== -1)
    {
      clearInterval(this.sculptTimer_);
      this.sculptTimer_ = -1;
    }
    this.mouseButton_ = 0;
  },

  /** Mouse out event */
  onMouseOut: function ()
  {
    if (this.mesh_)
      this.mesh_.checkLeavesUpdate();
    if (this.sculptTimer_ !== -1)
    {
      clearInterval(this.sculptTimer_);
      this.sculptTimer_ = -1;
    }
    this.mouseButton_ = 0;
  },

  /** Mouse wheel event */
  onMouseWheel: function (event, delta)
  {
    event.stopPropagation();
    event.preventDefault();
    this.camera_.zoom(delta / 100);
    this.render();
  },

  /** Mouse move event */
  onMouseMove: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    var mouseX = event.pageX,
      mouseY = event.pageY;
    var button = this.mouseButton_;
    var tool = this.sculpt_.tool_;
    var pressure = Tablet.pressure();
    var pressureRadius = this.usePenRadius_ ? pressure : 1;
    var pressureIntensity = this.usePenIntensity_ ? pressure : 1;
    if (this.continuous_ && this.sculptTimer_ !== -1)
    {
      this.pressureRadius_ = pressureRadius;
      this.pressureIntensity_ = pressureIntensity;
      this.mouseX_ = mouseX;
      this.mouseY_ = mouseY;
      return;
    }
    if (this.mesh_ && (button !== 1 || (tool !== Sculpt.tool.ROTATE && tool !== Sculpt.tool.DRAG)))
      this.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY, pressureRadius);
    if (button === 1)
    {
      if (tool !== Sculpt.tool.ROTATE)
        this.sculpt_.sculptStroke(mouseX, mouseY, pressureRadius, pressureIntensity, this);
      else if (this.picking_.mesh_)
      {
        this.picking_.pickVerticesInSphere(this.picking_.rWorldSqr_);
        this.sculpt_.sculptMesh(this.picking_, pressureIntensity, false, mouseX, mouseY, this.lastMouseX_, this.lastMouseY_);
        if (this.symmetry_)
        {
          this.pickingSym_.pickVerticesInSphere(this.pickingSym_.rWorldSqr_);
          this.sculpt_.sculptMesh(this.pickingSym_, pressureIntensity, true, this.lastMouseX_, this.lastMouseY_, mouseX, mouseY);
        }
        this.mesh_.updateBuffers();
      }
      this.gui_.updateMeshInfo(this.mesh_.vertices_.length, this.mesh_.triangles_.length)
    }
    else if (button === 3)
      this.camera_.rotate(mouseX, mouseY);
    else if (button === 2)
      this.camera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
    this.lastMouseX_ = mouseX;
    this.lastMouseY_ = mouseY;
    this.render();
  },

  /** WebGL context is lost */
  onContextLost: function ()
  {
    alert('shit happens : context lost');
  },

  /** WebGL context is restored */
  onContextRestored: function ()
  {
    alert('context is restored');
  },

  /** Load file */
  loadFile: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    if (event.target.files.length === 0)
      return;
    var file = event.target.files[0];
    var name = file.name;
    if (!name.endsWith('.obj') && !name.endsWith('.stl'))
      return;
    var reader = new FileReader();
    var self = this;
    reader.onload = function (evt)
    {
      self.startMeshLoad();
      if (name.endsWith('.obj'))
        Files.importOBJ(evt.target.result, self.mesh_);
      else
        Files.importSTL(evt.target.result, self.mesh_);
      self.endMeshLoad();
      $('#fileopen').replaceWith($('#fileopen').clone(true));
    };
    if (name.endsWith('.obj'))
      reader.readAsText(file);
    else
      reader.readAsBinaryString(file);
  },

  /** Open file */
  resetSphere: function ()
  {
    this.startMeshLoad();
    Files.importOBJ(this.sphere_, this.mesh_);
    this.endMeshLoad();
  },

  /** Initialization before loading the mesh */
  startMeshLoad: function ()
  {
    this.mesh_ = new Mesh(this.gl_);
    this.states_.reset();
    this.states_.mesh_ = this.mesh_;
    this.sculpt_.mesh_ = this.mesh_;
    //reset flags (not necessary...)
    Mesh.stateMask_ = 1;
    Vertex.tagMask_ = 1;
    Vertex.sculptMask_ = 1;
    Triangle.tagMask_ = 1;
  },

  /** The loading is finished, set stuffs ... and update camera */
  endMeshLoad: function ()
  {
    var mesh = this.mesh_;
    mesh.render_.shaderType_ = Render.mode.MATERIAL;
    this.gui_.ctrlColor_.__li.hidden = true; //ugly hack
    mesh.initMesh(this.textures_, this.shaders_);
    mesh.moveTo([0, 0, 0]);
    var length = vec3.dist(mesh.octree_.aabbLoose_.max_, mesh.octree_.aabbLoose_.min_);
    this.camera_.reset();
    this.camera_.globalScale_ = length;
    this.camera_.zoom(-0.4);
    this.gui_.updateMesh(mesh);
    this.render();
  },

  /** Open file */
  openFile: function ()
  {
    $('#fileopen').trigger('click');
  },

  /** Save file */
  saveFile: function ()
  {
    if (!this.mesh_)
      return;
    var data = [Files.exportOBJ(this.mesh_)];
    var blob = new Blob(data,
    {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, 'yourMesh.obj');
  },

  /** Export to Verold */
  exportVerold: function ()
  {
    if (!this.mesh_)
      return;
    if (this.keyVerold_ === '')
    {
      alert('Please enter a verold API Key.');
      return;
    }
    Files.exportVerold(this.mesh_, this.keyVerold_);
  },

  /** Export to Sketchfab */
  exportSketchfab: function ()
  {
    if (!this.mesh_)
      return;
    if (this.keySketchfab_ === '')
    {
      alert('Please enter a sketchfab API Key.');
      return;
    }
    Files.exportSketchfab(this.mesh_, this.keySketchfab_);
  },

  /** When the user undos an action */
  onUndo: function ()
  {
    this.states_.undo();
    this.render();
    this.gui_.updateMesh(this.mesh_);
  },

  /** When the user redos an action */
  onRedo: function ()
  {
    this.states_.redo();
    this.render();
    this.gui_.updateMesh(this.mesh_);
  }
};