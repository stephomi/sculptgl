import TR from 'gui/GuiTR';
import Remesh from 'editing/Remesh';
import Mesh from 'mesh/Mesh';
import MeshStatic from 'mesh/meshStatic/MeshStatic';
import Multimesh from 'mesh/multiresolution/Multimesh';
import MeshDynamic from 'mesh/dynamic/MeshDynamic';
import StateMultiresolution from 'states/StateMultiresolution';
import getOptionsURL from 'misc/getOptionsURL';
import Enums from 'misc/Enums';

class GuiMultiresolution {

  constructor(guiParent, ctrlGui) {
    this._ctrlGui = ctrlGui;
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this._ctrlResolution = null; // multiresolution controller
    this._ctrlDynamic = null; // dynamic topology controller
    this.init(guiParent);
  }

  init(guiParent) {
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

    var cbResolution = this.remeshResolution.bind(this);

    // surface nets remeshing
    menu.addTitle(TR('remeshTitle'));
    this._ctrlRes1 = menu.addSlider(TR('remeshResolution'), Remesh.RESOLUTION, cbResolution, 8, 400, 1);
    menu.addCheckbox(TR('remeshBlock'), Remesh, 'BLOCK');
    menu.addButton(TR('remeshRemesh'), this, 'remesh');

    // marching cube remeshing
    menu.addTitle(TR('remeshTitleMC'));
    this._ctrlRes2 = menu.addSlider(TR('remeshResolution'), Remesh.RESOLUTION, cbResolution, 8, 400, 1);
    menu.addCheckbox(TR('remeshSmoothingMC'), Remesh, 'SMOOTHING');
    menu.addButton(TR('remeshRemeshMC'), this, 'remeshMC');

    // dynamic
    menu.addTitle(TR('dynamicTitle'));
    this._ctrlDynamic = menu.addCheckbox(TR('dynamicActivated'), false, this.dynamicToggleActivate.bind(this));
    this._ctrlDynSubd = menu.addSlider(TR('dynamicSubdivision'), MeshDynamic, 'SUBDIVISION_FACTOR', 0, 100, 1);
    this._ctrlDynDec = menu.addSlider(TR('dynamicDecimation'), MeshDynamic, 'DECIMATION_FACTOR', 0, 100, 1);
    this._ctrlDynLin = menu.addCheckbox(TR('dynamicLinear'), MeshDynamic, 'LINEAR');
    this.updateDynamicVisibility(false);
  }

  onKeyUp(event) {
    if (event.handled === true)
      return;

    var shk = getOptionsURL.getShortKey(event.which);
    event.stopPropagation();

    if (shk === Enums.KeyAction.REMESH) {
      this.remesh();
    }
  }

  updateDynamicVisibility(bool) {
    this._ctrlDynSubd.setVisibility(bool);
    this._ctrlDynDec.setVisibility(bool);
    this._ctrlDynLin.setVisibility(bool);
  }

  dynamicToggleActivate() {
    var main = this._main;
    var mesh = main.getMesh();
    if (!mesh)
      return;

    var newMesh = !mesh.isDynamic ? new MeshDynamic(mesh) : this.convertToStaticMesh(mesh);
    this.updateDynamicVisibility(!mesh.isDynamic);

    main.getStateManager().pushStateAddRemove(newMesh, mesh);
    main.replaceMesh(mesh, newMesh);
  }

  remeshResolution(val) {
    Remesh.RESOLUTION = val;
    this._ctrlRes1.setValue(val, true);
    this._ctrlRes2.setValue(val, true);
  }

  remesh(manifold) {
    var main = this._main;
    var mesh = main.getMesh();
    if (!mesh)
      return;

    var wasDynamic = mesh.isDynamic;

    var meshes = main.getMeshes();
    var selMeshes = main.getSelectedMeshes().slice();
    for (var i = 0, l = selMeshes.length; i < l; ++i) {
      var sel = selMeshes[i];
      meshes.splice(main.getIndexMesh(sel), 1);
      selMeshes[i] = this.convertToStaticMesh(sel);
      if (sel === mesh)
        mesh = selMeshes[i];
    }

    var newMesh = Remesh.remesh(selMeshes, mesh, manifold);
    if (wasDynamic) newMesh = new MeshDynamic(newMesh);
    main.getStateManager().pushStateAddRemove(newMesh, main.getSelectedMeshes().slice());
    main.getMeshes().push(newMesh);
    main.setMesh(newMesh);
  }

  remeshMC() {
    this.remesh(true);
  }

  /** Check if the mesh is a multiresolution one */
  isMultimesh(mesh) {
    return !!(mesh && mesh._meshes);
  }

  convertToStaticMesh(mesh) {
    if (!mesh.isDynamic) // already static
      return mesh;

    // dynamic to static mesh
    var newMesh = new MeshStatic(mesh.getGL());
    newMesh.setID(mesh.getID());
    newMesh.setTransformData(mesh.getTransformData());
    newMesh.setVertices(mesh.getVertices().subarray(0, mesh.getNbVertices() * 3));
    newMesh.setColors(mesh.getColors().subarray(0, mesh.getNbVertices() * 3));
    newMesh.setMaterials(mesh.getMaterials().subarray(0, mesh.getNbVertices() * 3));
    newMesh.setFaces(mesh.getFaces().subarray(0, mesh.getNbFaces() * 4));

    Mesh.OPTIMIZE = false;
    newMesh.init();
    Mesh.OPTIMIZE = true;

    newMesh.setRenderData(mesh.getRenderData());
    newMesh.initRender();
    return newMesh;
  }

  /** Convert a mesh into a multiresolution one */
  convertToMultimesh(mesh) {
    if (this.isMultimesh(mesh))
      return mesh;
    var multimesh = new Multimesh(this.convertToStaticMesh(mesh));
    return multimesh;
  }

  /** Subdivide the mesh */
  subdivide() {
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
        return;
      }
    }

    if (mesh !== mul) {
      main.replaceMesh(mesh, mul);
      main.getStateManager().pushStateAddRemove(mul, mesh, true);
    }

    main.getStateManager().pushState(new StateMultiresolution(main, mul, StateMultiresolution.SUBDIVISION));
    mul.addLevel();
    main.setMesh(mul);
    main.render();
  }

  /** Inverse subdivision */
  reverse() {
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
      window.alert(TR('multiresNotReversible'));
      return;
    }

    if (mesh !== mul) {
      main.replaceMesh(mesh, mul);
      main.getStateManager().pushStateAddRemove(mul, mesh, true);
    }

    main.getStateManager().pushState(stateRes);
    main.setMesh(mul);
    main.render();
  }

  /** Delete the lower meshes */
  deleteLower() {
    var main = this._main;
    var mul = main._mesh;
    if (!this.isMultimesh(mul) || mul._sel === 0) {
      window.alert(TR('multiresNoLower'));
      return;
    }

    main.getStateManager().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_LOWER));
    mul.deleteLower();
    this.updateMeshResolution();
  }

  /** Delete the higher meshes */
  deleteHigher() {
    var main = this._main;
    var mul = main.getMesh();
    if (!this.isMultimesh(mul) || mul._sel === mul._meshes.length - 1) {
      window.alert(TR('multiresNoHigher'));
      return;
    }

    main.getStateManager().pushState(new StateMultiresolution(main, mul, StateMultiresolution.DELETE_HIGHER));
    mul.deleteHigher();
    this.updateMeshResolution();
  }

  /** Change resoltuion */
  onResolutionChanged(value) {
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

    main.getStateManager().pushState(new StateMultiresolution(main, multimesh, StateMultiresolution.SELECTION));
    multimesh.selectResolution(uiRes);
    this._ctrlGui.updateMeshInfo();
    main.render();
  }

  /** Update the mesh resolution slider */
  updateMeshResolution() {
    var multimesh = this._main.getMesh();
    if (!multimesh || !this.isMultimesh(multimesh)) {
      this._ctrlResolution.setMax(1);
      this._ctrlResolution.setValue(0);
      return;
    }
    this._ctrlResolution.setMax(multimesh._meshes.length);
    this._ctrlResolution.setValue(multimesh._sel + 1);
  }

  /** Update topology information */
  updateMesh() {
    if (!this._main.getMesh()) {
      this._menu.setVisibility(false);
      return;
    }
    this._menu.setVisibility(true);
    this.updateMeshResolution();
    var bool = this._main.getMesh().isDynamic;
    this.updateDynamicVisibility(bool);
    this._ctrlDynamic.setValue(bool, true);
  }
}

export default GuiMultiresolution;
