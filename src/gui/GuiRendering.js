define([
  'render/Shader',
  'render/shaders/ShaderMatcap',
  'render/Render'
], function (Shader, ShaderMatcap, Render) {

  'use strict';

  function GuiRendering(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application

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
        type_: Shader.mode.MATCAP,
        material_: 0,
      };
      // render fold
      var foldRender = guiParent.addFolder('Rendering');
      var optionsShaders = {
        'Matcap': Shader.mode.MATCAP,
        'Phong': Shader.mode.PHONG,
        'Transparency': Shader.mode.TRANSPARENCY,
        'Normal shader': Shader.mode.NORMAL
      };
      this.ctrlShaders_ = foldRender.add(dummy, 'type_', optionsShaders).name('Shader');
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
      this.ctrlMatcap_ = foldRender.add(dummy, 'material_', optionMaterials).name('Material');
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
      this.ctrlFlatShading_ = foldRender.add(dummyRender, 'flatShading_').name('flat (slower)');
      this.ctrlFlatShading_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setFlatShading(value);
          main.scene_.render();
        }
      });
      this.ctrlShowWireframe_ = foldRender.add(dummyRender, 'showWireframe_').name('wireframe');
      this.ctrlShowWireframe_.onChange(function (value) {
        if (main.mesh_) {
          main.mesh_.setShowWireframe(value);
          main.scene_.render();
        }
      });
      if (Render.ONLY_DRAW_ARRAYS)
        this.ctrlShowWireframe_.__li.hidden = true;

      foldRender.open();
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
    }
  };

  return GuiRendering;
});