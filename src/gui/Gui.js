define([
  'lib/jQuery',
  'lib/Dat',
  'lib/FileSaver',
  'math3d/Camera',
  'editor/Sculpt',
  'object/Shader',
  'object/Render',
  'states/StateMultiresolution',
  'misc/Export',
  'misc/Tablet'
], function ($, Dat, saveAs, Camera, Sculpt, Shader, Render, StateMultiresolution, Export, Tablet) {

  'use strict';

  function Gui(sculptgl) {
    this.sculptgl_ = sculptgl; //main application

    //ui shading
    this.ctrlColor_ = null; //color controller
    this.ctrlFlatShading_ = null; //flat shading controller
    this.ctrlShowWireframe_ = null; //wireframe controller
    this.ctrlShaders_ = null; //shaders controller

    //ui info
    this.ctrlNbVertices_ = null; //display number of vertices controller
    this.ctrlNbTriangles_ = null; //display number of triangles controller

    //ui sculpting
    this.ctrlSculpt_ = null; //sculpt controller
    this.ctrlClay_ = null; //clay sculpting controller
    this.ctrlNegative_ = null; //negative sculpting controller
    this.ctrlContinuous_ = null; //continuous sculpting controller
    this.ctrlSymmetry_ = null; //symmetry controller
    this.ctrlSculptCulling_ = null; //sculpt culling controller
    this.ctrlRadius_ = null; //radius controller
    this.ctrlIntensity_ = null; //intensity sculpting controller

    //ui camera
    this.ctrlCameraType_ = null; //camera type controller
    this.ctrlFov_ = null; //vertical field of view controller
    this.resetCamera_ = this.resetCamera; //reset camera position and rotation

    //files functions
    this.open_ = this.openFile; //open file button (trigger hidden html input...)
    this.saveOBJ_ = this.saveFileAsOBJ; //save mesh as OBJ
    this.savePLY_ = this.saveFileAsPLY; //save mesh as PLY
    this.saveSTL_ = this.saveFileAsSTL; //save mesh as STL

    //online exporters
    this.keySketchfab_ = ''; //sketchfab api key
    this.exportSketchfab_ = this.exportSketchfab; //upload file on sketchfab

    //background functions
    this.resetBg_ = this.resetBackground; //reset background
    this.importBg_ = this.importBackground; //import background image

    //misc
    this.dummyFunc_ = function () {}; //empty function... stupid trick to get a simple button in dat.gui
  }

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      var guiGeneral = new Dat.GUI();
      guiGeneral.domElement.style.position = 'absolute';
      guiGeneral.domElement.style.height = '650px';
      this.initGeneralGui(guiGeneral);

      var guiEditing = new Dat.GUI();
      this.initEditingGui(guiEditing);

      var main = this.sculptgl_;
      guiGeneral.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, false);
      guiEditing.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, false);
      guiGeneral.domElement.addEventListener('mouseover', function () {
        main.focusGui_ = true;
      }, false);
      guiEditing.domElement.addEventListener('mouseover', function () {
        main.focusGui_ = true;
      }, false);
    },
    /** Initialize the general gui (on the left) */
    initGeneralGui: function (gui) {
      var main = this.sculptgl_;
      var self = this;

      //Pen tablet ui stuffs
      var foldPenTablet = gui.addFolder('Wacom tablet');
      foldPenTablet.add(Tablet, 'useOnRadius').name('Pressure radius');
      foldPenTablet.add(Tablet, 'useOnIntensity').name('Pressure intensity');

      //file fold
      var foldFiles = gui.addFolder('Files (import/export)');
      foldFiles.add(main, 'resetSphere_').name('Reset sphere');
      foldFiles.add(this, 'open_').name('Import (obj, ply, stl)');
      foldFiles.add(this, 'saveOBJ_').name('Export (obj)');
      foldFiles.add(this, 'savePLY_').name('Export (ply)');
      foldFiles.add(this, 'saveSTL_').name('Export (stl)');

      //Sketchfab fold
      var foldSketchfab = gui.addFolder('Go to Sketchfab !');
      foldSketchfab.add(this, 'keySketchfab_').name('API key');
      foldSketchfab.add(this, 'exportSketchfab_').name('Upload');

      //Camera fold
      var cameraFold = gui.addFolder('Camera');
      cameraFold.add(this, 'resetCamera_').name('Reset');
      var optionsCameraMode = {
        'Spherical': Camera.mode.SPHERICAL,
        'Plane': Camera.mode.PLANE
      };
      var ctrlCameraMode = cameraFold.add(main.camera_, 'mode_', optionsCameraMode).name('Mode');
      ctrlCameraMode.onChange(function (value) {
        main.camera_.mode_ = parseInt(value, 10);
      });
      var optionsCameraType = {
        'Perspective': Camera.projType.PERSPECTIVE,
        'Orthographic': Camera.projType.ORTHOGRAPHIC
      };
      this.ctrlCameraType_ = cameraFold.add(main.camera_, 'type_', optionsCameraType).name('Type');
      this.ctrlCameraType_.onChange(function (value) {
        main.camera_.type_ = parseInt(value, 10);
        self.ctrlFov_.__li.hidden = main.camera_.type_ === Camera.projType.ORTHOGRAPHIC;
        main.camera_.updateProjection();
        main.render();
      });
      this.ctrlFov_ = cameraFold.add(main.camera_, 'fov_', 10, 150).name('Fov');
      this.ctrlFov_.onChange(function () {
        main.camera_.updateProjection();
        main.render();
      });
      var ctrlPivot = cameraFold.add(main.camera_, 'usePivot_').name('Picking pivot');
      ctrlPivot.onChange(function () {
        main.camera_.toggleUsePivot();
        main.render();
      });
      cameraFold.open();

      //background fold
      var backgroundFold = gui.addFolder('background');
      backgroundFold.add(this, 'resetBg_').name('Reset');
      backgroundFold.add(this, 'importBg_').name('Import (jpg, png...)');
      backgroundFold.open();

      //history fold
      var foldHistory = gui.addFolder('History');
      foldHistory.add(main, 'undo_').name('Undo (Ctrl+Z)');
      foldHistory.add(main, 'redo_').name('Redo (Ctrl+Y)');
      foldHistory.open();
    },
    /** Initialize the mesh editing gui (on the right) */
    initEditingGui: function (gui) {
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
      this.ctrlSculpt_.onChange(function (value) {
        main.sculpt_.tool_ = parseInt(value, 10);
        var tool = main.sculpt_.tool_;
        var st = Sculpt.tool;
        self.ctrlClay_.__li.hidden = tool !== st.BRUSH;
        self.ctrlNegative_.__li.hidden = tool !== st.BRUSH && tool !== st.INFLATE && tool !== st.FLATTEN && tool !== st.CREASE;
        self.ctrlContinuous_.__li.hidden = tool === st.ROTATE || tool === st.DRAG || tool === st.SCALE;
        self.ctrlIntensity_.__li.hidden = self.ctrlContinuous_.__li.hidden;
        self.ctrlColor_.__li.hidden = tool !== st.COLOR;
      });
      this.ctrlClay_ = foldSculpt.add(main.sculpt_, 'clay_').name('Clay');
      this.ctrlNegative_ = foldSculpt.add(main.sculpt_, 'negative_').name('Negative (N)');
      this.ctrlContinuous_ = foldSculpt.add(main, 'continuous_').name('Continuous');
      this.ctrlSymmetry_ = foldSculpt.add(main, 'symmetry_').name('Symmetry');
      this.ctrlSculptCulling_ = foldSculpt.add(main.sculpt_, 'culling_').name('Sculpt culling');
      this.ctrlRadius_ = foldSculpt.add(main.picking_, 'rDisplay_', 5, 200).name('Radius');
      this.ctrlIntensity_ = foldSculpt.add(main.sculpt_, 'intensity_', 0, 1).name('Intensity');
      foldSculpt.open();

      //multires fold
      var foldMultires = gui.addFolder('Multires');
      foldMultires.add(this, 'subdivide');
      foldMultires.add(this, 'lower');
      foldMultires.add(this, 'higher');
      foldMultires.open();

      //mesh fold
      var foldMesh = gui.addFolder('Mesh');
      this.ctrlNbVertices_ = foldMesh.add(this, 'dummyFunc_').name('Ver : 0');
      this.ctrlNbTriangles_ = foldMesh.add(this, 'dummyFunc_').name('Tri : 0');
      var optionsShaders = {
        'Phong': Shader.mode.PHONG,
        'Transparency': Shader.mode.TRANSPARENCY,
        'Normal shader': Shader.mode.NORMAL,
        'Clay': Shader.mode.MATERIAL,
        'Chavant': Shader.mode.MATERIAL + 1,
        'Skin': Shader.mode.MATERIAL + 2,
        'Drink': Shader.mode.MATERIAL + 3,
        'Red velvet': Shader.mode.MATERIAL + 4,
        'Orange': Shader.mode.MATERIAL + 5,
        'Bronze': Shader.mode.MATERIAL + 6
      };
      this.ctrlShaders_ = foldMesh.add(new Shader(), 'type_', optionsShaders).name('Shader');
      this.ctrlShaders_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.updateShaders(parseInt(value, 10), main.textures_, main.shaders_);
          main.render();
        }
      });
      this.ctrlFlatShading_ = foldMesh.add(new Render(), 'flatShading_').name('flat (slower)');
      this.ctrlFlatShading_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.setFlatShading(value);
          main.render();
        }
      });
      this.ctrlShowWireframe_ = foldMesh.add(new Render(), 'showWireframe_').name('wireframe');
      this.ctrlShowWireframe_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.setWireframe(value);
          main.render();
        }
      });

      this.ctrlColor_ = foldMesh.addColor(main.sculpt_, 'color_').name('Color');
      this.ctrlColor_.onChange(function (value) {
        if (value.length === 3) { // rgb [255, 255, 255]
          main.sculpt_.color_ = [value[0], value[1], value[2]];
        } else if (value.length === 7) { // hex (24 bits style) "#ffaabb"
          var intVal = parseInt(value.slice(1), 16);
          main.sculpt_.color_ = [(intVal >> 16), (intVal >> 8 & 0xff), (intVal & 0xff)];
        } else // fuck it
          main.sculpt_.color_ = [168, 66, 66];
      });
      this.ctrlColor_.__li.hidden = true;
      foldMesh.open();
    },
    /** Update information on mesh */
    updateMesh: function () {
      var main = this.sculptgl_;
      if (!main.mesh_ || !main.multimesh_)
        return;
      var mesh = main.multimesh_.getCurrent();
      this.ctrlShaders_.object = main.multimesh_.render_.shader_;
      this.ctrlShaders_.updateDisplay();
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function (nbVertices, nbTriangles) {
      this.ctrlNbVertices_.name('Ver : ' + nbVertices);
      this.ctrlNbTriangles_.name('Tri : ' + nbTriangles);
    },
    /** Open file */
    openFile: function () {
      $('#fileopen').trigger('click');
    },
    /** Reset background */
    resetBackground: function () {
      var bg = this.sculptgl_.background_;
      if (bg) {
        var gl = bg.gl_;
        gl.deleteTexture(bg.backgroundLoc_);
        this.sculptgl_.background_ = null;
      }
    },
    /** Immort background */
    resetCamera: function () {
      this.sculptgl_.camera_.reset();
      this.sculptgl_.render();
    },
    /** Immort background */
    importBackground: function () {
      $('#backgroundopen').trigger('click');
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportOBJ(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportPLY(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportSTL(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      if (!this.sculptgl_.mesh_)
        return;
      if (this.keySketchfab_ === '') {
        window.alert('Please enter a sketchfab API Key.');
        return;
      }
      Export.exportSketchfab(this.sculptgl_.mesh_, this.keySketchfab_);
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ !== mul.meshes_.length - 1)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.SUBDIVISION));
      var mesh = mul.addLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    /** Go to lower subdivision level */
    lower: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel === 0)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.LOWER));
      var mesh = mul.lowerLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    /** Go to higher subdivision level */
    higher: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ === mul.meshes_.length - 1)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.HIGHER));
      var mesh = mul.higherLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    getFlatShading: function () {
      return this.ctrlFlatShading_.getValue();
    },
    getWireframe: function () {
      return this.ctrlShowWireframe_.getValue();
    },
    getShader: function () {
      return this.ctrlShaders_.getValue();
    },
    setSculptTool: function (value) {
      this.ctrlSculpt_.setValue(value);
    },
    setNegative: function (value) {
      this.ctrlNegative_.setValue(value);
    }
  };

  return Gui;
});