define([
  'render/Shader',
  'render/Render'
], function (Shader, Render) {

  'use strict';

  function GuiRendering(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; //main application

    //ui info
    this.ctrlNbVertices_ = null; //display number of vertices controller
    this.ctrlNbTriangles_ = null; //display number of triangles controller

    //ui shading
    this.ctrlFlatShading_ = null; //flat shading controller
    this.ctrlShowWireframe_ = null; //wireframe controller
    this.ctrlShaders_ = null; //shaders controller

    this.init(guiParent);
  }

  GuiRendering.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var main = this.sculptgl_;
      //dummy object with empty function
      var dummy = {
        dummyFunc_: function () {
          return;
        }
      };
      //mesh fold
      var foldMesh = guiParent.addFolder('Mesh');
      this.ctrlNbVertices_ = foldMesh.add(dummy, 'dummyFunc_').name('Ver : 0');
      this.ctrlNbTriangles_ = foldMesh.add(dummy, 'dummyFunc_').name('Tri : 0');
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
        if (main.mesh_) {
          main.mesh_.updateShaders(parseInt(value, 10), main.scene_.textures_, main.scene_.shaders_);
          main.scene_.render();
        }
      });
      this.ctrlFlatShading_ = foldMesh.add(new Render(), 'flatShading_').name('flat (slower)');
      this.ctrlFlatShading_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setFlatShading(value);
          main.scene_.render();
        }
      });
      this.ctrlShowWireframe_ = foldMesh.add(new Render(), 'showWireframe_').name('wireframe');
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
    updateMesh: function (mul) {
      this.ctrlShaders_.object = mul.render_.shader_;
      this.ctrlShaders_.updateDisplay();
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