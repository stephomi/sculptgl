define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;

  var StateDynamic = function (main, mesh) {
    this.main_ = main; // main application
    this.mesh_ = mesh; // the mesh
    this.center_ = vec3.copy([0.0, 0.0, 0.0], mesh.getCenter());

    this.nbFacesState_ = mesh.getNbFaces(); // number of faces
    this.nbVerticesState_ = mesh.getNbVertices(); // number of vertices

    this.idVertState_ = []; // ids of vertices
    this.fRingState_ = []; // ring of faces around vertices
    this.vRingState_ = []; // ring of faces around vertices
    this.vArState_ = []; // copies of vertices coordinates
    this.cArState_ = []; // copies of color vertices
    this.mArState_ = []; // copies of material vertices

    this.idFaceState_ = []; // ids of faces
    this.fArState_ = []; // copies of face indices
  };

  StateDynamic.prototype = {
    /** On undo */
    undo: function (skipUpdate) {
      this.pullVertices();
      this.pullFaces();
      var mesh = this.mesh_;
      // mesh.getVerticesRingFace().length = this.nbVerticesState_;
      // mesh.getVerticesRingVert().length = this.nbVerticesState_;
      mesh.setNbVertices(this.nbVerticesState_);
      mesh.setNbFaces(this.nbFacesState_);

      if (skipUpdate) return;
      mesh.updateGeometry( /*this.idFaceState_, this.idVertState_*/ ); // TODO local update ?
      mesh.updateTopology( /*this.idFaceState_*/ ); // TODO local update ?
      mesh.updateDuplicateColorsAndMaterials();
      mesh.updateFlatShading();
      mesh.updateColorBuffer();
      mesh.updateMaterialBuffer();
      mesh.updateBuffers();
      vec3.copy(mesh.getCenter(), this.center_);
      this.main_.setMesh(mesh);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      var redo = new StateDynamic(this.main_, this.mesh_);
      this.pushRedoVertices(redo);
      this.pushRedoFaces(redo);
      return redo;
    },
    /** Push vertices */
    pushVertices: function (iVerts) {
      var idVertState = this.idVertState_;
      var fRingState = this.fRingState_;
      var vRingState = this.vRingState_;
      var vArState = this.vArState_;
      var cArState = this.cArState_;
      var mArState = this.mArState_;

      var mesh = this.mesh_;
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
    },
    /** Push faces */
    pushFaces: function (iFaces) {
      var idFaceState = this.idFaceState_;
      var fArState = this.fArState_;

      var mesh = this.mesh_;
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
    },
    /** Push redo vertices */
    pushRedoVertices: function (redoState) {
      var mesh = redoState.mesh_;
      var nbMeshVertices = mesh.getNbVertices();
      var fRing = mesh.getVerticesRingFace();
      var vRing = mesh.getVerticesRingVert();
      var vAr = mesh.getVertices();
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();

      var i = 0;
      var id = 0;
      var acc = 0;
      var idVertUndoState = this.idVertState_;
      var nbVerts = idVertUndoState.length;
      var nbVerticesState = this.nbVerticesState_;
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
      idVertRedoState = redoState.idVertState_ = new Uint32Array(idVertRedoState.subarray(0, nbVerts));
      var fRingRedoState = redoState.fRingState_ = new Array(nbVerts);
      var vRingRedoState = redoState.vRingState_ = new Array(nbVerts);
      var vArRedoState = redoState.vArState_ = new Float32Array(nbVerts * 3);
      var cArRedoState = redoState.cArState_ = new Float32Array(nbVerts * 3);
      var mArRedoState = redoState.mArState_ = new Float32Array(nbVerts * 3);
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
    },
    /** Push redo faces */
    pushRedoFaces: function (redoState) {
      var mesh = redoState.mesh_;
      var nbMeshFaces = mesh.getNbFaces();
      var fAr = mesh.getFaces();

      var i = 0;
      var id = 0;
      var acc = 0;
      var idFaceUndoState = this.idFaceState_;
      var nbFaces = idFaceUndoState.length;
      var nbFacesState = this.nbFacesState_;
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
      idFaceRedoState = redoState.idFaceState_ = new Uint32Array(idFaceRedoState.subarray(0, nbFaces));
      var fArRedoState = redoState.fArState_ = new Int32Array(nbFaces * 4);
      for (i = 0; i < nbFaces; ++i) {
        id = idFaceRedoState[i];
        id *= 4;
        var j = i * 4;
        fArRedoState[j] = fAr[id];
        fArRedoState[j + 1] = fAr[id + 1];
        fArRedoState[j + 2] = fAr[id + 2];
        fArRedoState[j + 3] = fAr[id + 3];
      }
    },
    /** Pull vertices */
    pullVertices: function () {
      var nbMeshVertices = this.nbVerticesState_;
      var fRingState = this.fRingState_;
      var vRingState = this.vRingState_;
      var vArState = this.vArState_;
      var cArState = this.cArState_;
      var mArState = this.mArState_;
      var idVertState = this.idVertState_;
      var nbVerts = idVertState.length;

      var mesh = this.mesh_;
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
    },
    /** Pull faces */
    pullFaces: function () {
      var nbMeshFaces = this.nbFacesState_;
      var fArState = this.fArState_;
      var idFaceState = this.idFaceState_;
      var nbFaces = idFaceState.length;

      var mesh = this.mesh_;
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
  };

  return StateDynamic;
});