define([
  'gui/GuiTR',
  'editor/Sculpt'
], function (TR, Sculpt) {

  'use strict';

  var GuiSculptingTools = {};

  GuiSculptingTools.hide = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(false);
  };

  GuiSculptingTools.show = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].setVisibility(true);
  };

  var setOnChange = function (key, val, factor) {
    this[key] = factor ? val * factor : val;
  };

  // some helper functions
  var addCtrlIntensity = function (tool, fold) {
    return fold.addSlider(TR('sculptIntensity'), tool.intensity_ * 100, setOnChange.bind(tool, 'intensity_', 0.01), 0, 100, 1);
  };
  var addCtrlCulling = function (tool, fold) {
    return fold.addCheckbox(TR('sculptCulling'), tool, 'culling_');
  };
  var addCtrlNegative = function (tool, fold, self) {
    var ctrl = fold.addCheckbox(TR('sculptNegative'), tool, 'negative_');
    if (self) {
      self.toggleNegative = function () {
        ctrl.setValue(!ctrl.getValue());
      };
    }
    return ctrl;
  };
  var addCtrlColor = function (tool, fold) {
    var ctrl = fold.addColor(TR('sculptColor'), tool, 'color_');
    tool.setPickCallback(function (color) {
      ctrl.setValue(color);
    });
    return ctrl;
  };

  GuiSculptingTools[Sculpt.tool.BRUSH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(fold.addCheckbox(TR('sculptClay'), tool, 'clay_'));
      this.ctrls_.push(fold.addCheckbox(TR('sculptAccumulate'), tool, 'accumulate_'));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.CREASE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
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
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.INFLATE] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(addCtrlCulling(tool, fold));
    }
  };

  GuiSculptingTools[Sculpt.tool.PAINT] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(addCtrlCulling(tool, fold));
      this.ctrls_.push(addCtrlColor(tool, fold));
      this.ctrls_.push(fold.addCheckbox(TR('sculptPickColor'), tool, 'pickColor_'));
    }
  };

  GuiSculptingTools[Sculpt.tool.PINCH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
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

  GuiSculptingTools[Sculpt.tool.SMOOTH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(fold.addCheckbox(TR('sculptTangentialSmoothing'), tool, 'tangent_'));
      this.ctrls_.push(addCtrlCulling(tool, fold));
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