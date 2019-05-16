import TR from 'gui/GuiTR';
import RenderData from 'mesh/RenderData';
import Shader from 'render/ShaderLib';
import getOptionsURL from 'misc/getOptionsURL';
import Enums from 'misc/Enums';

var ShaderMERGE = Shader[Enums.Shader.MERGE];
var ShaderUV = Shader[Enums.Shader.UV];
var ShaderPBR = Shader[Enums.Shader.PBR];
var ShaderMatcap = Shader[Enums.Shader.MATCAP];

class GuiRendering {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application

    // ui rendering
    this._menu = null; // ui menu
    this._ctrlFlatShadizfng = null; // flat shading controller
    this._ctrlShowWireframe = null; // wireframe controller
    this._ctrlShaders = null; // shaders controller
    this._ctrlMatcap = null; // matcap texzfture controller
    this._ctrlUV = null; // upload a texture

    this.init(guiParent);
  }

  init(guiParent) {
    var menu = this._menu = guiParent.addMenu(TR('renderingTitle'));
    menu.close();

    // shader selection
    var optionsShaders = [];
    optionsShaders[Enums.Shader.MATCAP] = TR('renderingMatcap');
    optionsShaders[Enums.Shader.PBR] = TR('renderingPBR');
    optionsShaders[Enums.Shader.NORMAL] = TR('renderingNormal');
    optionsShaders[Enums.Shader.UV] = TR('renderingUV');
    menu.addTitle(TR('renderingShader'));
    this._ctrlShaders = menu.addCombobox('', Enums.Shader.MATCAP, this.onShaderChanged.bind(this), optionsShaders);

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

    this._ctrlExposure = menu.addSlider(TR('renderingExposure'), 1, this.onExposureChanged.bind(this), 0, 5, 0.001);
    this.onUpdateCtrlExposure();

    menu.addTitle(TR('renderingExtra'));
    this._ctrlTransparency = menu.addSlider(TR('renderingTransparency'), 0.0, this.onTransparencyChanged.bind(this), 0, 100, 1);

    // flat shading
    this._ctrlFlatShading = menu.addCheckbox(TR('renderingFlat'), false, this.onFlatShading.bind(this));

    // wireframe
    this._ctrlShowWireframe = menu.addCheckbox(TR('renderingWireframe'), false, this.onShowWireframe.bind(this));
    if (RenderData.ONLY_DRAW_ARRAYS)
      this._ctrlShowWireframe.setVisibility(false);

    this.addEvents();
  }

  onFilmic(val) {
    ShaderMERGE.FILMIC = val;
    this._main.render();
  }

  onCurvatureChanged(val) {
    if (!this._main.getMesh()) return;
    this._main.getMesh().setCurvature(val / 20.0);
    this._main.render();
  }

  onEnvironmentChanged(val) {
    ShaderPBR.idEnv = val;
    this.onUpdateCtrlExposure();
    this._main.render();
  }

  onUpdateCtrlExposure() {
    this._ctrlExposure.setValue(ShaderPBR.environments[ShaderPBR.idEnv].exposure);
  }

  onExposureChanged(val) {
    ShaderPBR.exposure = val;
    this._main.render();
  }

  onTransparencyChanged(val) {
    var meshes = this._main.getSelectedMeshes();
    for (var i = 0, nb = meshes.length; i < nb; ++i) {
      meshes[i].setOpacity(1.0 - val / 100.0);
    }
    this._main.render();
  }

  onShaderChanged(val) {
    var main = this._main;

    var warning = false;
    var meshes = this._main.getSelectedMeshes();
    for (var i = 0, nb = meshes.length; i < nb; ++i) {
      var mesh = meshes[i];

      if (mesh) {
        if (val === Enums.Shader.UV && !mesh.hasUV()) {
          if (!warning)
            window.alert('No UV on the mesh.');
          warning = true;
        } else {
          mesh.setShaderType(val);
          main.render();
        }
        if (warning)
          this.updateMesh();
      }
    }

    this.updateVisibility();
  }

  onMatcapChanged(value) {
    var meshes = this._main.getSelectedMeshes();
    for (var i = 0, nb = meshes.length; i < nb; ++i) {
      var mesh = meshes[i];
      if (mesh.getShaderType() !== Enums.Shader.MATCAP)
        mesh.setShaderType(Enums.Shader.MATCAP);
      mesh.setMatcap(value);
    }
    this._main.render();
  }

  onFlatShading(bool) {
    var meshes = this._main.getSelectedMeshes();
    for (var i = 0, nb = meshes.length; i < nb; ++i) {
      meshes[i].setFlatShading(bool);
    }
    this._main.render();
  }

  onShowWireframe(bool) {
    var meshes = this._main.getSelectedMeshes();
    for (var i = 0, nb = meshes.length; i < nb; ++i) {
      meshes[i].setShowWireframe(bool);
    }
    this._main.render();
  }

  addEvents() {
    var cbLoadTex = this.loadTextureUV.bind(this);
    var cbLoadMatcap = this.loadMatcap.bind(this);
    document.getElementById('textureopen').addEventListener('change', cbLoadTex, false);
    document.getElementById('matcapopen').addEventListener('change', cbLoadMatcap, false);

    this.removeCallback = function () {
      document.getElementById('textureopen').removeEventListener('change', cbLoadTex, false);
      document.getElementById('matcapopen').removeEventListener('change', cbLoadMatcap, false);
    };
  }

  removeEvents() {
    if (this.removeCallback) this.removeCallback();
  }

  updateMesh() {
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
  }

  updateVisibility() {
    var mesh = this._main.getMesh();
    if (!mesh) return;
    var val = mesh.getShaderType();
    this._ctrlMatcapTitle.setVisibility(val === Enums.Shader.MATCAP);
    this._ctrlMatcap.setVisibility(val === Enums.Shader.MATCAP);
    this._ctrlImportMatcap.setVisibility(val === Enums.Shader.MATCAP);

    this._ctrlExposure.setVisibility(val === Enums.Shader.PBR);
    this._ctrlEnvTitle.setVisibility(val === Enums.Shader.PBR);
    this._ctrlEnv.setVisibility(val === Enums.Shader.PBR);

    this._ctrlUV.setVisibility(val === Enums.Shader.UV);
  }

  getFlatShading() {
    return this._ctrlFlatShading.getValue();
  }

  getWireframe() {
    return this._ctrlShowWireframe.getValue();
  }

  getShaderName() {
    return this._ctrlShaders.getValue();
  }

  importTexture() {
    document.getElementById('textureopen').click();
  }

  loadTextureUV(event) {
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
  }

  loadMatcap(event) {
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
  }

  importMatcap() {
    document.getElementById('matcapopen').click();
  }

  ////////////////
  // KEY EVENTS
  ////////////////
  onKeyUp(event) {
    if (getOptionsURL.getShortKey(event.which) === Enums.KeyAction.WIREFRAME && !event.ctrlKey)
      this._ctrlShowWireframe.setValue(!this._ctrlShowWireframe.getValue());
  }
}

export default GuiRendering;
