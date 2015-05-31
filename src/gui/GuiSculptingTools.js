define([
  'lib/glMatrix',
  'gui/GuiTR',
  'editor/Sculpt',
  'math3d/Picking'
], function (glm, TR, Sculpt, Picking) {

  'use strict';

  var vec3 = glm.vec3;

  var GuiSculptingTools = {};

  var tools = GuiSculptingTools.TOOLS = [];

  GuiSculptingTools.hide = function (toolKey) {
    for (var i = 0, ctrls = tools[toolKey]._ctrls, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(false);
  };

  GuiSculptingTools.show = function (toolKey) {
    for (var i = 0, ctrls = tools[toolKey]._ctrls, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(true);
  };

  var setOnChange = function (key, factor, val) {
    this[key] = factor ? val / factor : val;
  };

  // some helper functions
  var addCtrlRadius = function (tool, fold, widget) {
    var ctrl = fold.addSlider(TR('sculptRadius'), tool._radius, setOnChange.bind(tool, '_radius', 1), 5, 500, 1);
    widget._ctrlRadius = ctrl;
    return ctrl;
  };
  var addCtrlIntensity = function (tool, fold, widget) {
    var ctrl = fold.addSlider(TR('sculptIntensity'), tool._intensity * 100, setOnChange.bind(tool, '_intensity', 100), 0, 100, 1);
    widget._ctrlIntensity = ctrl;
    return ctrl;
  };
  var addCtrlHardness = function (tool, fold) {
    return fold.addSlider(TR('sculptHardness'), tool._hardness * 100, setOnChange.bind(tool, '_hardness', 100), 0, 100, 1);
  };
  var addCtrlCulling = function (tool, fold) {
    return fold.addCheckbox(TR('sculptCulling'), tool, '_culling');
  };
  var addCtrlNegative = function (tool, fold, widget, name) {
    var ctrl = fold.addCheckbox(name || TR('sculptNegative'), tool, '_negative');
    widget.toggleNegative = function () {
      ctrl.setValue(!ctrl.getValue());
    };
    return ctrl;
  };

  var importAlpha = function () {
    document.getElementById('alphaopen').click();
  };
  var addCtrlAlpha = function (ctrls, fold, tool, ui) {
    ctrls.push(fold.addTitle(TR('sculptAlphaTitle')));
    if (tool._lockPosition !== undefined)
      ctrls.push(fold.addCheckbox(TR('sculptLockPositon'), tool, '_lockPosition'));
    ui._ctrlAlpha = fold.addCombobox(TR('sculptAlphaTex'), tool, '_idAlpha', Picking.ALPHAS_NAMES);
    ctrls.push(ui._ctrlAlpha);
    ctrls.push(fold.addButton(TR('sculptImportAlpha'), importAlpha));
  };

  tools[Sculpt.tool.BRUSH] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(fold.addCheckbox(TR('sculptClay'), tool, '_clay'));
      this._ctrls.push(fold.addCheckbox(TR('sculptAccumulate'), tool, '_accumulate'));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.CREASE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.DRAG] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.FLATTEN] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.INFLATE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.PAINT] = {
    _ctrls: [],
    onMaterialChanged: function (main, tool, materials) {
      vec3.copy(tool._color, materials[0].getValue());
      tool._material[0] = materials[1].getValue() / 100;
      tool._material[1] = materials[2].getValue() / 100;
      var mesh = main.getMesh();
      if (mesh) {
        mesh.setAlbedo(tool._color);
        mesh.setRoughness(tool._material[0]);
        mesh.setMetallic(tool._material[1]);
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
      vec3.copy(tool._color, color);
      tool._material[0] = roughness;
      tool._material[1] = metallic;
    },
    init: function (tool, fold, main) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlHardness(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));

      this._ctrls.push(fold.addCheckbox(TR('sculptPickColor'), tool, '_pickColor'));
      this._ctrls.push(fold.addButton(TR('sculptPaintAll'), tool, 'paintAll'));

      this._ctrls.push(fold.addTitle(TR('sculptPBRTitle')));

      var materials = [];
      var cbMatChanged = this.onMaterialChanged.bind(this, main, tool, materials);
      var ctrlColor = fold.addColor(TR('sculptColor'), tool._color, cbMatChanged);
      var ctrlRoughness = fold.addSlider(TR('sculptRoughness'), tool._material[0] * 100, cbMatChanged, 0, 100, 1);
      var ctrlMetallic = fold.addSlider(TR('sculptMetallic'), tool._material[1] * 100, cbMatChanged, 0, 100, 1);
      materials.push(ctrlColor, ctrlRoughness, ctrlMetallic);
      window.addEventListener('keyup', this.resetMaterialOverride.bind(this, main));
      window.addEventListener('mouseup', this.resetMaterialOverride.bind(this, main));

      tool.setPickCallback(this.onPickedMaterial.bind(this, materials, tool));

      this._ctrls.push(ctrlColor, ctrlRoughness, ctrlMetallic);
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.PINCH] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.TWIST] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.LOCALSCALE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.MOVE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(fold.addCheckbox(TR('sculptTopologicalCheck'), tool, '_topoCheck'));
      this._ctrls.push(addCtrlNegative(tool, fold, this, TR('sculptMoveAlongNormal')));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.SMOOTH] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(fold.addCheckbox(TR('sculptTangentialSmoothing'), tool, '_tangent'));
      this._ctrls.push(addCtrlCulling(tool, fold));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.MASKING] = {
    _ctrls: [],
    init: function (tool, fold, main) {
      this._ctrls.push(addCtrlRadius(tool, fold, this));
      this._ctrls.push(addCtrlIntensity(tool, fold, this));
      this._ctrls.push(addCtrlHardness(tool, fold, this));
      this._ctrls.push(addCtrlNegative(tool, fold, this));
      this._ctrls.push(addCtrlCulling(tool, fold));
      this._main = main;
      this._tool = tool;
      var bci = fold.addDualButton(TR('sculptMaskingClear'), TR('sculptMaskingInvert'), tool, tool, 'clear', 'invert');
      var bbs = fold.addDualButton(TR('sculptMaskingBlur'), TR('sculptMaskingSharpen'), tool, tool, 'blur', 'sharpen');
      this._ctrls.push(bci[0], bci[1], bbs[0], bbs[1]);
      // mask extract
      this._ctrls.push(fold.addTitle(TR('sculptExtractTitle')));
      this._ctrls.push(fold.addSlider(TR('sculptExtractThickness'), tool, '_thickness', -5, 5, 0.001));
      this._ctrls.push(fold.addButton(TR('sculptExtractAction'), tool, 'extract'));
      addCtrlAlpha(this._ctrls, fold, tool, this);
    }
  };

  tools[Sculpt.tool.TRANSLATE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlNegative(tool, fold, this, TR('sculptTranslateDepth')));
    }
  };

  tools[Sculpt.tool.ROTATE] = {
    _ctrls: [],
    init: function (tool, fold) {
      this._ctrls.push(addCtrlNegative(tool, fold, this, TR('sculptRotateRoll')));
    }
  };

  tools[Sculpt.tool.SCALE] = {
    _ctrls: [],
    init: function () {}
  };

  return GuiSculptingTools;
});