'use strict';

function Gui(sculptgl)
{
  this.sculptgl_ = sculptgl; //main application

  //ui stuffs
  this.ctrlColor_ = null; //color controller
  this.ctrlShaders_ = null; //shaders controller
  this.ctrlSculpt_ = null; //sculpt controller
  this.ctrlContinuous_ = null; //continuous sculpting controller
  this.ctrlClay_ = null; //clay sculpting controller
  this.ctrlNegative_ = null; //negative sculpting controller
  this.ctrlIntensity_ = null; //intensity sculpting controller
  this.ctrlDetailSubdivision_ = null; //subdivision detail slider
  this.ctrlDetailDecimation_ = null; //decimation detail slider
  this.ctrlNbVertices_ = null; //display number of vertices controller
  this.ctrlNbTriangles_ = null; //display number of triangles controller
  this.ctrlFov_ = null; //vertical field of view controller

  //files functions
  this.open_ = this.openFile; //open file button (trigger hidden html input...)
  this.saveOBJ_ = this.saveFileAsOBJ; //save mesh as OBJ
  this.savePLY_ = this.saveFileAsPLY; //save mesh as PLY
  this.saveSTL_ = this.saveFileAsSTL; //save mesh as STL

  //online exporters
  this.keyVerold_ = ''; //verold api key
  this.exportVerold_ = this.exportVerold; //upload file on verold
  this.keySketchfab_ = ''; //sketchfab api key
  this.exportSketchfab_ = this.exportSketchfab; //upload file on sketchfab

  //misc
  this.dummyFunc_ = function () {}; //empty function... stupid trick to get a simple button in dat.gui
}

Gui.prototype = {
  /** Initialize dat-gui stuffs */
  initGui: function ()
  {
    var guiGeneral = new dat.GUI();
    guiGeneral.domElement.style.position = 'absolute';
    guiGeneral.domElement.style.height = '600px';
    this.initGeneralGui(guiGeneral);

    var guiEditing = new dat.GUI();
    this.initEditingGui(guiEditing);

    var main = this.sculptgl_;
    guiGeneral.domElement.addEventListener('mouseout', function ()
    {
      main.focusGui_ = false;
    }, false);
    guiEditing.domElement.addEventListener('mouseout', function ()
    {
      main.focusGui_ = false;
    }, false);
    guiGeneral.domElement.addEventListener('mouseover', function ()
    {
      main.focusGui_ = true;
    }, false);
    guiEditing.domElement.addEventListener('mouseover', function ()
    {
      main.focusGui_ = true;
    }, false);
  },

  /** Initialize the general gui (on the left) */
  initGeneralGui: function (gui)
  {
    var main = this.sculptgl_;
    var self = this;

    //Pen tablet ui stuffs
    var foldPenTablet = gui.addFolder('Wacom tablet');
    foldPenTablet.add(main, 'usePenRadius_').name('Pressure radius');
    foldPenTablet.add(main, 'usePenIntensity_').name('Pressure intensity');
    foldPenTablet.open();

    //file fold
    var foldFiles = gui.addFolder('Files (import/export)');
    foldFiles.add(main, 'resetSphere_').name('Reset sphere');
    foldFiles.add(this, 'open_').name('Import (obj, ply, stl)');
    foldFiles.add(this, 'saveOBJ_').name('Export (obj)');
    foldFiles.add(this, 'savePLY_').name('Export (ply)');
    foldFiles.add(this, 'saveSTL_').name('Export (stl)');
    foldFiles.open();

    //Verold fold
    var foldVerold = gui.addFolder('Go to Verold !');
    foldVerold.add(this, 'keyVerold_').name('API key');
    foldVerold.add(this, 'exportVerold_').name('Upload');

    //Sketchfab fold
    var foldSketchfab = gui.addFolder('Go to Sketchfab !');
    foldSketchfab.add(this, 'keySketchfab_').name('API key');
    foldSketchfab.add(this, 'exportSketchfab_').name('Upload');

    //Camera fold
    var cameraFold = gui.addFolder('Camera');
    var optionsCameraMode = {
      'Spherical': Camera.mode.SPHERICAL,
      'Plane': Camera.mode.PLANE
    };
    var ctrlCameraMode = cameraFold.add(main.camera_, 'mode_', optionsCameraMode).name('Mode');
    ctrlCameraMode.onChange(function (value)
    {
      main.camera_.mode_ = parseInt(value, 10);
    });
    var optionsCameraType = {
      'Perspective': Camera.projType.PERSPECTIVE,
      'Orthographic': Camera.projType.ORTHOGRAPHIC
    };
    var ctrlCameraType = cameraFold.add(main.camera_, 'type_', optionsCameraType).name('Type');
    ctrlCameraType.onChange(function (value)
    {
      main.camera_.type_ = parseInt(value, 10);
      self.ctrlFov_.__li.hidden = main.camera_.type_ === Camera.projType.ORTHOGRAPHIC;
      main.camera_.updateProjection();
      main.render();
    });
    this.ctrlFov_ = cameraFold.add(main.camera_, 'fov_', 10, 150).name('Fov');
    this.ctrlFov_.onChange(function ()
    {
      main.camera_.updateProjection();
      main.render();
    });
    var ctrlPivot = cameraFold.add(main.camera_, 'usePivot_').name('Picking pivot');
    ctrlPivot.onChange(function ()
    {
      main.camera_.center_ = [0, 0, 0];
      main.camera_.transX_ = 0;
      main.camera_.transY_ = 0;
      main.render();
    });
    cameraFold.open();

    //history fold
    var foldHistory = gui.addFolder('History');
    foldHistory.add(main, 'undo_').name('Undo (Ctrl+Z)');
    foldHistory.add(main, 'redo_').name('Redo (Ctrl+Y)');
    foldHistory.open();
  },

  /** Initialize the mesh editing gui (on the right) */
  initEditingGui: function (gui)
  {
    var main = this.sculptgl_;
    var self = this;

    //sculpt fold
    var foldSculpt = gui.addFolder('Sculpt');
    var optionsSculpt = {
      'Brush (1)': Sculpt.tool.BRUSH,
      'Inflate (2)': Sculpt.tool.INFLATE,
      'Rotate (3)': Sculpt.tool.ROTATE,
      'Smooth (4)': Sculpt.tool.SMOOTH,
      'Flatten (5)': Sculpt.tool.FLATTEN,
      'Pinch (6)': Sculpt.tool.PINCH,
      'Crease (7)': Sculpt.tool.CREASE,
      'Drag (8)': Sculpt.tool.DRAG,
      'Paint (9)': Sculpt.tool.COLOR,
      'Scale (0)': Sculpt.tool.SCALE
    };
    this.ctrlSculpt_ = foldSculpt.add(main.sculpt_, 'tool_', optionsSculpt).name('Tool');
    this.ctrlSculpt_.onChange(function (value)
    {
      main.sculpt_.tool_ = parseInt(value, 10);
      var tool = main.sculpt_.tool_;
      var st = Sculpt.tool;
      self.ctrlClay_.__li.hidden = tool !== st.BRUSH;
      self.ctrlNegative_.__li.hidden = tool !== st.BRUSH && tool !== st.INFLATE && tool !== st.CREASE;
      self.ctrlContinuous_.__li.hidden = tool === st.ROTATE || tool === st.DRAG || tool === st.SCALE;
      self.ctrlIntensity_.__li.hidden = self.ctrlContinuous_.__li.hidden;
      self.ctrlColor_.__li.hidden = tool !== st.COLOR;
    });
    this.ctrlClay_ = foldSculpt.add(main.sculpt_, 'clay_').name('Clay');
    this.ctrlNegative_ = foldSculpt.add(main.sculpt_, 'negative_').name('Negative (N)');
    this.ctrlContinuous_ = foldSculpt.add(main, 'continuous_').name('Continuous');
    foldSculpt.add(main, 'symmetry_').name('Symmetry');
    foldSculpt.add(main.sculpt_, 'culling_').name('Sculpt culling');
    foldSculpt.add(main.picking_, 'rDisplay_', 20, 200).name('Radius');
    this.ctrlIntensity_ = foldSculpt.add(main.sculpt_, 'intensity_', 0, 1).name('Intensity');
    foldSculpt.open();

    //topo fold
    var foldTopo = gui.addFolder('Topology');
    var optionsTopo = {
      'Static': Sculpt.topo.STATIC,
      'Dynamic': Sculpt.topo.SUBDIVISION,
      'Adaptive (!)': Sculpt.topo.ADAPTIVE
    };
    var ctrlTopo = foldTopo.add(main.sculpt_, 'topo_', optionsTopo).name('Tool');
    ctrlTopo.onChange(function (value)
    {
      main.sculpt_.topo_ = parseInt(value, 10);
      var topo = main.sculpt_.topo_;
      var st = Sculpt.topo;
      self.ctrlDetailSubdivision_.__li.hidden = topo === st.STATIC;
      self.ctrlDetailDecimation_.__li.hidden = topo !== st.SUBDIVISION;
    });
    this.ctrlDetailSubdivision_ = foldTopo.add(main.sculpt_, 'detailSubdivision_', 0, 1).name('Subdivision');
    this.ctrlDetailDecimation_ = foldTopo.add(main.sculpt_, 'detailDecimation_', 0, 1).name('Decimation');
    foldTopo.open();

    //mesh fold
    var foldMesh = gui.addFolder('Mesh');
    this.ctrlNbVertices_ = foldMesh.add(this, 'dummyFunc_').name('Ver : 0');
    this.ctrlNbTriangles_ = foldMesh.add(this, 'dummyFunc_').name('Tri : 0');
    var optionsShaders = {
      'Phong': Render.mode.PHONG,
      'Transparency': Render.mode.TRANSPARENCY,
      'Wireframe (slow)': Render.mode.WIREFRAME,
      'Normal shader': Render.mode.NORMAL,
      'Clay': Render.mode.MATERIAL,
      'Chavant': Render.mode.MATERIAL + 1,
      'Skin': Render.mode.MATERIAL + 2,
      'Drink': Render.mode.MATERIAL + 3,
      'Red velvet': Render.mode.MATERIAL + 4,
      'Orange': Render.mode.MATERIAL + 5,
      'Bronze': Render.mode.MATERIAL + 6,
      'Normal soft': Render.mode.MATERIAL + 7
    };
    this.ctrlShaders_ = foldMesh.add(new Render(), 'shaderType_', optionsShaders).name('Shader');
    this.ctrlShaders_.onChange(function (value)
    {
      if (main.mesh_)
      {
        main.mesh_.render_.updateShaders(parseInt(value, 10), main.textures_, main.shaders_);
        main.mesh_.updateBuffers();
        main.render();
      }
    });
    this.ctrlColor_ = foldMesh.addColor(main.sculpt_, 'color_').name('Color');
    foldMesh.open();
  },

  /** Update information on mesh */
  updateMesh: function (mesh)
  {
    if (!mesh)
      return;
    this.ctrlShaders_.object = mesh.render_;
    this.ctrlShaders_.updateDisplay();
    this.updateMeshInfo(mesh.vertices_.length, mesh.triangles_.length);
  },

  /** Update number of vertices and triangles */
  updateMeshInfo: function (nbVertices, nbTriangles)
  {
    this.ctrlNbVertices_.name('Ver : ' + nbVertices);
    this.ctrlNbTriangles_.name('Tri : ' + nbTriangles);
  },

  /** Open file */
  openFile: function ()
  {
    $('#fileopen').trigger('click');
  },

  /** Save file as OBJ*/
  saveFileAsOBJ: function ()
  {
    if (!this.sculptgl_.mesh_)
      return;
    var data = [Export.exportOBJ(this.sculptgl_.mesh_)];
    var blob = new Blob(data,
    {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, 'yourMesh.obj');
  },

  /** Save file as PLY */
  saveFileAsPLY: function ()
  {
    if (!this.sculptgl_.mesh_)
      return;
    var data = [Export.exportPLY(this.sculptgl_.mesh_)];
    var blob = new Blob(data,
    {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, 'yourMesh.ply');
  },

  /** Save file as STL */
  saveFileAsSTL: function ()
  {
    if (!this.sculptgl_.mesh_)
      return;
    var data = [Export.exportSTL(this.sculptgl_.mesh_)];
    var blob = new Blob(data,
    {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, 'yourMesh.stl');
  },

  /** Export to Verold */
  exportVerold: function ()
  {
    if (!this.sculptgl_.mesh_)
      return;
    if (this.keyVerold_ === '')
    {
      alert('Please enter a verold API Key.');
      return;
    }
    Export.exportVerold(this.sculptgl_.mesh_, this.keyVerold_);
  },

  /** Export to Sketchfab */
  exportSketchfab: function ()
  {
    if (!this.sculptgl_.mesh_)
      return;
    if (this.keySketchfab_ === '')
    {
      alert('Please enter a sketchfab API Key.');
      return;
    }
    Export.exportSketchfab(this.sculptgl_.mesh_, this.keySketchfab_);
  }
};