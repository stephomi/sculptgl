import Utils from 'misc/Utils';

class StateColorAndMaterial {

  constructor(main, mesh) {
    this._main = main; // main application
    this._mesh = mesh; // the mesh
    this._idVertState = []; // ids of vertices
    this._cArState = []; // copies of color vertices
    this._mArState = []; // copies of material vertices
  }

  isNoop() {
    return this._idVertState.length === 0;
  }

  undo() {
    this.pullVertices();
    var mesh = this._mesh;
    mesh.updateDuplicateColorsAndMaterials();
    mesh.updateDrawArrays();
    mesh.updateColorBuffer();
    mesh.updateMaterialBuffer();
    this._main.setMesh(mesh);
  }

  redo() {
    this.undo();
  }

  createRedo() {
    var redo = new StateColorAndMaterial(this._main, this._mesh);
    this.pushRedoVertices(redo);
    return redo;
  }

  pushVertices(iVerts) {
    var idVertState = this._idVertState;
    var cArState = this._cArState;
    var mArState = this._mArState;

    var mesh = this._mesh;
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    var vertStateFlags = mesh.getVerticesStateFlags();

    var stateFlag = Utils.STATE_FLAG;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i) {
      var id = iVerts[i];
      if (vertStateFlags[id] === stateFlag)
        continue;
      vertStateFlags[id] = stateFlag;
      idVertState.push(id);
      id *= 3;
      cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
      mArState.push(mAr[id], mAr[id + 1], mAr[id + 2]);
    }
  }

  pushRedoVertices(redoState) {
    var mesh = redoState._mesh;
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();

    var idVertUndoState = this._idVertState;
    var nbVerts = idVertUndoState.length;

    var cArRedoState = redoState._cArState = new Float32Array(nbVerts * 3);
    var mArRedoState = redoState._mArState = new Float32Array(nbVerts * 3);
    var idVertRedoState = redoState._idVertState = new Uint32Array(nbVerts);
    for (var i = 0; i < nbVerts; ++i) {
      var id = idVertRedoState[i] = idVertUndoState[i];
      id *= 3;
      var j = i * 3;
      cArRedoState[j] = cAr[id];
      cArRedoState[j + 1] = cAr[id + 1];
      cArRedoState[j + 2] = cAr[id + 2];
      mArRedoState[j] = mAr[id];
      mArRedoState[j + 1] = mAr[id + 1];
      mArRedoState[j + 2] = mAr[id + 2];
    }
  }

  pullVertices() {
    var cArState = this._cArState;
    var mArState = this._mArState;
    var idVertState = this._idVertState;
    var nbVerts = idVertState.length;

    var mesh = this._mesh;
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    for (var i = 0; i < nbVerts; ++i) {
      var id = idVertState[i] * 3;
      var j = i * 3;
      cAr[id] = cArState[j];
      cAr[id + 1] = cArState[j + 1];
      cAr[id + 2] = cArState[j + 2];
      mAr[id] = mArState[j];
      mAr[id + 1] = mArState[j + 1];
      mAr[id + 2] = mArState[j + 2];
    }
  }
}

export default StateColorAndMaterial;
