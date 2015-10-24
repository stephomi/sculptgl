define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');
  var Remesh = require('editing/Remesh');
  var Mesh = require('mesh/Mesh');
  var Multimesh = require('mesh/multiresolution/Multimesh');
  var MeshDynamic = require('mesh/dynamic/MeshDynamic');
  var Topology = require('mesh/dynamic/Topology');
  var StateMultiresolution = require('states/StateMultiresolution');

  var GuiMultiresolution = function (guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui;
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this._ctrlResolution = null; // multiresolution controller
    this._ctrlDynamic = null; // dynamic topology controller
    this.init(guiParent);
  };

  GuiMultiresolution.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this._menu = guiParent.addMenu(TR('topologyTitle'));
      menu.close();

      // multires
      menu.addTitle(TR('multiresTitle'));
      this._ctrlResolution = menu.addSlider(TR('multiresResolution'), 1, this.onResolutionChanged.bind(this), 1, 1, 1);
      var dual = menu.addDualButton(TR('multiresReverse'), TR('multiresSubdivide'), this, this, 'reverse', 'subdivide');
      this._ctrlReverse = dual[0];
      this._ctrlSubdivide = dual[1];
      dual = this._dualButtonDel = menu.addDualButton(TR('multiresDelLower'), TR('multiresDelHigher'), this, this, 'deleteLower', 'deleteHigher');
      this._ctrlDelLower = dual[0];
      this._ctrlDelHigher = dual[1];
      this._ctrlDelLower.domButton.style.background = this._ctrlDelHigher.domButton.style.background = 'rgba(230,53,59,0.35)';

      // remeshing
      menu.addTitle(TR('remeshTitle'));
      menu.addSlider(TR('remeshResolution'), Remesh, 'RESOLUTION', 8, 400, 1);
      menu.addCheckbox(TR('remeshBlock'), Remesh, 'BLOCK');
      menu.addButton(TR('remeshRemesh'), this, 'remesh');

      // dynamic
      menu.addTitle(TR('dynamicTitle'));
      this._ctrlDynamic = menu.addCheckbox(TR('dynamicActivated'), false, this.dynamicToggleActivate.bind(this));
      this._ctrlDynSubd = menu.addSlider(TR('dynamicSubdivision'), Topology, 'subFactor', 0, 100, 1);
      this._ctrlDynDec = menu.addSlider(TR('dynamicDecimation'), Topology, 'decFactor', 0, 100, 1);
      this._ctrlDynLin = menu.addCheckbox(TR('dynamicLinear'), Topology, 'linear');
      this.updateDynamicVisibility(false);
    },
    updateDynamicVisibility: function (bool) {
      this._ctrlDynSubd.setVisibility(bool);
      this._ctrlDynDec.setVisibility(bool);
      this._ctrlDynLin.setVisibility(bool);
    },
    dynamicToggleActivate: function () {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      var newMesh = !mesh.getDynamicTopology ? new MeshDynamic(mesh) : this.convertToStaticMesh(mesh);
      this.updateDynamicVisibility(!mesh.getDynamicTopology);

      main.replaceMesh(mesh, newMesh);
      main.getStates().pushStateAddRemove(newMesh, mesh);
    },
    remesh: function () {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      var meshes = main.getMeshes();
      var selMeshes = main.getSelectedMeshes().slice();
      for (var i = 0, l = selMeshes.length; i < l; ++i) {
        var sel = selMeshes[i];
        meshes.splice(main.getIndexMesh(sel), 1);
        selMeshes[i] = this.convertToStaticMesh(sel);
        if (sel === mesh)
          mesh = selMeshes[i];
      }
      var newMesh = Remesh.remesh(selMeshes, mesh);
      main.getStates().pushStateAddRemove(newMesh, main.getSelectedMeshes().slice());
      main.getMeshes().push(newMesh);
      main.setMesh(newMesh);
    },
    /** Check if the mesh is a multiresolution one */
    isMultimesh: function (mesh) {
      return !!(mesh && mesh._meshes);
    },
    convertToStaticMesh: function (mesh) {
      if (!mesh.getDynamicTopology) // already static
        return mesh;
      // dynamic to static mesh
      var newMesh = new Mesh(mesh.getGL());
      newMesh.setID(mesh.getID());
      newMesh.setTransformData(mesh.getTransformData());
      newMesh.setVertices(mesh.getVertices().subarray(0, mesh.getNbVertices() * 3));
      newMesh.setColors(mesh.getColors().subarray(0, mesh.getNbVertices() * 3));
      newMesh.setMaterials(mesh.getMaterials().subarray(0, mesh.getNbVertices() * 3));
      newMesh.setFaces(mesh.getFaces().subarray(0, mesh.getNbFaces() * 4));
      newMesh.init();
      newMesh.setRender(mesh.getRender());
      mesh.getRender()._mesh = newMesh;
      newMesh.initRender();
      return newMesh;
    },
    /** Convert a mesh into a multiresolution one */
    convertToMultimesh: function (mesh) {
      if (this.isMultimesh(mesh))
        return mesh;
      var multimesh = new Multimesh(this.convertToStaticMesh(mesh));
      return multimesh;
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      var mul = this.convertToMultimesh(mesh);
      if (mul._sel !== mul._meshes.length - 1) {
        window.alert(TR('multiresSelectHighest'));
        return;
      }
      if (mul.getNbTriangles() > 400000) {
        if (!window.confirm(TR('multiresWarnBigMesh', mul.getNbFaces() * 4))) {
          if (mesh !== mul)
            mesh.getRender()._mesh = mesh;
          return;
        }
      }

      if (mesh !== mul) {
        main.replaceMesh(mesh, mul);
        main.getStates().pushStateAddRemove(mul, mesh, true);
      }
      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.SUBDIVISION));
      mul.addLevel();
      main.setMesh(mul);
      main.render();
    },
    /** Inverse subdivision */
    reverse: function () {
      var main = this._main;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      var mul = this.convertToMultimesh(mesh);
      if (mul._sel !== 0) {
        window.alert(TR('multiresSelectLowest'));
        return;
      }
      var stateRes = new StateMultiresolution(main, mul, StateMultiresolution.REVERSION);
      var newMesh = mul.computeReverse();
      if (!newMesh) {
        if (mesh !== mul)
          mesh.getRender()._mesh = mesh;
        window.alert(TR('multiresNotReversible'));
        return;
      }

      if (mesh !== mul) {
        main.replaceMesh(mesh, mul);
        main.getStates().pushStateAddRemove(mul, mesh, true);
      }
      main.getStates().pushState(stateRes);
      main.setMesh(mul);
      main.render();
    },
    /** Delete the lower meshes */
    deleteLower: function () {
      var main = this._main;
      var mul = main._mesh;
      if (!this.isMultimesh(mul) || mul._sel === 0) {
        window.alert(TR('multiresNoLower'));
        return;
      }

      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_LOWER));
      mul.deleteLower();
      this.updateMeshResolution();
    },
    /** Delete the higher meshes */
    deleteHigher: function () {
      var main = this._main;
      var mul = main.getMesh();
      if (!this.isMultimesh(mul) || mul._sel === mul._meshes.length - 1) {
        window.alert(TR('multiresNoHigher'));
        return;
      }

      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_HIGHER));
      mul.deleteHigher();
      this.updateMeshResolution();
    },
    /** Change resoltuion */
    onResolutionChanged: function (value) {
      var uiRes = value - 1;
      var main = this._main;
      var multimesh = main.getMesh();
      if (!multimesh) return;
      var isMulti = this.isMultimesh(multimesh);
      var isLast = isMulti && multimesh._meshes.length - 1 === uiRes;

      this._ctrlReverse.setEnable(!isMulti || uiRes === 0);
      this._ctrlSubdivide.setEnable(!isMulti || isLast);
      this._ctrlDelLower.setEnable(isMulti && uiRes !== 0);
      this._ctrlDelHigher.setEnable(isMulti && !isLast);

      if (!isMulti || multimesh._sel === uiRes)
        return;

      main.getStates().pushState(new StateMultiresolution(main, multimesh, StateMultiresolution.SELECTION));
      multimesh.selectResolution(uiRes);
      this._ctrlGui.updateMeshInfo();
      main.render();
    },
    /** Update the mesh resolution slider */
    updateMeshResolution: function () {
      var multimesh = this._main.getMesh();
      if (!multimesh || !this.isMultimesh(multimesh)) {
        this._ctrlResolution.setMax(1);
        this._ctrlResolution.setValue(0);
        return;
      }
      this._ctrlResolution.setMax(multimesh._meshes.length);
      this._ctrlResolution.setValue(multimesh._sel + 1);
    },
    /** Update topology information */
    updateMesh: function () {
      if (!this._main.getMesh()) {
        this._menu.setVisibility(false);
        return;
      }
      this._menu.setVisibility(true);
      this.updateMeshResolution();
      var bool = this._main.getMesh().getDynamicTopology;
      this.updateDynamicVisibility(bool);
      this._ctrlDynamic.setValue(bool, true);
    }
  };

  module.exports = GuiMultiresolution;
});