define([
  'gui/GuiTR',
  'render/Shader',
  'render/shaders/ShaderMatcap',
  'render/Render'
], function (TR, Shader, ShaderMatcap, Render) {

  'use strict';

  function GuiRendering(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application

    // ui shading
    this.ctrlFlatShading_ = null; // flat shading controller
    this.ctrlShowWireframe_ = null; // wireframe controller
    this.ctrlShaders_ = null; // shaders controller
    this.ctrlMatcap_ = null; // matcap texture controller
    this.ctrlUV_ = null; // upload a texture

    this.init(guiParent);
  }

  GuiRendering.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = guiParent.addMenu(TR('renderingTitle'));

      // display grid
      menu.addCheckbox(TR('renderingGrid'), this.main_.showGrid_, this.onShowGridChange.bind(this));

      // shader selection
      var optionsShaders = {};
      optionsShaders[Shader.mode.MATCAP] = TR('renderingMatcap');
      optionsShaders[Shader.mode.PHONG] = TR('renderingPhong');
      optionsShaders[Shader.mode.TRANSPARENCY] = TR('renderingTransparency');
      optionsShaders[Shader.mode.NORMAL] = TR('renderingNormal');
      optionsShaders[Shader.mode.UV] = TR('renderingUV');
      menu.addTitle(TR('renderingShader'));
      this.ctrlShaders_ = menu.addCombobox('', Shader.mode.MATCAP, this.onShaderChange.bind(this), optionsShaders);

      // matcap texture
      var optionMaterials = {};
      for (var i = 0, mats = ShaderMatcap.getMaterials(), l = mats.length; i < l; ++i)
        optionMaterials[i] = mats[i].name;
      this.ctrlMatcapTitle_ = menu.addTitle(TR('renderingMaterial'));
      this.ctrlMatcap_ = menu.addCombobox('', 0, this.onMaterialChange.bind(this), optionMaterials);

      // uv texture
      this.ctrlUV_ = menu.addButton(TR('renderingImportUV'), this, 'importTexture');
      this.ctrlUV_.setVisibility(false);

      menu.addTitle(TR('renderingExtra'));
      // flat shading
      this.ctrlFlatShading_ = menu.addCheckbox(TR('renderingFlat'), false, this.onFlatChange.bind(this));

      // wireframe
      this.ctrlShowWireframe_ = menu.addCheckbox(TR('renderingWireframe'), false, this.onWireframeChange.bind(this));
      if (Render.ONLY_DRAW_ARRAYS)
        this.ctrlShowWireframe_.setVisibility(false);

      this.addEvents();
    },
    onShowGridChange: function (val) {
      this.main_.showGrid_ = val;
      this.main_.render();
    },
    /** On shader change */
    onShaderChange: function (value) {
      var val = parseInt(value, 10);
      var mesh = this.main_.getMesh();
      if (mesh) {
        mesh.setShader(val);
        this.main_.render();
      }
      this.ctrlMatcapTitle_.setVisibility(val === Shader.mode.MATCAP);
      this.ctrlMatcap_.setVisibility(val === Shader.mode.MATCAP);
      this.ctrlUV_.setVisibility(val === Shader.mode.UV);
    },
    /** On material change */
    onMaterialChange: function (value) {
      var mesh = this.main_.getMesh();
      if (mesh) {
        mesh.setMaterial(value);
        this.main_.render();
      }
    },
    /** On flat shading change */
    onFlatChange: function (value) {
      var mesh = this.main_.getMesh();
      if (mesh) {
        mesh.setFlatShading(value);
        this.main_.render();
      }
    },
    /** On wireframe change */
    onWireframeChange: function (value) {
      var mesh = this.main_.getMesh();
      if (mesh) {
        mesh.setShowWireframe(value);
        this.main_.render();
      }
    },
    /** Add events */
    addEvents: function () {
      var cbLoadTex = this.loadTexture.bind(this);
      document.getElementById('textureopen').addEventListener('change', cbLoadTex, false);
      this.removeCallback = function () {
        document.getElementById('textureopen').removeEventListener('change', cbLoadTex, false);
      };
    },
    /** Remove events */
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    /** Update information on mesh */
    updateMesh: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var render = mesh.getRender();
      this.ctrlShaders_.setValue(render.shader_.type_, true);
      this.ctrlFlatShading_.setValue(render.flatShading_, true);
      this.ctrlShowWireframe_.setValue(render.showWireframe_, true);
      this.ctrlMatcap_.setValue(render.material_, true);
      var val = mesh.getRender().shader_.type_;
      this.ctrlMatcap_.setVisibility(val === Shader.mode.MATCAP);
      this.ctrlUV_.setVisibility(val === Shader.mode.UV);
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
    /** Immort texture */
    importTexture: function () {
      document.getElementById('textureopen').click();
    },
    /** Load texture */
    loadTexture: function (event) {
      if (event.target.files.length === 0)
        return;
      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;
      var reader = new FileReader();
      var main = this.main_;
      reader.onload = function (evt) {
        // urk...
        var shaderUV = Shader[Shader.mode.UV];
        shaderUV.texture0 = undefined;
        shaderUV.texPath = evt.target.result;
        main.render();
        document.getElementById('textureopen').value = '';
      };
      reader.readAsDataURL(file);
    },
  };

  return GuiRendering;
});