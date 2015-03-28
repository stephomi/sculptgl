define([
  'gui/GuiTR',
  'render/Render',
  'render/Shader',
  'render/shaders/ShaderBase'
], function (TR, Render, Shader, ShaderBase) {

  'use strict';

  var ShaderPBR = Shader[Shader.mode.PBR];
  var ShaderMatcap = Shader[Shader.mode.MATCAP];

  var GuiRendering = function (guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application

    // ui rendering
    this.menu_ = null; // ui menu
    this.ctrlFlatShading_ = null; // flat shading controller
    this.ctrlShowWireframe_ = null; // wireframe controller
    this.ctrlShaders_ = null; // shaders controller
    this.ctrlMatcap_ = null; // matcap texture controller
    this.ctrlUV_ = null; // upload a texture

    this.init(guiParent);
  };

  GuiRendering.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('renderingTitle'));
      menu.close();

      // shader selection
      var optionsShaders = {};
      optionsShaders[Shader.mode.MATCAP] = TR('renderingMatcap');
      optionsShaders[Shader.mode.PBR] = TR('renderingPBR');
      optionsShaders[Shader.mode.NORMAL] = TR('renderingNormal');
      optionsShaders[Shader.mode.UV] = TR('renderingUV');
      menu.addTitle(TR('renderingShader'));
      this.ctrlShaders_ = menu.addCombobox('', Shader.mode.PBR, this.onShaderChanged.bind(this), optionsShaders);

      // flat shading
      menu.addCheckbox(TR('renderingCurvature'), ShaderBase.useCurvature, this.onCurvatureChanged.bind(this));

      // environments
      var optionEnvs = {};
      for (var i = 0, envs = ShaderPBR.environments, l = envs.length; i < l; ++i)
        optionEnvs[i] = envs[i].name;
      this.ctrlEnvTitle_ = menu.addTitle(TR('renderingEnvironment'));
      this.ctrlEnv_ = menu.addCombobox('', ShaderPBR.idEnv, this.onEnvironmentChanged.bind(this), optionEnvs);

      // matcap texture
      var optionMatcaps = {};
      for (var j = 0, mats = ShaderMatcap.matcaps, k = mats.length; j < k; ++j)
        optionMatcaps[j] = mats[j].name;
      this.ctrlMatcapTitle_ = menu.addTitle(TR('renderingMaterial'));
      this.ctrlMatcap_ = menu.addCombobox('', 0, this.onMatcapChanged.bind(this), optionMatcaps);

      // uv texture
      this.ctrlUV_ = menu.addButton(TR('renderingImportUV'), this, 'importTexture');
      this.ctrlUV_.setVisibility(false);

      this.ctrlExposure_ = menu.addSlider(TR('renderingExposure'), 20, this.onExposureChanged.bind(this), 0, 100, 1);
      this.ctrlExposure_.setVisibility(false);

      menu.addTitle(TR('renderingExtra'));
      menu.addSlider(TR('renderingTransparency'), 0.0, this.onTransparencyChanged.bind(this), 0, 100, 1);

      // flat shading
      this.ctrlFlatShading_ = menu.addCheckbox(TR('renderingFlat'), false, this.onFlatShading.bind(this));

      // wireframe
      this.ctrlShowWireframe_ = menu.addCheckbox(TR('renderingWireframe'), false, this.onShowWireframe.bind(this));
      if (Render.ONLY_DRAW_ARRAYS)
        this.ctrlShowWireframe_.setVisibility(false);

      this.addEvents();
    },
    onCurvatureChanged: function (val) {
      // TODO push in the replayer...
      ShaderBase.useCurvature = val;
      this.main_.render();
    },
    onEnvironmentChanged: function (val) {
      // TODO push in the replayer...
      ShaderPBR.idEnv = val;
      this.main_.render();
    },
    onExposureChanged: function (val) {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushExposure(val);

      ShaderPBR.exposure = val / 20;
      main.render();
    },
    onTransparencyChanged: function (val) {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushTransparency(val);

      mesh.getRender().setOpacity(1.0 - val / 100.0);
      main.render();
    },
    /** On shader change */
    onShaderChanged: function (value) {
      var main = this.main_;
      var val = parseInt(value, 10);
      var mesh = main.getMesh();
      if (mesh) {
        if (val === Shader.mode.UV && !mesh.hasUV()) {
          this.updateMesh();
          window.alert('No UV on this mesh.');
        } else {

          if (!main.isReplayed())
            main.getReplayWriter().pushAction('SHADER_SELECT', value);

          mesh.setShader(val);
          main.render();
        }
      }
      this.updateVisibility();
    },
    /** On matcap change */
    onMatcapChanged: function (value) {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MATCAP_SELECT', value);

      mesh.setMatcap(value);
      main.render();
    },
    /** On flat shading change */
    onFlatShading: function (bool) {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('FLAT_SHADING', bool);

      mesh.setFlatShading(bool);
      main.render();
    },
    /** On wireframe change */
    onShowWireframe: function (bool) {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('SHOW_WIREFRAME', bool);

      mesh.setShowWireframe(bool);
      main.render();
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
      if (!mesh) {
        this.menu_.setVisibility(false);
        return;
      }
      this.menu_.setVisibility(true);
      var render = mesh.getRender();
      this.ctrlShaders_.setValue(render.shader_.type_, true);
      this.ctrlFlatShading_.setValue(render.flatShading_, true);
      this.ctrlShowWireframe_.setValue(render.showWireframe_, true);
      this.ctrlMatcap_.setValue(render.matcap_, true);
      this.updateVisibility();
    },
    updateVisibility: function () {
      var mesh = this.main_.getMesh();
      if (!mesh) return;
      var val = mesh.getRender().shader_.type_;
      this.ctrlMatcapTitle_.setVisibility(val === Shader.mode.MATCAP);
      this.ctrlMatcap_.setVisibility(val === Shader.mode.MATCAP);
      this.ctrlUV_.setVisibility(val === Shader.mode.UV);
      this.ctrlExposure_.setVisibility(val === Shader.mode.PBR);
      this.ctrlEnvTitle_.setVisibility(val === Shader.mode.PBR);
      this.ctrlEnv_.setVisibility(val === Shader.mode.PBR);
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