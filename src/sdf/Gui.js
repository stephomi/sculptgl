define(function (require, exports, module) {

  'use strict';

  var Shader = require('sdf/Shader');
  var Combinations = require('sdf/Combinations');
  var Primitives = require('sdf/Primitives');
  var glm = require('lib/glMatrix');

  var vec3 = glm.vec3;

  var GuiSDF = function (mainSDF) {
    this._main = mainSDF._main;
    this._mainSDF = mainSDF;
    this.initGui();
  };

  GuiSDF.prototype = {
    initGui: function () {
      var sidebar = this._main._gui._sidebar;
      var menu = sidebar.addMenu('SDF');

      var optPrim = {
        PRIMITIVE: 'Select a primitive',
        SPHERE: 'Sphere',
        BOX: 'Box',
        TORUS: 'Torus'
      };
      this._ctrlPrimitive = menu.addCombobox('Primitive', 'PRIMITIVE', this.onPrimitive.bind(this), optPrim);

      // hideable ctrls
      this._ctrls = [];

      var apply = menu.addButton('Apply', this, 'applyPrimitive');
      apply.domButton.style.background = 'rgba(120, 230, 0, 0.8)';
      this._ctrls.push(apply);

      menu.addCheckbox('Blend Color', Shader.BLEND_COLOR, this.onBlendColor.bind(this));

      ////////////
      // PRIMITIVE
      ////////////
      this._ctrls.push(menu.addTitle('Primitive'));
      this._ctrlColor = menu.addColor('Color', [0.5, 0.5, 1.0], this.onColor.bind(this));
      this._ctrls.push(this._ctrlColor);

      //////////////
      // COMBINATION
      //////////////
      this._ctrls.push(menu.addTitle('Operator'));
      var optBool = {
        UNION: 'Union',
        SUB: 'Difference',
        SUB_INV: 'Difference Inverse',
        INTER: 'Intersection'
      };
      this._ctrlCombination = menu.addCombobox('Combination', 'UNION', this.onCombination.bind(this), optBool);
      this._ctrlRoundRadius = menu.addSlider('Roundness', 3.0, this.onRoundRadius.bind(this), 0.0, 20.0, 0.01);
      this._ctrlChamferRadius = menu.addSlider('Chamfer', 0.0, this.onChamferRadius.bind(this), 0.0, 20.0, 0.01);

      this._ctrls.push(this._ctrlCombination);
      this._ctrls.push(this._ctrlRoundRadius);
      this._ctrls.push(this._ctrlChamferRadius);

      this.setCtrlVisibility(false);
      this._ctrlPrimitive.setValue('BOX');
    },
    setCtrlVisibility: function (bool) {
      var ctrls = this._ctrls;
      for (var i = 0, nbCtrls = ctrls.length; i < nbCtrls; ++i)
        ctrls[i].setVisibility(bool);
    },
    applyPrimitive: function () {
      this._lastRoot = undefined;
      this._mainSDF._lastPrim = undefined;
      this._ctrlPrimitive.setValue('PRIMITIVE');
      this._main.render();
    },
    onPrimitive: function (name) {
      this._main.render();
      this._mainSDF._dirtyScene = true;

      // remove last inserted primitive
      if (this._lastRoot)
        this._mainSDF._rootSDF = this._lastRoot;

      var isReset = !Primitives[name];
      // display/hide ui
      this.setCtrlVisibility(!isReset);

      if (isReset) {
        this._mainSDF._lastPrim = undefined;
        this._main.setMesh(null);
        return;
      }

      var prim = new Primitives[name]();
      vec3.copy(prim.getColor(), this._ctrlColor.getValue());
      if (this._mainSDF._lastPrim) vec3.copy(prim.getCenter(), this._mainSDF._lastPrim.getCenter());

      this._lastRoot = this._mainSDF._rootSDF;
      this._mainSDF._lastPrim = prim;

      this._mainSDF._rootSDF = new Combinations[this._ctrlCombination.getValue()](this._mainSDF._rootSDF, prim);
      this._mainSDF._rootSDF.setRoundRadius(this._ctrlRoundRadius.getValue());
      this._mainSDF._rootSDF.setChamferRadius(this._ctrlChamferRadius.getValue());

      this._main.setMesh(prim);
    },
    onCombination: function () {
      this._mainSDF._rootSDF = new Combinations[this._ctrlCombination.getValue()](this._lastRoot, this._mainSDF._lastPrim);
      this._mainSDF._rootSDF.setRoundRadius(this._ctrlRoundRadius.getValue());
      this._mainSDF._rootSDF.setChamferRadius(this._ctrlChamferRadius.getValue());

      this._main.render();
      this._mainSDF._dirtyScene = true;
    },
    onRoundRadius: function () {
      this._ctrlChamferRadius.setValue(0.0, true);
      this._mainSDF._rootSDF.setChamferRadius(0.0);

      var val = this._ctrlRoundRadius.getValue();
      var oldRadius = this._mainSDF._rootSDF.getRoundRadius();
      if (val !== oldRadius && (val === 0.0 || oldRadius === 0.0))
        this._mainSDF._dirtyScene = true;

      this._mainSDF._rootSDF.setRoundRadius(val);
      this._main.render();
    },
    onChamferRadius: function () {
      this._ctrlRoundRadius.setValue(0.0, true);
      this._mainSDF._rootSDF.setRoundRadius(0.0);

      var val = this._ctrlChamferRadius.getValue();
      var oldRadius = this._mainSDF._rootSDF.getChamferRadius();
      if (val !== oldRadius && (val === 0.0 || oldRadius === 0.0))
        this._mainSDF._dirtyScene = true;

      this._mainSDF._rootSDF.setChamferRadius(val);
      this._main.render();
    },
    onColor: function () {
      if (!this._mainSDF._lastPrim)
        return;
      vec3.copy(this._mainSDF._lastPrim.getColor(), this._ctrlColor.getValue());
      this._main.render();
    },
    onBlendColor: function () {
      Shader.BLEND_COLOR = !Shader.BLEND_COLOR;
      this._mainSDF._dirtyScene = true;
      this._main.render();
    }
  };

  module.exports = GuiSDF;
});