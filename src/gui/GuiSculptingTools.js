import { vec3 } from 'gl-matrix';
import Tools from 'editing/tools/Tools';
import TR from 'gui/GuiTR';
import Picking from 'math3d/Picking';
import Enums from 'misc/Enums';
import Utils from 'misc/Utils';

var GuiSculptingTools = {};
GuiSculptingTools.tools = [];
var GuiTools = GuiSculptingTools.tools;

GuiSculptingTools.initGuiTools = function (sculpt, menu, main) {
  // init each tools ui
  for (var i = 0, nbTools = Tools.length; i < nbTools; ++i) {
    if (!Tools[i]) continue;
    var uTool = GuiTools[i];
    if (!uTool) {
      console.error('No gui for tool index : ' + i);
      GuiSculptingTools[i] = {
        _ctrls: [],
        init: function () {}
      };
    }
    uTool.init(sculpt.getTool(i), menu, main);
    GuiSculptingTools.hide(i);
  }
};

GuiSculptingTools.hide = function (toolIndex) {
  for (var i = 0, ctrls = GuiTools[toolIndex]._ctrls, nbCtrl = ctrls.length; i < nbCtrl; ++i)
    ctrls[i].setVisibility(false);
};

GuiSculptingTools.show = function (toolIndex) {
  for (var i = 0, ctrls = GuiTools[toolIndex]._ctrls, nbCtrl = ctrls.length; i < nbCtrl; ++i)
    ctrls[i].setVisibility(true);
};

var setOnChange = function (key, factor, val) {
  this[key] = factor ? val / factor : val;
};

// some helper functions
var addCtrlRadius = function (tool, fold, widget, main) {
  var ctrl = fold.addSlider(TR('sculptRadius'), tool._radius, function (val) {
    setOnChange.call(tool, '_radius', 1, val);
    main.getSculptManager().getSelection().setIsEditMode(true);
    main.renderSelectOverRtt();
  }, 5, 500, 1);
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

GuiTools[Enums.Tools.BRUSH] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlNegative(tool, fold, this));
    this._ctrls.push(fold.addCheckbox(TR('sculptClay'), tool, '_clay'));
    this._ctrls.push(fold.addCheckbox(TR('sculptAccumulate'), tool, '_accumulate'));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.CREASE] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlNegative(tool, fold, this));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.DRAG] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.FLATTEN] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlNegative(tool, fold, this));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.INFLATE] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlNegative(tool, fold, this));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.PAINT] = {
  _ctrls: [],
  onMaterialChanged: function (main, tool, materials) {
    vec3.copy(tool._color, materials[0].getValue());
    tool._material[0] = materials[1].getValue() / 100;
    tool._material[1] = materials[2].getValue() / 100;

    var mesh = main.getMesh();
    if (!mesh) return;

    if (tool._writeAlbedo) mesh.setAlbedo(tool._color);
    if (tool._writeRoughness) mesh.setRoughness(tool._material[0]);
    if (tool._writeMetalness) mesh.setMetallic(tool._material[1]);
    main.render();
  },
  resetMaterialOverride: function (main, tool) {
    if (this._ctrlPicker.getValue() !== tool._pickColor)
      this._ctrlPicker.setValue(tool._pickColor);

    var mesh = main.getMesh();
    if (!mesh || !mesh.getAlbedo) return;

    mesh.getAlbedo()[0] = -1.0;
    mesh.setRoughness(-1.0);
    mesh.setMetallic(-1.0);
    main.render();
  },
  onPickedMaterial: function (materials, tool, main, color, roughness, metallic) {
    main.setCanvasCursor(Utils.cursors.dropper);
    materials[0].setValue(color, true);
    materials[1].setValue(roughness * 100, true);
    materials[2].setValue(metallic * 100, true);
    vec3.copy(tool._color, color);
    tool._material[0] = roughness;
    tool._material[1] = metallic;
  },
  onColorPick: function (tool, main, val) {
    tool._pickColor = val;
    main.setCanvasCursor(val ? Utils.cursors.dropper : 'default');
    main._action = val ? Enums.Action.SCULPT_EDIT : Enums.Action.NOTHING;
    main.renderSelectOverRtt();
  },
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlHardness(tool, fold, this));
    this._ctrls.push(addCtrlCulling(tool, fold));

    this._ctrls.push(fold.addTitle(TR('sculptPBRTitle')));
    this._ctrls.push(fold.addButton(TR('sculptPaintAll'), tool, 'paintAll'));
    this._ctrlPicker = fold.addCheckbox(TR('sculptPickColor'), tool._pickColor, this.onColorPick.bind(this, tool, main));
    this._ctrls.push(this._ctrlPicker);

    var materials = [];
    var cbMatChanged = this.onMaterialChanged.bind(this, main, tool, materials);
    var ctrlColor = fold.addColor(TR('sculptColor'), tool._color, cbMatChanged);
    var ctrlRoughness = fold.addSlider(TR('sculptRoughness'), tool._material[0] * 100, cbMatChanged, 0, 100, 1);
    var ctrlMetallic = fold.addSlider(TR('sculptMetallic'), tool._material[1] * 100, cbMatChanged, 0, 100, 1);
    materials.push(ctrlColor, ctrlRoughness, ctrlMetallic);
    this._ctrls.push(ctrlColor, ctrlRoughness, ctrlMetallic);
    tool.setPickCallback(this.onPickedMaterial.bind(this, materials, tool, main));

    // mask
    this._ctrls.push(fold.addTitle('Write channel'));
    this._ctrls.push(fold.addCheckbox(TR('sculptColor'), tool, '_writeAlbedo'));
    this._ctrls.push(fold.addCheckbox(TR('sculptRoughness'), tool, '_writeRoughness'));
    this._ctrls.push(fold.addCheckbox(TR('sculptMetallic'), tool, '_writeMetalness'));

    window.addEventListener('keyup', this.resetMaterialOverride.bind(this, main, tool));
    window.addEventListener('mouseup', this.resetMaterialOverride.bind(this, main, tool));

    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.PINCH] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(addCtrlNegative(tool, fold, this));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.TWIST] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.LOCALSCALE] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.MOVE] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(fold.addCheckbox(TR('sculptTopologicalCheck'), tool, '_topoCheck'));
    this._ctrls.push(addCtrlNegative(tool, fold, this, TR('sculptMoveAlongNormal')));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.SMOOTH] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
    this._ctrls.push(addCtrlIntensity(tool, fold, this));
    this._ctrls.push(fold.addCheckbox(TR('sculptTangentialSmoothing'), tool, '_tangent'));
    this._ctrls.push(addCtrlCulling(tool, fold));
    addCtrlAlpha(this._ctrls, fold, tool, this);
  }
};

GuiTools[Enums.Tools.MASKING] = {
  _ctrls: [],
  init: function (tool, fold, main) {
    this._ctrls.push(addCtrlRadius(tool, fold, this, main));
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

GuiTools[Enums.Tools.TRANSFORM] = {
  _ctrls: [],
  init: function () {}
};

export default GuiSculptingTools;
