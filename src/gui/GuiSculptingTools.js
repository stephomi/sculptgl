define([
  'lib/glMatrix',
  'gui/GuiTR',
  'editor/Sculpt'
], function (glm, TR, Sculpt) {

  'use strict';

  var vec3 = glm.vec3;

  var GuiSculptingTools = {};

  GuiSculptingTools.hide = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(false);
  };

  GuiSculptingTools.show = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(true);
  };

  var setOnChange = function (key, factor, val) {
    this[key] = factor ? val / factor : val;
  };

  // some helper functions
  var addCtrlIntensity = function (tool, fold, widget) {
    var ctrl = fold.addSlider(TR('sculptIntensity'), tool.intensity_ * 100, setOnChange.bind(tool, 'intensity_', 100), 0, 100, 1);
    widget.intensity_ = ctrl;
    return ctrl;
  };
  var addCtrlHardness = function (tool, fold) {
    return fold.addSlider(TR('sculptHardness'), tool.hardness_ * 100, setOnChange.bind(tool, 'hardness_', 100), 0, 100, 1);
  };
  var addCtrlCulling = function (tool, fold) {
    return fold.addCheckbox(TR('sculptCulling'), tool, 'culling_');
  };
  var addCtrlNegative = function (tool, fold, widget, name) {
    var ctrl = fold.addCheckbox(name || TR('sculptNegative'), tool, 'negative_');
    widget.toggleNegative = function () {
      ctrl.setValue(!ctrl.getValue());
    };
    return ctrl;
  };

  GuiSculptingTools[Sculpt.tool.BRUSH] = {
    ctrls_: [],
    importAlpha: function () {
      document.getElementById('alphaopen').click();
    },
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(fold.addCheckbox(TR('sculptClay'), tool, 'clay_'));
      this.ctrls_.push(fold.addCheckbox(TR('sculptAccumulate'), tool, 'accumulate_'));
      this.ctrls_.push(addCtrlCulling(tool, fold));
      this.ctrls_.push(fold.addCheckbox(TR('sculptUseAlpha'), tool, 'useAlpha_'));
      this.ctrls_.push(fold.addButton(TR('sculptImportAlpha'), this, 'importAlpha'));
    }
  };

  GuiSculptingTools[Sculpt.tool.CREASE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.DRAG] = {
    ctrls_: [],
    init: function () {}
  };

  GuiSculptingTools[Sculpt.tool.FLATTEN] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.INFLATE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.PAINT] = {
    ctrls_: [],
    onMaterialChanged: function (main, tool, materials) {
      vec3.copy(tool.color_, materials[0].getValue());
      tool.material_[0] = materials[1].getValue() / 100;
      tool.material_[1] = materials[2].getValue() / 100;
      var mesh = main.getMesh();
      if (mesh) {
        mesh.setAlbedo(tool.color_);
        mesh.setRoughness(tool.material_[0]);
        mesh.setMetallic(tool.material_[1]);
        main.render();
      }
    },
    resetMaterialOverride: function (main) {
      var mesh = main.getMesh();
      if (mesh) {
        mesh.getAlbedo()[0] = -1.0;
        mesh.setRoughness(-0.18);
        mesh.setMetallic(-0.78);
        main.render();
      }
    },
    onPickedMaterial: function (materials, tool, color, roughness, metallic) {
      materials[0].setValue(color, true);
      materials[1].setValue(roughness * 100, true);
      materials[2].setValue(metallic * 100, true);
      vec3.copy(tool.color_, color);
      tool.material_[0] = roughness;
      tool.material_[1] = metallic;
    },
    init: function (tool, fold, main) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlHardness(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));

      var materials = [];
      var cbMatChanged = this.onMaterialChanged.bind(this, main, tool, materials);
      var ctrlColor = fold.addColor(TR('sculptColor'), tool.color_, cbMatChanged);
      var ctrlRoughness = fold.addSlider(TR('sculptRoughness'), tool.material_[0] * 100, cbMatChanged, 0, 100, 1);
      var ctrlMetallic = fold.addSlider(TR('sculptMetallic'), tool.material_[1] * 100, cbMatChanged, 0, 100, 1);
      materials.push(ctrlColor, ctrlRoughness, ctrlMetallic);
      window.addEventListener('keyup', this.resetMaterialOverride.bind(this, main));
      window.addEventListener('mouseup', this.resetMaterialOverride.bind(this, main));

      tool.setPickCallback(this.onPickedMaterial.bind(this, materials, tool));

      this.ctrls_.push(ctrlColor, ctrlRoughness, ctrlMetallic);
      this.ctrls_.push(fold.addCheckbox(TR('sculptPickColor'), tool, 'pickColor_'));
    }
  };

  GuiSculptingTools[Sculpt.tool.PINCH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.TWIST] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.SCALE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.MOVE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(fold.addCheckbox(TR('sculptTopologicalCheck'), tool, 'topoCheck_'));
      this.ctrls_.push(addCtrlNegative(tool, fold, this, TR('sculptMoveAlongNormal')));
    }
  };

  GuiSculptingTools[Sculpt.tool.SMOOTH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(fold.addCheckbox(TR('sculptTangentialSmoothing'), tool, 'tangent_'));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.MASKING] = {
    ctrls_: [],
    init: function (tool, fold, main) {
      this.ctrls_.push(addCtrlIntensity(tool, fold, this));
      this.ctrls_.push(addCtrlHardness(tool, fold, this));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
      this.main_ = main;
      this.tool_ = tool;
      var bci = fold.addDualButton(TR('sculptMaskingClear'), TR('sculptMaskingInvert'), this, this, 'clear', 'invert');
      var bbs = fold.addDualButton(TR('sculptMaskingBlur'), TR('sculptMaskingSharpen'), this, this, 'blur', 'sharpen');
      this.ctrls_.push(bci[0], bci[1], bbs[0], bbs[1]);
    },
    maskAction: function (key, akey) {
      var main = this.main_;
      if (!main.getMesh()) return;
      if (!main.isReplayed()) main.getReplayWriter().pushAction(akey);
      this.tool_[key](main.getMesh(), main);
    },
    blur: function () {
      this.maskAction('blur', 'MASKING_BLUR');
    },
    sharpen: function () {
      this.maskAction('sharpen', 'MASKING_SHARPEN');
    },
    clear: function () {
      this.maskAction('clear', 'MASKING_CLEAR');
    },
    invert: function () {
      this.maskAction('invert', 'MASKING_INVERT');
    }
  };

  GuiSculptingTools[Sculpt.tool.TRANSLATE] = {
    ctrls_: [],
    init: function () {}
  };

  GuiSculptingTools[Sculpt.tool.ROTATE] = {
    ctrls_: [],
    init: function () {}
  };

  return GuiSculptingTools;
});