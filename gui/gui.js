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
  },

  /** Initialize the general gui (on the left) */
  initGeneralGui: function (gui)
  {
    var main = this.sculptgl_;

    //Pen tablet ui stuffs
    var foldPenTablet = gui.addFolder('Wacom tablet');
    foldPenTablet.add(main, 'usePenRadius_').name('Pressure radius');
    foldPenTablet.add(main, 'usePenIntensity_').name('Pressure intensity');
    foldPenTablet.open();

    //file fold
    var foldFiles = gui.addFolder('Files (import/export)');
    foldFiles.add(main, 'resetSphere_').name('Reset sphere');
    foldFiles.add(main, 'open_').name('Import (obj, stl)');
    foldFiles.add(main, 'save_').name('Export (obj)');
    foldFiles.open();

    //Verold fold
    var foldVerold = gui.addFolder('Go to Verold !');
    foldVerold.add(main, 'keyVerold_').name('API key');
    foldVerold.add(main, 'exportVerold_').name('Upload');

    //Sketchfab fold
    var foldSketchfab = gui.addFolder('Go to Sketchfab !');
    foldSketchfab.add(main, 'keySketchfab_').name('API key');
    foldSketchfab.add(main, 'exportSketchfab_').name('Upload');

    //Camera fold
    var cameraFold = gui.addFolder('Camera');
    var optionsCamera = {
      'Spherical': Camera.mode.SPHERICAL,
      'Plane': Camera.mode.PLANE
    };
    var ctrlCamera = cameraFold.add(main.camera_, 'mode_', optionsCamera).name('Camera');
    ctrlCamera.onChange(function (value)
    {
      main.camera_.updateMode(parseInt(value, 10));
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
      'Paint (9)': Sculpt.tool.COLOR
    };
    this.ctrlSculpt_ = foldSculpt.add(main.sculpt_, 'tool_', optionsSculpt).name('Tool');
    this.ctrlSculpt_.onChange(function (value)
    {
      main.sculpt_.tool_ = parseInt(value, 10);
      var tool = main.sculpt_.tool_;
      var st = Sculpt.tool;
      self.ctrlClay_.__li.hidden = tool !== st.BRUSH;
      self.ctrlNegative_.__li.hidden = tool !== st.BRUSH && tool !== st.INFLATE && tool !== st.CREASE;
      self.ctrlContinuous_.__li.hidden = tool === st.ROTATE || tool === st.DRAG;
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
      'Subdivision': Sculpt.topo.SUBDIVISION,
      'Adaptive (!!!)': Sculpt.topo.ADAPTIVE
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
    this.ctrlDetailSubdivision_ = foldTopo.add(main.sculpt_, 'detailSubdivision_', 0, 1).name('Detail');
    this.ctrlDetailDecimation_ = foldTopo.add(main.sculpt_, 'detailDecimation_', 0, 1).name('Min edge');
    foldTopo.open();

    //mesh fold
    var foldMesh = gui.addFolder('Mesh');
    this.ctrlNbVertices_ = foldMesh.add(this, 'dummyFunc_').name('Ver : 0');
    this.ctrlNbTriangles_ = foldMesh.add(this, 'dummyFunc_').name('Tri : 0');
    var optionsShaders = {
      'Phong': Render.mode.PHONG,
      'Transparency': Render.mode.TRANSPARENCY,
      'Wireframe (slow)': Render.mode.WIREFRAME,
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
  }
};
