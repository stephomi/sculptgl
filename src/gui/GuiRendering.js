define([
  'render/Shader',
  'render/Shaders/ShaderMatcap',
  'render/Render'
], function (Shader, ShaderMatcap, Render) {

  'use strict';

  function GuiRendering(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application

    // ui info
    this.ctrlNbVertices_ = null; // display number of vertices controller
    this.ctrlNbTriangles_ = null; // display number of triangles controller

    // ui shading
    this.ctrlFlatShading_ = null; // flat shading controller
    this.ctrlShowWireframe_ = null; // wireframe controller
    this.ctrlShaders_ = null; // shaders controller
    this.ctrlMatcap_ = null; // matcap texture controller

    this.init(guiParent);
  }

  GuiRendering.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var self = this;
      var main = this.sculptgl_;
      // dummy object with empty function or startup mockup
      var dummy = {
        func_: function () {
          return;
        },
        type_: Shader.mode.MATCAP,
        material_: 0,
      };
      // mesh fold
      var foldMesh = guiParent.addFolder('Mesh');
      this.ctrlNbVertices_ = foldMesh.add(dummy, 'func_').name('Ver : 0');
      this.ctrlNbTriangles_ = foldMesh.add(dummy, 'func_').name('Tri : 0');
      var optionsShaders = {
        'Matcap': Shader.mode.MATCAP,
        'Phong': Shader.mode.PHONG,
        'Transparency': Shader.mode.TRANSPARENCY,
        'Normal shader': Shader.mode.NORMAL
      };
      this.ctrlShaders_ = foldMesh.add(dummy, 'type_', optionsShaders).name('Shader');
      this.ctrlShaders_.onChange(function (value) {
        var val = parseInt(value, 10);
        if (main.mesh_) {
          main.mesh_.setShader(val);
          main.scene_.render();
        }
        self.ctrlMatcap_.__li.hidden = val !== Shader.mode.MATCAP;
      });
      var optionMaterials = {};
      for (var i = 0, mats = ShaderMatcap.materials, l = mats.length; i < l; ++i)
        optionMaterials[mats[i].name] = i;
      this.ctrlMatcap_ = foldMesh.add(dummy, 'material_', optionMaterials).name('Material');
      this.ctrlMatcap_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setMaterial(value);
          main.scene_.render();
        }
      });
      var dummyRender = {
        flatShading_: true,
        showWireframe_: true
      };
      this.ctrlFlatShading_ = foldMesh.add(dummyRender, 'flatShading_').name('flat (slower)');
      this.ctrlFlatShading_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setFlatShading(value);
          main.scene_.render();
        }
      });
      this.ctrlShowWireframe_ = foldMesh.add(dummyRender, 'showWireframe_').name('wireframe');
      this.ctrlShowWireframe_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setShowWireframe(value);
          main.scene_.render();
        }
      });
      if (Render.ONLY_DRAW_ARRAYS)
        this.ctrlShowWireframe_.__li.hidden = true;

      foldMesh.open();
    },
    /** Update information on mesh */
    updateMesh: function (mesh) {
      var render = mesh.getRender();
      this.ctrlShaders_.object = render.shader_;
      this.ctrlShaders_.updateDisplay();
      this.ctrlFlatShading_.object = render;
      this.ctrlFlatShading_.updateDisplay();
      this.ctrlShowWireframe_.object = render;
      this.ctrlShowWireframe_.updateDisplay();
      this.ctrlMatcap_.object = render;
      this.ctrlMatcap_.updateDisplay();
      this.updateMeshInfo(mesh);
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function (mesh) {
      this.ctrlNbVertices_.name('Ver : ' + mesh.getNbVertices());
      this.ctrlNbTriangles_.name('Tri : ' + mesh.getNbTriangles());
    },
    /** Return true if flat shading is enabled */
    getFlatShading: function () {
      return this.ctrlFlatShading_.getValue();
    },
    /** Return true if wireframe is displayed */
    getWireframe: function () {
      return this.ctrlShowWireframe_.getValue();
    },
    /** Return the value of the shader */
    getShader: function () {
      return this.ctrlShaders_.getValue();
    },
  };

  return GuiRendering;
});