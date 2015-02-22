define([
  'gui/GuiTR',
  'editor/Remesh',
  'mesh/Mesh',
  'mesh/multiresolution/Multimesh',
  'mesh/dynamic/MeshDynamic',
  'mesh/dynamic/Topology',
  'states/StateMultiresolution'
], function (TR, Remesh, Mesh, Multimesh, MeshDynamic, Topology, StateMultiresolution) {

  'use strict';

  var GuiMultiresolution = function (guiParent, ctrlGui) {
    this.ctrlGui_ = ctrlGui;
    this.main_ = ctrlGui.main_; // main application
    this.menu_ = null; // ui menu
    this.ctrlResolution_ = null; // multiresolution controller
    this.ctrlDynamic_ = null; // dynamic topology controller
    this.init(guiParent);
  };

  GuiMultiresolution.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var menu = this.menu_ = guiParent.addMenu(TR('topologyTitle'));
      menu.close();

      // multires
      menu.addTitle(TR('multiresTitle'));
      this.ctrlResolution_ = menu.addSlider(TR('multiresResolution'), 1, this.onResolutionChanged.bind(this), 1, 1, 1);
      var dual = menu.addDualButton(TR('multiresReverse'), TR('multiresSubdivide'), this, this, 'reverse', 'subdivide');
      this.ctrlReverse_ = dual[0];
      this.ctrlSubdivide_ = dual[1];
      dual = this.dualButtonDel_ = menu.addDualButton(TR('multiresDelLower'), TR('multiresDelHigher'), this, this, 'deleteLower', 'deleteHigher');
      this.ctrlDelLower_ = dual[0];
      this.ctrlDelHigher_ = dual[1];
      this.ctrlDelLower_.domButton.style.background = this.ctrlDelHigher_.domButton.style.background = 'rgba(230,53,59,0.35)';

      // remeshing
      menu.addTitle(TR('remeshTitle'));
      menu.addSlider(TR('remeshResolution'), Remesh, 'RESOLUTION', 8, 400, 1);
      menu.addCheckbox(TR('remeshBlock'), Remesh, 'BLOCK');
      menu.addButton(TR('remeshRemesh'), this, 'remesh');

      // dynamic
      menu.addTitle(TR('dynamicTitle'));
      this.ctrlDynamic_ = menu.addCheckbox(TR('dynamicActivated'), false, this.dynamicToggleActivate.bind(this));
      this.ctrlDynSubd_ = menu.addSlider(TR('dynamicSubdivision'), Topology.subFactor, this.dynamicSubdivision.bind(this), 0, 100, 1);
      this.ctrlDynDec_ = menu.addSlider(TR('dynamicDecimation'), Topology.decFactor, this.dynamicDecimation.bind(this), 0, 100, 1);
      this.ctrlDynLin_ = menu.addCheckbox(TR('dynamicLinear'), Topology.linear, this.dynamicToggleLinear.bind(this));
      this.updateDynamicVisibility(false);
    },
    updateDynamicVisibility: function (bool) {
      this.ctrlDynSubd_.setVisibility(bool);
      this.ctrlDynDec_.setVisibility(bool);
      this.ctrlDynLin_.setVisibility(bool);
    },
    dynamicToggleActivate: function () {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('DYNAMIC_TOGGLE_ACTIVATE');

      var newMesh = !mesh.getDynamicTopology ? new MeshDynamic(mesh) : this.convertToStaticMesh(mesh);
      this.updateDynamicVisibility(!mesh.getDynamicTopology);

      main.replaceMesh(mesh, newMesh);
      main.getStates().pushStateAddRemove(newMesh, mesh);
      this.updateMesh();
    },
    dynamicToggleLinear: function () {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('DYNAMIC_TOGGLE_LINEAR');
      Topology.linear = !Topology.linear;
    },
    dynamicSubdivision: function (val) {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('DYNAMIC_SUBDIVISION', val);
      Topology.subFactor = val;
    },
    dynamicDecimation: function (val) {
      var main = this.main_;
      if (!main.isReplayed())
        main.getReplayWriter().pushAction('DYNAMIC_DECIMATION', val);
      Topology.decFactor = val;
    },
    /** Remesh the mesh */
    remesh: function () {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('VOXEL_REMESH', Remesh.RESOLUTION, Remesh.BLOCK);

      var meshes = main.getMeshes().slice();
      for (var i = 0, l = meshes.length; i < l; ++i) {
        if (meshes[i] === mesh)
          mesh = meshes[i] = this.convertToStaticMesh(meshes[i]);
        else
          meshes[i] = this.convertToStaticMesh(meshes[i]);
      }
      var newMesh = Remesh.remesh(mesh, meshes);
      main.getStates().pushStateAddRemove(newMesh, main.getMeshes().slice());
      main.meshes_.length = 0;
      main.meshes_.push(newMesh);
      main.setMesh(newMesh);
    },
    /** Check if the mesh is a multiresolution one */
    isMultimesh: function (mesh) {
      return !!(mesh && mesh.meshes_);
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
      newMesh.init(true);
      newMesh.setRender(mesh.getRender());
      mesh.getRender().mesh_ = newMesh;
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
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      var mul = this.convertToMultimesh(mesh);
      if (mul.sel_ !== mul.meshes_.length - 1) {
        window.alert(TR('multiresSelectHighest'));
        return;
      }
      if (mul.getNbTriangles() > 400000 && !main.isReplayed()) {
        if (!window.confirm(TR('multiresWarnBigMesh', mul.getNbFaces() * 4))) {
          if (mesh !== mul)
            mesh.getRender().mesh_ = mesh;
          return;
        }
      }

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MULTI_SUBDIVIDE');

      if (mesh !== mul) {
        main.replaceMesh(mesh, mul);
        main.getStates().pushStateAddRemove(mul, mesh, true);
      }
      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.SUBDIVISION));
      mul.addLevel();
      this.ctrlGui_.updateMeshInfo();
      main.setMesh(mul);
      main.render();
    },
    /** Inverse subdivision */
    reverse: function () {
      var main = this.main_;
      var mesh = main.getMesh();
      if (!mesh)
        return;
      var mul = this.convertToMultimesh(mesh);
      if (mul.sel_ !== 0) {
        window.alert(TR('multiresSelectLowest'));
        return;
      }
      var stateRes = new StateMultiresolution(main, mul, StateMultiresolution.REVERSION);
      var newMesh = mul.computeReverse();
      if (!newMesh) {
        if (mesh !== mul)
          mesh.getRender().mesh_ = mesh;
        window.alert(TR('multiresNotReversible'));
        return;
      }

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MULTI_REVERSE');

      if (mesh !== mul) {
        main.replaceMesh(mesh, mul);
        main.getStates().pushStateAddRemove(mul, mesh, true);
      }
      main.getStates().pushState(stateRes);
      this.ctrlGui_.updateMeshInfo();
      main.setMesh(mul);
      main.render();
    },
    /** Delete the lower meshes */
    deleteLower: function () {
      var main = this.main_;
      var mul = main.mesh_;
      if (!this.isMultimesh(mul) || mul.sel_ === 0) {
        window.alert(TR('multiresNoLower'));
        return;
      }

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MULTI_DEL_LOWER');

      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_LOWER));
      mul.deleteLower();
      this.updateMeshResolution();
    },
    /** Delete the higher meshes */
    deleteHigher: function () {
      var main = this.main_;
      var mul = main.getMesh();
      if (!this.isMultimesh(mul) || mul.sel_ === mul.meshes_.length - 1) {
        window.alert(TR('multiresNoHigher'));
        return;
      }

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MULTI_DEL_HIGHER');

      main.getStates().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_HIGHER));
      mul.deleteHigher();
      this.updateMeshResolution();
    },
    /** Change resoltuion */
    onResolutionChanged: function (value) {
      var uiRes = value - 1;
      var main = this.main_;
      var multimesh = main.getMesh();
      if (!multimesh) return;
      var isMulti = this.isMultimesh(multimesh);
      var isLast = isMulti && multimesh.meshes_.length - 1 === uiRes;

      this.ctrlReverse_.setEnable(!isMulti || uiRes === 0);
      this.ctrlSubdivide_.setEnable(!isMulti || isLast);
      this.ctrlDelLower_.setEnable(isMulti && uiRes !== 0);
      this.ctrlDelHigher_.setEnable(isMulti && !isLast);

      if (!isMulti || multimesh.sel_ === uiRes)
        return;

      if (!main.isReplayed())
        main.getReplayWriter().pushAction('MULTI_RESOLUTION', value);

      main.getStates().pushState(new StateMultiresolution(main, multimesh, StateMultiresolution.SELECTION));
      multimesh.selectResolution(uiRes);
      this.ctrlGui_.updateMeshInfo();
      main.render();
    },
    /** Update the mesh resolution slider */
    updateMeshResolution: function () {
      var multimesh = this.main_.getMesh();
      if (!multimesh || !this.isMultimesh(multimesh)) {
        this.ctrlResolution_.setMax(1);
        this.ctrlResolution_.setValue(0);
        return;
      }
      this.ctrlResolution_.setMax(multimesh.meshes_.length);
      this.ctrlResolution_.setValue(multimesh.sel_ + 1);
    },
    /** Update topology information */
    updateMesh: function () {
      if (!this.main_.getMesh()) {
        this.menu_.setVisibility(false);
        return;
      }
      this.menu_.setVisibility(true);
      this.updateMeshResolution();
      var bool = this.main_.getMesh().getDynamicTopology;
      this.updateDynamicVisibility(bool);
      this.ctrlDynamic_.setValue(bool, true);
    }
  };

  return GuiMultiresolution;
});