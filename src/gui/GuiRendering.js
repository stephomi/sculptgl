define([
  'gui/GuiTR',
  'render/Render',
  'render/Shader'
], function (TR, Render, Shader) {

  'use strict';

  var ShaderPBR = Shader.PBR;
  var ShaderMatcap = Shader.MATCAP;

  var GuiRendering = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application

    // ui rendering
    this._menu = null; // ui menu
    this._ctrlFlatShading = null; // flat shading controller
    this._ctrlShowWireframe = null; // wireframe controller
    this._ctrlShaders = null; // shaders controller
    this._ctrlMatcap = null; // matcap texture controller
    this._ctrlUV = null; // upload a texture

    this.init(guiParent);
  };

  GuiRendering.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('renderingTitle'));
      menu.close();

      // shader selection
      var optionsShaders = {};
      optionsShaders.MATCAP = TR('renderingMatcap');
      optionsShaders.PBR = TR('renderingPBR');
      optionsShaders.NORMAL = TR('renderingNormal');
      optionsShaders.UV = TR('renderingUV');
      menu.addTitle(TR('renderingShader'));
      this._ctrlShaders = menu.addCombobox('', 'PBR', this.onShaderChanged.bind(this), optionsShaders);

      // flat shading
      this._ctrlCurvature = menu.addSlider(TR('renderingCurvature'), 20, this.onCurvatureChanged.bind(this), 0, 100, 1);

      // environments
      var optionEnvs = {};
      for (var i = 0, envs = ShaderPBR.environments, l = envs.length; i < l; ++i)
        optionEnvs[i] = envs[i].name;
      this._ctrlEnvTitle = menu.addTitle(TR('renderingEnvironment'));
      this._ctrlEnv = menu.addCombobox('', ShaderPBR.idEnv, this.onEnvironmentChanged.bind(this), optionEnvs);

      // matcap texture
      var optionMatcaps = {};
      for (var j = 0, mats = ShaderMatcap.matcaps, k = mats.length; j < k; ++j)
        optionMatcaps[j] = mats[j].name;
      this._ctrlMatcapTitle = menu.addTitle(TR('renderingMaterial'));
      this._ctrlMatcap = menu.addCombobox('', 0, this.onMatcapChanged.bind(this), optionMatcaps);

      // uv texture
      this._ctrlUV = menu.addButton(TR('renderingImportUV'), this, 'importTexture');
      this._ctrlUV.setVisibility(false);

      this._ctrlExposure = menu.addSlider(TR('renderingExposure'), 20, this.onExposureChanged.bind(this), 0, 100, 1);
      this._ctrlExposure.setVisibility(false);

      menu.addTitle(TR('renderingExtra'));
      this._ctrlTransparency = menu.addSlider(TR('renderingTransparency'), 0.0, this.onTransparencyChanged.bind(this), 0, 100, 1);

      // flat shading
      this._ctrlFlatShading = menu.addCheckbox(TR('renderingFlat'), false, this.onFlatShading.bind(this));

      // wireframe
      this._ctrlShowWireframe = menu.addCheckbox(TR('renderingWireframe'), false, this.onShowWireframe.bind(this));
      if (Render.ONLY_DRAW_ARRAYS)
        this._ctrlShowWireframe.setVisibility(false);

      this.addEvents();
    },
    onCurvatureChanged: function (val) {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      mesh.getRender().setCurvature(val / 20.0);
      main.render();
    },
    onEnvironmentChanged: function (val) {
      ShaderPBR.idEnv = val;
      this._main.render();
    },
    onExposureChanged: function (val) {
      ShaderPBR.exposure = val / 20;
      this._main.render();
    },
    onTransparencyChanged: function (val) {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      mesh.getRender().setOpacity(1.0 - val / 100.0);
      main.render();
    },
    /** On shader change */
    onShaderChanged: function (val) {
      var main = this._main;
      var mesh = main.getMesh();
      if (mesh) {
        if (val === 'UV' && !mesh.hasUV()) {
          this.updateMesh();
          window.alert('No UV on this mesh.');
        } else {
          mesh.setShader(val);
          main.render();
        }
      }
      this.updateVisibility();
    },
    /** On matcap change */
    onMatcapChanged: function (value) {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      mesh.setMatcap(value);
      main.render();
    },
    /** On flat shading change */
    onFlatShading: function (bool) {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      mesh.setFlatShading(bool);
      main.render();
    },
    /** On wireframe change */
    onShowWireframe: function (bool) {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
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
      var mesh = this._main.getMesh();
      if (!mesh) {
        this._menu.setVisibility(false);
        return;
      }
      this._menu.setVisibility(true);
      this._ctrlShaders.setValue(mesh.getShaderType(), true);
      this._ctrlFlatShading.setValue(mesh.getFlatShading(), true);
      this._ctrlShowWireframe.setValue(mesh.getShowWireframe(), true);
      this._ctrlMatcap.setValue(mesh.getMatcap(), true);
      this._ctrlTransparency.setValue(100 - 100 * mesh.getOpacity(), true);
      this._ctrlCurvature.setValue(20 * mesh.getCurvature(), true);
      this.updateVisibility();
    },
    updateVisibility: function () {
      var mesh = this._main.getMesh();
      if (!mesh) return;
      var val = mesh.getRender()._shader._type;
      this._ctrlMatcapTitle.setVisibility(val === 'MATCAP');
      this._ctrlMatcap.setVisibility(val === 'MATCAP');
      this._ctrlUV.setVisibility(val === 'UV');
      this._ctrlExposure.setVisibility(val === 'PBR');
      this._ctrlEnvTitle.setVisibility(val === 'PBR');
      this._ctrlEnv.setVisibility(val === 'PBR');
    },
    /** Return true if flat shading is enabled */
    getFlatShading: function () {
      return this._ctrlFlatShading.getValue();
    },
    /** Return true if wireframe is displayed */
    getWireframe: function () {
      return this._ctrlShowWireframe.getValue();
    },
    /** Return the value of the shader */
    getShader: function () {
      return this._ctrlShaders.getValue();
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
      var main = this._main;
      reader.onload = function (evt) {
        // urk...
        var shaderUV = Shader.UV;
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