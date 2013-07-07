'use strict';

function SculptGL()
{
  this.gl_ = null; //webgl context

  //controllers stuffs
  this.lastMouseX_ = 0; //the last position of the mouse in x
  this.lastMouseY_ = 0; //the last position of the mouse in y
  this.sumDisplacement_ = 0; //sum of the displacement mouse
  this.mouseButton_ = 0; //which mouse button is pressed
  this.cameraTimer_ = -1; //interval id

  //core of the app
  this.states_ = new States(); //for undo-redo
  this.camera_ = new Camera(); //the camera
  this.picking_ = new Picking(this.camera_); //the ray picking
  this.sculpt_ = new Sculpt(this.states_); //sculpting management
  this.mesh_ = null; //the mesh

  //datas
  this.textures_ = []; //textures
  this.shaders_ = {}; //shaders
  this.sphere_ = ''; //sphere

  //ui stuffs
  this.ctrlColor_ = null; //color controller
  this.ctrlShaders_ = null; //shaders controller
  this.ctrlNbVertices_ = null; //display number of vertices controller
  this.ctrlNbTriangles_ = null; //display number of triangles controller

  //functions
  this.resetSphere_ = this.resetSphere; //load sphere
  this.open_ = this.openFile; //open file button (trigger hidden html input...)
  this.save_ = this.saveFile; //save file function
  this.undo_ = this.onUndo; //undo last action
  this.redo_ = this.onRedo; //redo last action
  this.dummyFunc_ = function () {}; //empty function... stupid trick to get a simple button in dat.gui
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
    this.initEvents();
    this.initWebGL();
    this.loadShaders();
    this.initGui();
    this.onWindowResize();
    this.loadTextures();
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
    try
    {
      this.gl_ = $('#canvas')[0].getContext('webgl') || $('#canvas')[0].getContext('experimental-webgl');
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

  /** Initialize dat-gui stuffs */
  initGui: function ()
  {
    var guiGeneral = new dat.GUI();
    guiGeneral.domElement.style.position = 'absolute';
    guiGeneral.domElement.style.height = '300px';
    this.initGeneralGui(guiGeneral);

    var guiEditing = new dat.GUI();
    this.initEditingGui(guiEditing);
  },

  /** Initialize the general gui (on the left) */
  initGeneralGui: function (gui)
  {
    var self = this;

    //file fold
    var foldFiles = gui.addFolder('Files (import/export)');
    foldFiles.add(this, 'resetSphere_').name('Reset sphere');
    foldFiles.add(this, 'open_').name('Load OBJ file');
    foldFiles.add(this, 'save_').name('Save OBJ file');
    foldFiles.open();

    //Camera fold
    var cameraFold = gui.addFolder('Camera');
    var optionsCamera = {
      'Spherical': Camera.mode.SPHERICAL,
      'Plane': Camera.mode.PLANE
    };
    var ctrlCamera = cameraFold.add(this.camera_, 'mode_', optionsCamera).name('Camera');
    ctrlCamera.onChange(function (value)
    {
      self.camera_.updateMode(parseInt(value, 10));
      self.render();
    });
    cameraFold.open();

    //history fold
    var foldHistory = gui.addFolder('History');
    foldHistory.add(this, 'undo_').name('Undo (Ctrl+Z)');
    foldHistory.add(this, 'redo_').name('Redo (Ctrl+Y)');
    foldHistory.open();
  },

  /** Initialize the mesh editing gui (on the right) */
  initEditingGui: function (gui)
  {
    var self = this;

    //mesh fold
    var foldMesh = gui.addFolder('Mesh');
    this.ctrlNbVertices_ = foldMesh.add(this, 'dummyFunc_').name('Ver : 0');
    this.ctrlNbTriangles_ = foldMesh.add(this, 'dummyFunc_').name('Tri : 0');
    this.ctrlColor_ = foldMesh.addColor(new Render(), 'color_').name('Color');
    this.ctrlColor_.onChange(function ()
    {
      self.render();
    });
    var optionsShaders = {
      'Phong': Render.mode.PHONG,
      'Wireframe (slow)': Render.mode.WIREFRAME,
      'Transparency': Render.mode.TRANSPARENCY,
      'Clay': Render.mode.MATERIAL,
      'Chavant': Render.mode.MATERIAL + 1,
      'Skin': Render.mode.MATERIAL + 2,
      'Drink': Render.mode.MATERIAL + 3,
      'Red velvet': Render.mode.MATERIAL + 4,
      'Orange': Render.mode.MATERIAL + 5,
      'Bronze': Render.mode.MATERIAL + 6
    };
    this.ctrlShaders_ = foldMesh.add(new Render(), 'shaderType_', optionsShaders).name('Shader');
    this.ctrlShaders_.onChange(function (value)
    {
      if (self.mesh_)
      {
        self.mesh_.render_.updateShaders(parseInt(value, 10), self.textures_, self.shaders_);
        self.mesh_.updateBuffers();
        self.render();
      }
    });
    foldMesh.open();

    //sculpt fold
    var foldSculpt = gui.addFolder('Sculpt');
    var optionsSculpt = {
      'Brush': Sculpt.tool.BRUSH,
      'Inflate': Sculpt.tool.INFLATE,
      'Rotate': Sculpt.tool.ROTATE,
      'Smooth': Sculpt.tool.SMOOTH,
      'Flatten': Sculpt.tool.FLATTEN
    };
    var ctrlSculpt = foldSculpt.add(this.sculpt_, 'tool_', optionsSculpt).name('Tool');
    ctrlSculpt.onChange(function (value)
    {
      self.sculpt_.tool_ = parseInt(value, 10);
    });
    foldSculpt.add(this.sculpt_, 'negative_').name('Negative');
    foldSculpt.add(this.picking_, 'rDisplay_', 20, 200).name('Radius');
    foldSculpt.add(this.sculpt_, 'intensity_', 0, 1).name('Intensity');
    foldSculpt.open();

    //topo fold
    var foldTopo = gui.addFolder('Topology');
    var optionsTopo = {
      'Static': Sculpt.topo.STATIC,
      'Subdivision': Sculpt.topo.SUBDIVISION,
      'Decimation': Sculpt.topo.DECIMATION,
      'Uniformisation': Sculpt.topo.UNIFORMISATION,
      'Adaptive (!!!)': Sculpt.topo.ADAPTIVE
    };
    var ctrlTopo = foldTopo.add(this.sculpt_, 'topo_', optionsTopo).name('Tool');
    ctrlTopo.onChange(function (value)
    {
      self.sculpt_.topo_ = parseInt(value, 10);
    });
    foldTopo.add(this.sculpt_, 'detail_', 0, 1).name('Detail');
    foldTopo.open();
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
    if (key === 37 || key === 81 || key === 65) //left q a
      this.camera_.moveX_ = -1;
    else if (key === 39 || key === 68) //right d
      this.camera_.moveX_ = 1;
    if (key === 38 || key === 90 || key === 87) //up z w
      this.camera_.moveZ_ = -1;
    else if (key === 40 || key === 83) //down s
      this.camera_.moveZ_ = 1;
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
    var key = event.which;
    if (key === 37 || key === 81 || key === 65 || key === 39 || key === 68) //left q a right d
      this.camera_.moveX_ = 0;
    if (key === 38 || key === 90 || key === 87 || key === 40 || key === 83) //up z w down s
      this.camera_.moveZ_ = 0;
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
    if (button === 1)
      this.camera_.start(mouseX, mouseY);
    else if (button === 3)
    {
      if (this.mesh_)
      {
        this.states_.start();
        if (this.sculpt_.tool_ === Sculpt.tool.ROTATE)
          this.sculpt_.startRotate(this.picking_, mouseX, mouseY);
      }
    }
  },

  /** Mouse released event */
  onMouseUp: function (event)
  {
    event.stopPropagation();
    event.preventDefault();
    if (this.mesh_)
      this.mesh_.checkLeavesUpdate();
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
    if (this.mesh_ && this.mouseButton_ !== 3)
      this.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
    if (this.mouseButton_ === 1)
      this.camera_.rotate(mouseX, mouseY);
    else if (this.mouseButton_ === 2)
      this.camera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
    else if (this.mouseButton_ === 3)
    {
      if (this.sculpt_.tool_ !== Sculpt.tool.ROTATE)
        this.sculptStroke(mouseX, mouseY);
      else if (this.picking_.mesh_)
      {
        this.picking_.pickVerticesInSphere(this.picking_.rWorldSqr_);
        this.sculpt_.sculptMesh(this.picking_, mouseX, mouseY, this.lastMouseX_, this.lastMouseY_);
      }
      this.mesh_.updateBuffers();
      this.ctrlNbVertices_.name('Ver : ' + this.mesh_.vertices_.length);
      this.ctrlNbTriangles_.name('Tri : ' + this.mesh_.triangles_.length);
    }
    this.lastMouseX_ = mouseX;
    this.lastMouseY_ = mouseY;
    this.render();
  },

  /** Make a brush stroke */
  sculptStroke: function (mouseX, mouseY)
  {
    var picking = this.picking_;
    var dx = mouseX - this.lastMouseX_,
      dy = mouseY - this.lastMouseY_;
    var dist = Math.sqrt(dx * dx + dy * dy);
    this.sumDisplacement_ += dist;
    var minSpacing = 0.2 * picking.rDisplay_;
    var step = dist / Math.floor(dist / minSpacing);
    dx /= dist;
    dy /= dist;
    mouseX = this.lastMouseX_;
    mouseY = this.lastMouseY_;
    if (this.sumDisplacement_ > minSpacing * 50.0)
      this.sumDisplacement_ = 0;
    else if (this.sumDisplacement_ > minSpacing)
    {
      this.sumDisplacement_ = 0;
      for (var i = 0; i < dist; i += step)
      {
        picking.intersectionMouseMesh(this.mesh_, mouseX, mouseY);
        if (!picking.mesh_)
          break;
        picking.pickVerticesInSphere(picking.rWorldSqr_);
        this.sculpt_.sculptMesh(picking);
        mouseX += dx * step;
        mouseY += dy * step;
      }
    }
  },

  /** Mouse out event */
  onMouseOut: function ()
  {
    this.mouseButton_ = 0;
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
    if (!name.endsWith('.obj'))
      return;
    var reader = new FileReader();
    var self = this;
    reader.onload = function (evt)
    {
      self.startMeshLoad();
      Files.loadOBJ(evt.target.result, self.mesh_);
      self.endMeshLoad();
    };
    reader.readAsText(file);
  },

  /** Open file */
  resetSphere: function ()
  {
    this.startMeshLoad();
    Files.loadOBJ(this.sphere_, this.mesh_);
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
    mesh.initMesh(this.textures_, this.shaders_);
    mesh.moveTo([0, 0, 0]);
    var length = vec3.dist(mesh.octree_.aabbLoose_.max_, mesh.octree_.aabbLoose_.min_);
    this.camera_.reset();
    this.camera_.globalScale_ = length;
    this.camera_.zoom(-0.4);
    this.updateGuiMesh();
    this.render();
  },

  /** Update information on mesh */
  updateGuiMesh: function ()
  {
    if (!this.mesh_)
      return;
    var mesh = this.mesh_;
    this.ctrlColor_.object = mesh.render_;
    this.ctrlColor_.updateDisplay();
    this.ctrlShaders_.object = mesh.render_;
    this.ctrlShaders_.updateDisplay();
    this.ctrlNbVertices_.name('Ver : ' + mesh.vertices_.length);
    this.ctrlNbTriangles_.name('Tri : ' + mesh.triangles_.length);
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

  /** When the user undos an action */
  onUndo: function ()
  {
    this.states_.undo();
    this.render();
    this.updateGuiMesh();
  },

  /** When the user redos an action */
  onRedo: function ()
  {
    this.states_.redo();
    this.render();
    this.updateGuiMesh();
  }
};