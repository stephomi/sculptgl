define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var Render = require('mesh/Render');
  var Shader = require('render/ShaderLib');
  var getOptionsURL = require('misc/getOptionsURL');

  var ShaderMERGE = Shader.MERGE;
  var ShaderUV = Shader.UV;
  var ShaderPBR = Shader.PBR;
  var ShaderMatcap = Shader.MATCAP;

  var GuiRendering = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application

    // ui rendering
    this._menu = null; // ui menu
    this._ctrlFlatShadizfng = null; // flat shading controller
    this._ctrlShowWireframe = null; // wireframe controller
    this._ctrlShaders = null; // shaders controller
    this._ctrlMatcap = null; // matcap texzfture controller
    this._ctrlUV = null; // upload a texture

    this.init(guiParent);
  };

  GuiRendering.prototype = {
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

      // filmic tonemapping
      this._ctrlFilmic = menu.addCheckbox(TR('renderingFilmic'), ShaderMERGE.FILMIC, this.onFilmic.bind(this));

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
      this._ctrlMatcap = menu.addCombobox(TR('renderingMatcap'), 0, this.onMatcapChanged.bind(this), optionMatcaps);

      // matcap load
      this._ctrlImportMatcap = menu.addButton(TR('renderingImportMatcap'), this, 'importMatcap');

      // uv texture
      this._ctrlUV = menu.addButton(TR('renderingImportUV'), this, 'importTexture');

      this._ctrlExposure = menu.addSlider(TR('renderingExposure'), 20, this.onExposureChanged.bind(this), 0, 100, 1);

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
    onFilmic: function (val) {
      ShaderMERGE.FILMIC = val;
      this._main.render();
    },
    onCurvatureChanged: function (val) {
      if (!this._main.getMesh()) return;
      this._main.getMesh().setCurvature(val / 20.0);
      this._main.render();
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
      if (!this._main.getMesh()) return;
      this._main.getMesh().setOpacity(1.0 - val / 100.0);
      this._main.render();
    },
    onShaderChanged: function (val) {
      var main = this._main;
      var mesh = main.getMesh();
      if (mesh) {
        if (val === 'UV' && !mesh.hasUV()) {
          this.updateMesh();
          window.alert('No UV on this mesh.');
        } else {
          mesh.setShaderName(val);
          main.render();
        }
      }
      this.updateVisibility();
    },
    onMatcapChanged: function (value) {
      if (!this._main.getMesh()) return;
      this._main.getMesh().setMatcap(value);
      this._main.render();
    },
    onFlatShading: function (bool) {
      if (!this._main.getMesh()) return;
      this._main.getMesh().setFlatShading(bool);
      this._main.render();
    },
    onShowWireframe: function (bool) {
      if (!this._main.getMesh()) return;
      this._main.getMesh().setShowWireframe(bool);
      this._main.render();
    },
    addEvents: function () {
      var cbLoadTex = this.loadTextureUV.bind(this);
      var cbLoadMatcap = this.loadMatcap.bind(this);
      document.getElementById('textureopen').addEventListener('change', cbLoadTex, false);
      document.getElementById('matcapopen').addEventListener('change', cbLoadMatcap, false);

      this.removeCallback = function () {
        document.getElementById('textureopen').removeEventListener('change', cbLoadTex, false);
        document.getElementById('matcapopen').removeEventListener('change', cbLoadMatcap, false);
      };
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    updateMesh: function () {
      var mesh = this._main.getMesh();
      if (!mesh) {
        this._menu.setVisibility(false);
        return;
      }
      this._menu.setVisibility(true);
      this._ctrlShaders.setValue(mesh.getShaderName(), true);
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
      var val = mesh.getShaderName();
      this._ctrlMatcapTitle.setVisibility(val === 'MATCAP');
      this._ctrlMatcap.setVisibility(val === 'MATCAP');
      this._ctrlImportMatcap.setVisibility(val === 'MATCAP');

      this._ctrlExposure.setVisibility(val === 'PBR');
      this._ctrlEnvTitle.setVisibility(val === 'PBR');
      this._ctrlEnv.setVisibility(val === 'PBR');

      this._ctrlUV.setVisibility(val === 'UV');
    },
    getFlatShading: function () {
      return this._ctrlFlatShading.getValue();
    },
    getWireframe: function () {
      return this._ctrlShowWireframe.getValue();
    },
    getShaderName: function () {
      return this._ctrlShaders.getValue();
    },
    importTexture: function () {
      document.getElementById('textureopen').click();
    },
    loadTextureUV: function (event) {
      if (event.target.files.length === 0)
        return;

      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;

      var reader = new FileReader();
      var main = this._main;
      reader.onload = function (evt) {
        // urk...
        ShaderUV.texture0 = undefined;
        ShaderUV.texPath = evt.target.result;
        main.render();
      };

      document.getElementById('textureopen').value = '';
      reader.readAsDataURL(file);
    },
    loadMatcap: function (event) {
      if (event.target.files.length === 0)
        return;

      var file = event.target.files[0];
      if (!file.type.match('image.*'))
        return;

      var reader = new FileReader();
      var main = this._main;
      var ctrl = this._ctrlMatcap;

      reader.onload = function (evt) {
        var img = new Image();
        img.src = evt.target.result;

        img.onload = function () {
          var idMatcap = ShaderMatcap.matcaps.length;
          ShaderMatcap.matcaps.push({
            name: file.name
          });

          ShaderMatcap.createTexture(main._gl, img, idMatcap);

          var entry = {};
          entry[idMatcap] = file.name;
          ctrl.addOptions(entry);
          ctrl.setValue(idMatcap);

          main.render();
        };
      };

      document.getElementById('matcapopen').value = '';
      reader.readAsDataURL(file);
    },
    importMatcap: function () {
      document.getElementById('matcapopen').click();
    },
    ////////////////
    // KEY EVENTS
    ////////////////
    onKeyUp: function (event) {
      if (getOptionsURL.getShortKey(event.which) === 'WIREFRAME' && !event.ctrlKey)
        this._ctrlShowWireframe.setValue(!this._ctrlShowWireframe.getValue());
    }
  };

  module.exports = GuiRendering;
});