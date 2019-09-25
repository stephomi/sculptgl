import Utils from 'misc/Utils';
import StAddRemove from 'states/StateAddRemove';
import StColorAndMaterial from 'states/StateColorAndMaterial';
import StGeometry from 'states/StateGeometry';
import StDynamic from 'states/StateDynamic';
import StMultiresolution from 'states/StateMultiresolution';
import StCustom from 'states/StateCustom';

class StateManager {

  constructor(main) {
    this._main = main; // main
    this._undos = []; // undo actions
    this._redos = []; // redo actions
    this._curUndoIndex = -1; // current index in undo
  }

  pushStateCustom(undocb, redocb, squash) {
    var st = new StCustom(undocb, redocb);
    st.squash = squash;
    this.pushState(st);
  }

  pushStateAddRemove(addMesh, remMesh, squash) {
    var st = new StAddRemove(this._main, addMesh, remMesh);
    st.squash = squash;
    this.pushState(st);
  }

  pushStateRemove(remMesh) {
    this.pushState(new StAddRemove(this._main, [], remMesh));
  }

  pushStateAdd(addMesh) {
    this.pushState(new StAddRemove(this._main, addMesh, []));
  }

  pushStateColorAndMaterial(mesh) {
    if (mesh.isDynamic)
      this.pushState(new StDynamic(this._main, mesh));
    else
      this.pushState(new StColorAndMaterial(this._main, mesh));
  }

  pushStateGeometry(mesh) {
    if (mesh.isDynamic)
      this.pushState(new StDynamic(this._main, mesh));
    else
      this.pushState(new StGeometry(this._main, mesh));
  }

  pushStateMultiresolution(multimesh, type) {
    this.pushState(new StMultiresolution(this._main, multimesh, type));
  }

  setNewMaxStack(maxStack) {
    StateManager.STACK_LENGTH = maxStack;
    var undos = this._undos;
    var redos = this._redos;
    while (this._curUndoIndex >= maxStack) {
      undos.shift();
      --this._curUndoIndex;
    }
    while (undos.length > maxStack) {
      undos.pop();
      redos.shift();
    }
  }

  pushState(state) {
    ++Utils.STATE_FLAG;
    var undos = this._undos;
    if (this._curUndoIndex === -1) undos.length = 0;
    else if (undos.length >= StateManager.STACK_LENGTH) {
      undos.shift();
      --this._curUndoIndex;
    }
    this._redos.length = 0;
    ++this._curUndoIndex;
    if (undos.length > 0)
      undos.length = this._curUndoIndex;
    undos.push(state);
  }

  getCurrentState() {
    return this._undos[this._curUndoIndex];
  }

  pushVertices(iVerts) {
    if (iVerts && iVerts.length > 0)
      this.getCurrentState().pushVertices(iVerts);
  }

  pushFaces(iFaces) {
    if (iFaces && iFaces.length > 0)
      this.getCurrentState().pushFaces(iFaces);
  }

  undo() {
    if (!this._undos.length || this._curUndoIndex < 0)
      return;

    var state = this.getCurrentState();
    var redoState = state.createRedo();
    redoState.squash = state.squash;
    this._redos.push(redoState);
    state.undo();

    this._curUndoIndex--;
    if (state.squash === true)
      this.undo();
  }

  redo() {
    if (!this._redos.length)
      return;

    var state = this._redos[this._redos.length - 1];
    state.redo();
    this._curUndoIndex++;
    this._redos.pop();
    if (this._redos.length && this._redos[this._redos.length - 1].squash === true)
      this.redo();
  }

  reset() {
    this._undos.length = 0;
    this._redos.length = 0;
    this._curUndoIndex = -1;
  }

  cleanNoop() {
    while (this._curUndoIndex >= 0 && this.getCurrentState().isNoop()) {
      this._undos.length--;
      this._curUndoIndex--;
      this._redos.length = 0;
    }
  }
}

StateManager.STACK_LENGTH = 15;

export default StateManager;
