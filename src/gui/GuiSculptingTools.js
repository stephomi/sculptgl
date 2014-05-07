define([
  'editor/Sculpt'
], function (Sculpt) {

  'use strict';

  var GuiSculptingTools = {};

  GuiSculptingTools.hide = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].__li.hidden = true;
  };

  GuiSculptingTools.show = function (toolKey) {
    for (var i = 0, ctrls = GuiSculptingTools[toolKey].ctrls_, nbCtrl = ctrls.length; i < nbCtrl; ++i)
      ctrls[i].__li.hidden = false;
  };

  // some helper functions
  var addCtrlIntensity = function (tool, fold) {
    return fold.add(tool, 'intensity_', 0, 1).name('Intensity');
  };
  var addCtrlCulling = function (tool, fold) {
    return fold.add(tool, 'culling_').name('Sculpt culling');
  };
  var addCtrlNegative = function (tool, fold, self) {
    var ctrl = fold.add(tool, 'negative_').name('Negative (N)');
    if (self) {
      self.toggleNegative = function () {
        ctrl.setValue(!ctrl.getValue());
      };
    }
    return ctrl;
  };

  GuiSculptingTools[Sculpt.tool.BRUSH] = {
    ctrls_: [],
    init: function (tool, fold) {
      this.ctrls_.push(addCtrlIntensity(tool, fold));
      this.ctrls_.push(addCtrlNegative(tool, fold, this));
      this.ctrls_.push(fold.add(tool, 'clay_').name('Clay'));
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
      var ctrlColor = fold.addColor(tool, 'color_').name('Color');
      this.ctrls_.push(ctrlColor);
      ctrlColor.onChange(function (value) {
        if (value.length === 3) { // rgb [255, 255, 255]
          tool.color_ = [value[0], value[1], value[2]];
        } else if (value.length === 7) { // hex (24 bits style) '#ffaabb'
          var intVal = parseInt(value.slice(1), 16);
          tool.color_ = [(intVal >> 16), (intVal >> 8 & 0xff), (intVal & 0xff)];
        } else // fuck it
          tool.color_ = [168, 66, 66];
      });
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

  GuiSculptingTools[Sculpt.tool.ROTATE] = {
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
      this.ctrls_.push(addCtrlCulling(tool, fold));
      this.ctrls_.push(fold.add(tool, 'tangent_').name('No shrink'));
    }
  };

  return GuiSculptingTools;
});