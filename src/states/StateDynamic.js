import { vec3 } from 'gl-matrix';
import Utils from 'misc/Utils';

class StateDynamic {

  constructor(main, mesh) {
    this._main = main; // main application
    this._mesh = mesh; // the mesh
    this._center = vec3.copy([0.0, 0.0, 0.0], mesh.getCenter());

    this._nbFacesState = mesh.getNbFaces(); // number of faces
    this._nbVerticesState = mesh.getNbVertices(); // number of vertices

    this._idVertState = []; // ids of vertices
    this._fRingState = []; // ring of faces around vertices
    this._vRingState = []; // ring of faces around vertices
    this._vArState = []; // copies of vertices coordinates
    this._cArState = []; // copies of color vertices
    this._mArState = []; // copies of material vertices

    this._idFaceState = []; // ids of faces
    this._fArState = []; // copies of face indices
  }

  isNoop() {
    return this._idVertState.length === 0 && this._idFaceState.length === 0;
  }

  undo() {
    this.pullVertices();
    this.pullFaces();
    var mesh = this._mesh;
    // mesh.getVerticesRingFace().length = this._nbVerticesState;
    // mesh.getVerticesRingVert().length = this._nbVerticesState;
    mesh.setNbVertices(this._nbVerticesState);
    mesh.setNbFaces(this._nbFacesState);

    mesh.updateTopology( /*this._idFaceState, this._idVertState*/ ); // TODO local update ?
    mesh.updateGeometry( /*this._idFaceState, this._idVertState*/ ); // TODO local update ?
    mesh.updateDuplicateColorsAndMaterials();
    mesh.updateDrawArrays();
    mesh.updateColorBuffer();
    mesh.updateMaterialBuffer();
    mesh.updateBuffers();
    vec3.copy(mesh.getCenter(), this._center);
    this._main.setMesh(mesh);
  }

  redo() {
    this.undo();
  }

  createRedo() {
    var redo = new StateDynamic(this._main, this._mesh);
    this.pushRedoVertices(redo);
    this.pushRedoFaces(redo);
    return redo;
  }

  pushVertices(iVerts) {
    var idVertState = this._idVertState;
    var fRingState = this._fRingState;
    var vRingState = this._vRingState;
    var vArState = this._vArState;
    var cArState = this._cArState;
    var mArState = this._mArState;

    var mesh = this._mesh;
    var fRing = mesh.getVerticesRingFace();
    var vRing = mesh.getVerticesRingVert();
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    var vStateFlags = mesh.getVerticesStateFlags();

    var stateFlag = Utils.STATE_FLAG;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i) {
      var id = iVerts[i];
      if (vStateFlags[id] === stateFlag)
        continue;
      vStateFlags[id] = stateFlag;
      fRingState.push(fRing[id].slice());
      vRingState.push(vRing[id].slice());
      idVertState.push(id);
      id *= 3;
      vArState.push(vAr[id], vAr[id + 1], vAr[id + 2]);
      cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
      mArState.push(mAr[id], mAr[id + 1], mAr[id + 2]);
    }
  }

  pushFaces(iFaces) {
    var idFaceState = this._idFaceState;
    var fArState = this._fArState;

    var mesh = this._mesh;
    var fAr = mesh.getFaces();
    var fStateFlags = mesh.getFacesStateFlags();

    var stateFlag = Utils.STATE_FLAG;
    var nbFaces = iFaces.length;
    for (var i = 0; i < nbFaces; ++i) {
      var id = iFaces[i];
      if (fStateFlags[id] === stateFlag)
        continue;
      fStateFlags[id] = stateFlag;
      idFaceState.push(id);
      id *= 4;
      fArState.push(fAr[id], fAr[id + 1], fAr[id + 2], fAr[id + 3]);
    }
  }

  pushRedoVertices(redoState) {
    var mesh = redoState._mesh;
    var nbMeshVertices = mesh.getNbVertices();
    var fRing = mesh.getVerticesRingFace();
    var vRing = mesh.getVerticesRingVert();
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();

    var i = 0;
    var id = 0;
    var acc = 0;
    var idVertUndoState = this._idVertState;
    var nbVerts = idVertUndoState.length;
    var nbVerticesState = this._nbVerticesState;
    var nbMin = Math.min(nbVerticesState, nbMeshVertices);
    var idVertRedoState = new Uint32Array(Utils.getMemory(nbMeshVertices * 4), 0, nbMeshVertices);
    for (i = 0; i < nbVerts; ++i) {
      id = idVertUndoState[i];
      if (id < nbMin)
        idVertRedoState[acc++] = id;
    }
    for (i = nbVerticesState; i < nbMeshVertices; ++i) {
      idVertRedoState[acc++] = i;
    }

    nbVerts = acc;
    idVertRedoState = redoState._idVertState = new Uint32Array(idVertRedoState.subarray(0, nbVerts));
    var fRingRedoState = redoState._fRingState = new Array(nbVerts);
    var vRingRedoState = redoState._vRingState = new Array(nbVerts);
    var vArRedoState = redoState._vArState = new Float32Array(nbVerts * 3);
    var cArRedoState = redoState._cArState = new Float32Array(nbVerts * 3);
    var mArRedoState = redoState._mArState = new Float32Array(nbVerts * 3);
    for (i = 0; i < nbVerts; ++i) {
      id = idVertRedoState[i];
      fRingRedoState[i] = fRing[id].slice();
      vRingRedoState[i] = vRing[id].slice();
      id *= 3;
      var j = i * 3;
      vArRedoState[j] = vAr[id];
      vArRedoState[j + 1] = vAr[id + 1];
      vArRedoState[j + 2] = vAr[id + 2];
      cArRedoState[j] = cAr[id];
      cArRedoState[j + 1] = cAr[id + 1];
      cArRedoState[j + 2] = cAr[id + 2];
      mArRedoState[j] = mAr[id];
      mArRedoState[j + 1] = mAr[id + 1];
      mArRedoState[j + 2] = mAr[id + 2];
    }
  }

  pushRedoFaces(redoState) {
    var mesh = redoState._mesh;
    var nbMeshFaces = mesh.getNbFaces();
    var fAr = mesh.getFaces();

    var i = 0;
    var id = 0;
    var acc = 0;
    var idFaceUndoState = this._idFaceState;
    var nbFaces = idFaceUndoState.length;
    var nbFacesState = this._nbFacesState;
    var nbMin = Math.min(nbFacesState, nbMeshFaces);
    var idFaceRedoState = new Uint32Array(Utils.getMemory(nbMeshFaces * 4), 0, nbMeshFaces);
    for (i = 0; i < nbFaces; ++i) {
      id = idFaceUndoState[i];
      if (id < nbMin)
        idFaceRedoState[acc++] = id;
    }
    for (i = nbFacesState; i < nbMeshFaces; ++i) {
      idFaceRedoState[acc++] = i;
    }

    nbFaces = acc;
    idFaceRedoState = redoState._idFaceState = new Uint32Array(idFaceRedoState.subarray(0, nbFaces));
    var fArRedoState = redoState._fArState = new Int32Array(nbFaces * 4);
    for (i = 0; i < nbFaces; ++i) {
      id = idFaceRedoState[i];
      id *= 4;
      var j = i * 4;
      fArRedoState[j] = fAr[id];
      fArRedoState[j + 1] = fAr[id + 1];
      fArRedoState[j + 2] = fAr[id + 2];
      fArRedoState[j + 3] = fAr[id + 3];
    }
  }

  pullVertices() {
    var nbMeshVertices = this._nbVerticesState;
    var fRingState = this._fRingState;
    var vRingState = this._vRingState;
    var vArState = this._vArState;
    var cArState = this._cArState;
    var mArState = this._mArState;
    var idVertState = this._idVertState;
    var nbVerts = idVertState.length;

    var mesh = this._mesh;
    var fRing = mesh.getVerticesRingFace();
    var vRing = mesh.getVerticesRingVert();
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    for (var i = 0; i < nbVerts; ++i) {
      var id = idVertState[i];
      if (id >= nbMeshVertices)
        continue;
      fRing[id] = fRingState[i].slice();
      vRing[id] = vRingState[i].slice();
      id *= 3;
      var j = i * 3;
      vAr[id] = vArState[j];
      vAr[id + 1] = vArState[j + 1];
      vAr[id + 2] = vArState[j + 2];
      cAr[id] = cArState[j];
      cAr[id + 1] = cArState[j + 1];
      cAr[id + 2] = cArState[j + 2];
      mAr[id] = mArState[j];
      mAr[id + 1] = mArState[j + 1];
      mAr[id + 2] = mArState[j + 2];
    }
  }

  pullFaces() {
    var nbMeshFaces = this._nbFacesState;
    var fArState = this._fArState;
    var idFaceState = this._idFaceState;
    var nbFaces = idFaceState.length;

    var mesh = this._mesh;
    var fAr = mesh.getFaces();
    for (var i = 0; i < nbFaces; ++i) {
      var id = idFaceState[i];
      if (id >= nbMeshFaces)
        continue;
      id *= 4;
      var j = i * 4;
      fAr[id] = fArState[j];
      fAr[id + 1] = fArState[j + 1];
      fAr[id + 2] = fArState[j + 2];
      fAr[id + 3] = fArState[j + 3];
    }
  }
}

export default StateDynamic;
