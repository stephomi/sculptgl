import TR from 'gui/GuiTR';
import Remesh from 'editing/Remesh';
import ShaderBase from 'render/shaders/ShaderBase';

class GuiScene {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null;
    this._hideMeshes = [];
    this._cbToggleShowHide = this.toggleShowHide.bind(this, true);
    this.init(guiParent);
  }

  init(guiParent) {
    var menu = this._menu = guiParent.addMenu(TR('sceneTitle'));

    // scene
    menu.addButton(TR('sceneReset'), this._main, 'clearScene' /*, 'CTRL+ALT+N'*/ );
    menu.addButton(TR('sceneAddSphere'), this._main, 'addSphere');
    menu.addButton(TR('sceneAddCube'), this._main, 'addCube');
    menu.addButton(TR('sceneAddCylinder'), this._main, 'addCylinder');
    menu.addButton(TR('sceneAddTorus'), this._main, 'addTorus');

    // menu.addTitle(TR('Torus'));
    // menu.addSlider(TR('Arc'), this._main._torusRadius, this.updateTorusRadius.bind(this), 0.01, Math.PI * 2, 0.001);
    // this.ctrlWI = menu.addSlider(TR('Width'), this._main._torusWidth, this.updateTorusWidth.bind(this), 0.01, 0.5, 0.01);
    // this.ctrlLE = menu.addSlider(TR('Length'), this._main._torusLength, this.updateTorusLength.bind(this), 0.2, 2.0, 0.01);
    // menu.addSlider(TR('Radial'), this._main._torusRadial, this.updateTorusRadial.bind(this), 3, 64, 1);
    // menu.addSlider(TR('Tubular'), this._main._torusTubular, this.updateTorusTubular.bind(this), 3, 256, 1);

    // this.ctrlValidate = menu.addButton(TR('Validate !'), this, 'validatePreview');
    // this.ctrlValidate.setVisibility(false);
    // this.ctrlDiscard = menu.addButton(TR('Discard !'), this, 'discardPreview');
    // this.ctrlDiscard.setVisibility(false);

    // selection stuffs
    menu.addTitle(TR('sceneSelection'));
    this._ctrlIsolate = menu.addCheckbox(TR('renderingIsolate'), false, this.showHide.bind(this));
    this._ctrlIsolate.setVisibility(false);
    this._ctrlMerge = menu.addButton(TR('sceneMerge'), this, 'merge');
    this._ctrlMerge.setVisibility(false);

    menu.addButton(TR('sceneDuplicate'), this, 'duplicateSelection');

    // extra
    menu.addTitle(TR('renderingExtra'));
    menu.addCheckbox(TR('darkenUnselected'), ShaderBase.darkenUnselected, this.onDarkenUnselected.bind(this));
    menu.addCheckbox(TR('contourShow'), this._main._showContour, this.onShowContour.bind(this));
    menu.addCheckbox(TR('renderingGrid'), this._main._showGrid, this.onShowGrid.bind(this));
    menu.addCheckbox(TR('renderingSymmetryLine'), ShaderBase.showSymmetryLine, this.onShowSymmetryLine.bind(this));
  }

  duplicateSelection() {
    this._main.duplicateSelection();
  }

  validatePreview() {
    if (!this._main._meshPreview)
      this._main.addTorus(true);

    this._main._meshPreview.setShowWireframe(false);
    this._main.addNewMesh(this._main._meshPreview);
    this._main._meshPreview = null;

    this.ctrlDiscard.setVisibility(false);
    this.ctrlValidate.setVisibility(false);
    this._main.render();
  }

  discardPreview() {
    this._main._meshPreview = null;
    this.ctrlDiscard.setVisibility(false);
    this.ctrlValidate.setVisibility(false);
    this._main.render();
  }

  updateTorusRadius(val) {
    this._main._torusRadius = val;
    this.updateTorus();
  }

  updateTorusRadial(val) {
    this._main._torusRadial = val;
    this.updateTorus();
  }

  updateTorusTubular(val) {
    this._main._torusTubular = val;
    this.updateTorus();
  }

  updateTorusWidth(val) {
    this._main._torusWidth = val;
    if (this._main._torusLength < this._main._torusWidth) {
      this.ctrlLE.setValue(val);
      return;
    }
    this.updateTorus();
  }

  updateTorusLength(val) {
    this._main._torusLength = val;
    if (this._main._torusLength < this._main._torusWidth) {
      this.ctrlWI.setValue(val);
      return;
    }
    this.updateTorus();
  }

  updateTorus() {
    this._main.addTorus(true);
    this.ctrlDiscard.setVisibility(true);
    this.ctrlValidate.setVisibility(true);
    this._main.render();
  }

  updateMesh() {
    var nbMeshes = this._main.getMeshes().length;
    var nbSelected = this._main.getSelectedMeshes().length;
    this._ctrlIsolate.setVisibility(this._hideMeshes.length > 0 || (nbMeshes !== nbSelected && nbSelected >= 1));
    this._ctrlMerge.setVisibility(nbSelected > 1);
  }

  merge() {
    var main = this._main;
    var selMeshes = main.getSelectedMeshes();
    if (selMeshes.length < 2) return;

    var newMesh = Remesh.mergeMeshes(selMeshes, main.getMesh() || selMeshes[0]);
    main.removeMeshes(selMeshes);
    main.getStateManager().pushStateAddRemove(newMesh, selMeshes.slice());
    main.getMeshes().push(newMesh);
    main.setMesh(newMesh);
  }

  toggleShowHide(ignoreCB) {
    this._ctrlIsolate.setValue(!this._ctrlIsolate.getValue(), !!ignoreCB);
  }

  showHide(bool) {
    if (bool) this.isolate();
    else this.showAll();
    this.updateMesh();
  }

  isolate() {
    var main = this._main;
    var selMeshes = main.getSelectedMeshes();
    var meshes = main.getMeshes();
    if (meshes.length === selMeshes.length || meshes.length < 2) {
      this._ctrlIsolate.setValue(false, true);
      return;
    }

    var hMeshes = this._hideMeshes;
    hMeshes.length = 0;
    for (var i = 0; i < meshes.length; ++i) {
      var id = main.getIndexSelectMesh(meshes[i]);
      if (id < 0) {
        hMeshes.push(meshes[i]);
        meshes.splice(i--, 1);
      }
    }

    main.getStateManager().pushStateRemove(hMeshes.slice());
    main.getStateManager().pushStateCustom(this._cbToggleShowHide, this._cbToggleShowHide, true);
    main.render();
  }

  showAll() {
    var main = this._main;
    var meshes = main.getMeshes();
    var hMeshes = this._hideMeshes;
    for (var i = 0, nbAdd = hMeshes.length; i < nbAdd; ++i) {
      meshes.push(hMeshes[i]);
    }
    main.getStateManager().pushStateAdd(hMeshes.slice());
    main.getStateManager().pushStateCustom(this._cbToggleShowHide, this._cbToggleShowHide, true);
    hMeshes.length = 0;
    main.render();
  }

  onDarkenUnselected(val) {
    ShaderBase.darkenUnselected = val;
    this._main.render();
  }

  onShowSymmetryLine(val) {
    ShaderBase.showSymmetryLine = val;
    this._main.render();
  }

  onShowGrid(bool) {
    var main = this._main;
    main._showGrid = bool;
    main.render();
  }

  onShowContour(bool) {
    var main = this._main;
    main._showContour = bool;
    main.render();
  }

  ////////////////
  // KEY EVENTS
  ////////////////
  onKeyDown(event) {
    if (event.handled === true)
      return;

    event.stopPropagation();
    if (!this._main._focusGui)
      event.preventDefault();

    if (event.which === 73) { // I
      this.toggleShowHide();
      event.handled = true;
    } else if (event.which === 68 && event.ctrlKey) { // D
      this._main.duplicateSelection();
      event.handled = true;
    }
  }
}

export default GuiScene;
