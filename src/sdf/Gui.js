define(function (require, exports, module) {

  'use strict';

  var saveAs = require('lib/FileSaver');
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
    importFile: function () {
      document.getElementById('fileopen').click();
    },
    exportFile: function () {
      var scene = {
        root: this._mainSDF._rootSDF.toJSON(),
        blendColor: Shader.BLEND_COLOR,
        version: 1
      };
      var json = JSON.stringify(scene);
      saveAs(new Blob([json]), 'scene.json');
    },
    exportShader: function () {
      var shader = '#define SHADERTOY\n#define SHADERTOY_ZOOM 2.0\n' + Shader.createFragment(this._mainSDF);
      saveAs(new Blob([shader]), 'shadertoy.glsl');
    },
    showCredits: function () {

    },
    initGui: function () {

      // import export
      var topbar = this._main._gui._topbar;
      var files = topbar.addMenu('Export/Import');
      files.addButton('Import (json)', this, 'importFile');
      files.addButton('Export (json)', this, 'exportFile');
      files.addButton('Shadertoy (glsl)', this, 'exportShader');

      // credits
      var credits = topbar.addMenu('Credits', this, 'showCredits');
      credits.addTitle('Raymarch template');
      credits.addButton('Inigo Quilez (iq)', window.open.bind(window, 'https://www.shadertoy.com/view/Xds3zN', '_blank'));
      credits.addTitle('Combination op');
      credits.addButton('Mercuy', window.open.bind(window, 'http://mercury.sexy/hg_sdf/', '_blank'));

      // sidebar stuffs
      var sidebar = this._main._gui._sidebar;
      var menu = sidebar.addMenu('SDF');

      var optPrim = {
        PRIMITIVE: 'Select a primitive',
        SPHERE: 'Sphere',
        BOX: 'Box',
        TORUS: 'Torus',
        CAPSULE: 'Capsule',
        ELLIPSOID: 'Ellipsoid'
      };
      this._ctrlPrimitive = menu.addCombobox('Primitive', 'PRIMITIVE', this.onPrimitive.bind(this), optPrim);

      // hideable ctrls
      this._ctrls = [];

      var apply = menu.addButton('Apply', this, 'applyPrimitive');
      apply.domButton.style.background = 'rgba(120, 230, 0, 0.8)';
      this._ctrls.push(apply);

      this._ctrlBlendColor = menu.addCheckbox('Blend Color', Shader.BLEND_COLOR, this.onBlendColor.bind(this));

      this._initGuiCombination(menu);
      this._initGuiRepetition(menu);
      this._initGuiPrimitive(menu);

      this.setCtrlVisibility(false);
      this._ctrlPrimitive.setValue('BOX');
    },
    _initGuiRepetition: function (menu) {
      var ctrls = this._ctrls;

      ctrls.push(menu.addTitle('Domain repetition'));

      this._ctrlRepeat = [];
      this._ctrlRepeat[0] = menu.addCheckbox('Repeat in X', false, this.onRepeat.bind(this, 0));
      ctrls.push(menu.addSlider('X dist', 5.0, this.onRepeatDist.bind(this, 0), 0.1, 10.0, 0.01));

      this._ctrlRepeat[1] = menu.addCheckbox('Repeat in Y', false, this.onRepeat.bind(this, 1));
      ctrls.push(menu.addSlider('Y dist', 5.0, this.onRepeatDist.bind(this, 1), 0.1, 10.0, 0.01));

      this._ctrlRepeat[2] = menu.addCheckbox('Repeat in Z', false, this.onRepeat.bind(this, 2));
      ctrls.push(menu.addSlider('Z dist', 5.0, this.onRepeatDist.bind(this, 2), 0.1, 10.0, 0.01));

      ctrls.push(this._ctrlRepeat[0]);
      ctrls.push(this._ctrlRepeat[1]);
      ctrls.push(this._ctrlRepeat[2]);
    },
    _initGuiPrimitive: function (menu) {
      var ctrls = this._ctrls;

      ctrls.push(menu.addTitle('Primitive'));
      this._ctrlColor = menu.addColor('Color', [0.5, 0.5, 1.0], this.onColor.bind(this));
      ctrls.push(this._ctrlColor);

      // box sides
      this._ctrlBoxX = menu.addSlider('Side X', 0.2, this.onBoxSides.bind(this, 0), 0.01, 2.0, 0.01);
      this._ctrlBoxY = menu.addSlider('Side Y', 0.4, this.onBoxSides.bind(this, 1), 0.01, 2.0, 0.01);
      this._ctrlBoxZ = menu.addSlider('Side Z', 0.8, this.onBoxSides.bind(this, 2), 0.01, 2.0, 0.01);
      this._ctrlBoxW = menu.addSlider('Radius', 0.2, this.onBoxSides.bind(this, 3), 0.0, 1.0, 0.01);
      this._ctrlBoxX._primitive = 'BOX';
      this._ctrlBoxY._primitive = 'BOX';
      this._ctrlBoxZ._primitive = 'BOX';
      this._ctrlBoxW._primitive = 'BOX';
      ctrls.push(this._ctrlBoxX);
      ctrls.push(this._ctrlBoxY);
      ctrls.push(this._ctrlBoxZ);
      ctrls.push(this._ctrlBoxW);

      // sphere radius
      this._ctrlSphereR = menu.addSlider('Radius', 4.0, this.onSphereRadius.bind(this), 0.01, 2.0, 0.01);
      this._ctrlSphereR._primitive = 'SPHERE';
      ctrls.push(this._ctrlSphereR);

      // torus radii
      this._ctrlTorusR1 = menu.addSlider('Radius', 4.0, this.onTorusRadii.bind(this, 0), 0.1, 4.0, 0.01);
      this._ctrlTorusR2 = menu.addSlider('Thickness radius', 0.5, this.onTorusRadii.bind(this, 1), 0.01, 0.5, 0.01);
      this._ctrlTorusR1._primitive = 'TORUS';
      this._ctrlTorusR2._primitive = 'TORUS';
      ctrls.push(this._ctrlTorusR1);
      ctrls.push(this._ctrlTorusR2);

      // capsule radii
      this._ctrlCapsuleR = menu.addSlider('Radius', 0.2, this.onCapsule.bind(this, 0), 0.01, 2.0, 0.01);
      this._ctrlCapsuleH = menu.addSlider('Height', 0.5, this.onCapsule.bind(this, 1), 0.01, 2.0, 0.01);
      this._ctrlCapsuleR._primitive = 'CAPSULE';
      this._ctrlCapsuleH._primitive = 'CAPSULE';
      ctrls.push(this._ctrlCapsuleR);
      ctrls.push(this._ctrlCapsuleH);

      // ellipsoid
      this._ctrlEllipsoidX = menu.addSlider('X', 0.2, this.onEllipsoid.bind(this, 0), 0.05, 2.0, 0.01);
      this._ctrlEllipsoidY = menu.addSlider('Y', 0.4, this.onEllipsoid.bind(this, 1), 0.05, 2.0, 0.01);
      this._ctrlEllipsoidZ = menu.addSlider('Z', 0.8, this.onEllipsoid.bind(this, 2), 0.05, 2.0, 0.01);
      this._ctrlEllipsoidX._primitive = 'ELLIPSOID';
      this._ctrlEllipsoidY._primitive = 'ELLIPSOID';
      this._ctrlEllipsoidZ._primitive = 'ELLIPSOID';
      ctrls.push(this._ctrlEllipsoidX);
      ctrls.push(this._ctrlEllipsoidY);
      ctrls.push(this._ctrlEllipsoidZ);
    },
    _initGuiCombination: function (menu) {
      var ctrls = this._ctrls;

      ctrls.push(menu.addTitle('Operator'));

      // boolean
      var optBool = {
        UNION: 'Union',
        SUB: 'Difference',
        SUB_INV: 'Difference Inverse',
        INTER: 'Intersection'
      };
      this._ctrlCombination = menu.addCombobox('Combination', 'UNION', this.onCombination.bind(this), optBool);
      ctrls.push(this._ctrlCombination);

      // transition
      var optTrans = {
        NONE: 'None',
        ROUND: 'Round',
        CHAMFER: 'Chamfer',
        COLUMNS: 'Columns',
        STAIRS: 'Stairs'
      };
      this._ctrlTransition = menu.addCombobox('Transition', 'ROUND', this.onTransition.bind(this), optTrans);
      ctrls.push(this._ctrlTransition);

      // round
      this._ctrlRoundRadius = menu.addSlider('Roundness', 1.0, this.onRoundRadius.bind(this), 0.01, 4.0, 0.01);
      this._ctrlRoundRadius._transition = 'ROUND';
      ctrls.push(this._ctrlRoundRadius);

      // chamfer
      this._ctrlChamferRadius = menu.addSlider('Chamfer', 1.0, this.onChamferRadius.bind(this), 0.01, 2.0, 0.01);
      this._ctrlChamferRadius._transition = 'CHAMFER';
      ctrls.push(this._ctrlChamferRadius);

      // columns
      this._ctrlColumnsR = menu.addSlider('Radius', 0.3, this.onColumns.bind(this, 0), 0.01, 4.0, 0.01);
      this._ctrlColumnsR._transition = 'COLUMNS';
      this._ctrlColumnsN = menu.addSlider('Nb repeat', 3.0, this.onColumns.bind(this, 1), 0.0, 10.0, 0.01);
      this._ctrlColumnsN._transition = 'COLUMNS';
      ctrls.push(this._ctrlColumnsR);
      ctrls.push(this._ctrlColumnsN);

      // stairs
      this._ctrlStairsR = menu.addSlider('Radius', 0.3, this.onStairs.bind(this, 0), 0.01, 4.0, 0.01);
      this._ctrlStairsR._transition = 'STAIRS';
      this._ctrlStairsN = menu.addSlider('Nb repeat', 3.0, this.onStairs.bind(this, 1), 0.0, 10.0, 0.01);
      this._ctrlStairsN._transition = 'STAIRS';
      ctrls.push(this._ctrlStairsR);
      ctrls.push(this._ctrlStairsN);
    },
    setCtrlVisibility: function (bool, primName, transName) {
      var ctrls = this._ctrls;
      for (var i = 0, nbCtrls = ctrls.length; i < nbCtrls; ++i) {
        var visible = bool;

        if (bool) {
          if (ctrls[i]._primitive !== undefined && ctrls[i]._primitive !== primName)
            visible = false;
          else if (ctrls[i]._transition !== undefined && ctrls[i]._transition !== transName)
            visible = false;
        }

        ctrls[i].setVisibility(visible);
      }
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
      this.setCtrlVisibility(!isReset, name, this._ctrlTransition.getValue());

      if (isReset) {
        this._mainSDF._lastPrim = undefined;
        this._main.setMesh(null);
        return;
      }

      var prim = new Primitives[name]();
      vec3.copy(prim.getParam('uBaseColor'), this._ctrlColor.getValue());
      if (this._mainSDF._lastPrim) vec3.copy(prim.getCenter(), this._mainSDF._lastPrim.getCenter());

      this._lastRoot = this._mainSDF._rootSDF;
      this._mainSDF._lastPrim = prim;

      this._mainSDF._rootSDF = new Combinations[this._ctrlCombination.getValue()](this._mainSDF._rootSDF, prim);
      this.updateTransiton();

      this._main.setMesh(prim);
    },
    onCombination: function () {
      this._mainSDF._rootSDF = new Combinations[this._ctrlCombination.getValue()](this._lastRoot, this._mainSDF._lastPrim);
      this.updateTransiton();

      this._main.render();
      this._mainSDF._dirtyScene = true;
    },
    // -------- transition ---------
    onTransition: function (name) {
      this.setCtrlVisibility(true, this._ctrlPrimitive.getValue(), name);
      this.updateTransiton();
    },
    updateTransiton: function () {
      var comb = this._mainSDF._rootSDF;

      comb.uRoundRadius = this._ctrlRoundRadius.getValue();
      comb.uChamferRadius = this._ctrlChamferRadius.getValue();

      comb.uColumns[0] = this._ctrlColumnsR.getValue();
      comb.uColumns[1] = this._ctrlColumnsN.getValue();

      comb.uStairs[0] = this._ctrlStairsR.getValue();
      comb.uStairs[1] = this._ctrlStairsN.getValue();

      comb.resetTransitions(this._ctrlTransition.getValue());
      this._mainSDF._dirtyScene = true;
      this._main.render();
    },
    // -------- round ---------
    onRoundRadius: function (val) {
      this._mainSDF._rootSDF.uRoundRadius = val;
      this._main.render();
    },
    // -------- chamfer ---------
    onChamferRadius: function (val) {
      this._mainSDF._rootSDF.uChamferRadius = val;
      this._main.render();
    },
    // -------- columns ---------
    onColumns: function (dim, val) {
      this._mainSDF._rootSDF.uColumns[dim] = val;
      this._main.render();
    },
    // -------- stairs ---------
    onStairs: function (dim, val) {
      this._mainSDF._rootSDF.uStairs[dim] = val;
      this._main.render();
    },
    onColor: function () {
      vec3.copy(this._mainSDF._lastPrim.getParam('uBaseColor'), this._ctrlColor.getValue());
      this._main.render();
    },
    onBlendColor: function (val) {
      Shader.BLEND_COLOR = val;
      this._mainSDF._dirtyScene = true;
      this._main.render();
    },
    // -------- domain repetition ---------
    onRepeat: function (dim, val) {
      this._mainSDF._lastPrim.uBaseMod[dim] = Math.abs(this._mainSDF._lastPrim.uBaseMod[dim]) * (val > 0.0 ? 1.0 : -1.0);
      this._main.render();
    },
    onRepeatDist: function (dim, val) {
      this._ctrlRepeat[dim].setValue(true);
      this._mainSDF._lastPrim.uBaseMod[dim] = val;
      this._main.render();
    },
    // -------- box ---------
    onBoxSides: function (dim, val) {
      this._mainSDF._lastPrim.uBoxSides[dim] = val;
      this._main.render();
    },
    // -------- sphere ---------
    onSphereRadius: function (val) {
      this._mainSDF._lastPrim.uSphereRadius = val;
      this._main.render();
    },
    // -------- torus ---------
    onTorusRadii: function (dim, val) {
      this._mainSDF._lastPrim.uTorusRadii[dim] = val;
      this._main.render();
    },
    // -------- capsule ---------
    onCapsule: function (dim, val) {
      this._mainSDF._lastPrim.uCapsuleRH[dim] = val;
      this._main.render();
    },
    // -------- ellipsoid ---------
    onEllipsoid: function (dim, val) {
      this._mainSDF._lastPrim.uEllipsoidSides[dim] = val;
      this._main.render();
    }
  };

  module.exports = GuiSDF;
});