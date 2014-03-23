'use strict';

function State() {
  this.mesh_ = null; //the mesh
  this.vArState_ = []; //copies of vertices coordinates
  this.nArState_ = []; //copies of normal coordinates
  this.cArState_ = []; //copies of color vertices
  this.iArState_ = []; //copies of indices
  this.idTriState_ = []; // ids of triangles
  this.idVertState_ = []; // ids of vertices
  this.aabbState_ = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; //root aabb
}

function States() {
  this.multimesh_ = null; //the multires mesh
  this.undos_ = []; //undo actions
  this.redos_ = []; //redo actions
  this.curUndoIndex_ = 0; //current index in undo
  this.firstState_ = false; //end of undo action
}

States.prototype = {
  /** Start push state */
  start: function () {
    ++Mesh.STATE_FLAG;
    var undos = this.undos_;
    if (this.firstState_) undos.length = 0;
    else if (undos.length > 10) {
      undos.shift();
      --this.curUndoIndex_;
    }

    this.firstState_ = false;
    this.redos_.length = 0;
    if (undos.length) {
      var index = undos.length - 1;
      while (index !== this.curUndoIndex_) {
        undos.pop();
        --index;
      }
    }

    undos.push(new State());
    this.curUndoIndex_ = undos.length - 1;
    var undoCur = undos[this.curUndoIndex_];
    undoCur.mesh_ = this.multimesh_.getCurrent();
    var ab = undoCur.mesh_.octree_.aabbSplit_;
    undoCur.aabbState_ = [ab[0], ab[1], ab[2], ab[3], ab[4], ab[5]];
  },
  /** Push verts and tris */
  pushState: function (iTris, iVerts) {
    if (iTris && iTris.length > 0)
      this.pushStateTriangles(iTris);
    if (iVerts && iVerts.length > 0)
      this.pushStateVertices(iVerts);
  },
  /** Push triangles */
  pushStateTriangles: function (iTris) {
    var undoCur = this.undos_[this.curUndoIndex_];
    var iArState = undoCur.iArState_;
    var idTriUndoState = undoCur.idTriState_;

    var mesh = undoCur.mesh_;
    var iAr = mesh.indicesABC_;
    var triStateFlags = mesh.triStateFlags_;

    var stateFlag = Mesh.STATE_FLAG;
    var nbTris = iTris.length;
    for (var i = 0; i < nbTris; ++i) {
      var id = iTris[i];
      if (triStateFlags[id] !== stateFlag) {
        triStateFlags[id] = stateFlag;
        idTriUndoState.push(id);
        id *= 3;
        iArState.push(iAr[id], iAr[id + 1], iAr[id + 2]);
      }
    }
  },
  /** Push vertices */
  pushStateVertices: function (iVerts) {
    var undoCur = this.undos_[this.curUndoIndex_];
    var vArState = undoCur.vArState_;
    var nArState = undoCur.nArState_;
    var cArState = undoCur.cArState_;
    var idVertState = undoCur.idVertState_;

    var mesh = undoCur.mesh_;
    var vAr = mesh.verticesXYZ_;
    var nAr = mesh.normalsXYZ_;
    var cAr = mesh.colorsRGB_;
    var vertStateFlags = mesh.vertStateFlags_;

    var stateFlag = Mesh.STATE_FLAG;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i) {
      var id = iVerts[i];
      if (vertStateFlags[id] !== stateFlag) {
        vertStateFlags[id] = stateFlag;
        idVertState.push(id);
        id *= 3;
        vArState.push(vAr[id], vAr[id + 1], vAr[id + 2]);
        nArState.push(nAr[id], nAr[id + 1], nAr[id + 2]);
        cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
      }
    }
  },
  /** Undo (also push the redo) */
  undo: function () {
    if (!this.undos_.length || this.firstState_)
      return;
    var curMesh = this.undos_[this.curUndoIndex_].mesh_;
    // TODO : smarter undo (go to lower/higher level ?)
    if (curMesh !== this.multimesh_.getCurrent())
      return;

    var redoState = new State();
    redoState.mesh_ = curMesh;
    var ab = curMesh.octree_.aabbSplit_;
    redoState.aabbState_ = [ab[0], ab[1], ab[2], ab[3], ab[4], ab[5]];

    this.pushRedoTriangles(redoState);
    this.pushRedoVertices(redoState);
    this.pullUndoTriangles();
    this.pullUndoVertices();

    curMesh.updateTrianglesAabbAndNormal();
    curMesh.computeOctree(this.undos_[this.curUndoIndex_].aabbState_);

    this.redos_.push(redoState);
    if (this.curUndoIndex_) {
      this.firstState_ = false;
      --this.curUndoIndex_;
    } else
      this.firstState_ = true;
  },
  /** Push redo triangles */
  pushRedoTriangles: function (redoState) {
    var mesh = redoState.mesh_;
    var iAr = mesh.indicesABC_;

    var undoCur = this.undos_[this.curUndoIndex_];
    var idTriUndoState = undoCur.idTriState_;
    var nbTris = idTriUndoState.length;

    var iArRedoState = redoState.iArState_;
    var idTriRedoState = redoState.idTriState_;

    var i = 0,
      id = 0;
    for (i = 0; i < nbTris; ++i)
      idTriRedoState.push(idTriUndoState[i]);

    //fill states arrays
    var nbState = idTriRedoState.length;
    iArRedoState.length = nbState * 3;
    var j = 0;
    for (i = 0; i < nbState; ++i) {
      id = idTriRedoState[i] * 3;
      j = i * 3;
      iArRedoState[j] = iAr[id];
      iArRedoState[j + 1] = iAr[id + 1];
      iArRedoState[j + 2] = iAr[id + 2];
    }
  },
  /** Push redo vertices */
  pushRedoVertices: function (redoState) {
    var mesh = redoState.mesh_;
    var vAr = mesh.verticesXYZ_;
    var nAr = mesh.normalsXYZ_;
    var cAr = mesh.colorsRGB_;

    var undoCur = this.undos_[this.curUndoIndex_];
    var idVertUndoState = undoCur.idVertState_;
    var nbVerts = idVertUndoState.length;

    var vArRedoState = redoState.vArState_;
    var nArRedoState = redoState.nArState_;
    var cArRedoState = redoState.cArState_;
    var idVertRedoState = redoState.idVertState_;

    var i = 0,
      id = 0;

    for (i = 0; i < nbVerts; ++i)
      idVertRedoState.push(idVertUndoState[i]);

    //fill states arrays
    var nbState = idVertRedoState.length;
    vArRedoState.length = nbState * 3;
    nArRedoState.length = nbState * 3;
    cArRedoState.length = nbState * 3;
    var j = 0;
    for (i = 0; i < nbState; ++i) {
      id = idVertRedoState[i] * 3;
      j = i * 3;
      vArRedoState[j] = vAr[id];
      vArRedoState[j + 1] = vAr[id + 1];
      vArRedoState[j + 2] = vAr[id + 2];
      nArRedoState[j] = nAr[id];
      nArRedoState[j + 1] = nAr[id + 1];
      nArRedoState[j + 2] = nAr[id + 2];
      cArRedoState[j] = cAr[id];
      cArRedoState[j + 1] = cAr[id + 1];
      cArRedoState[j + 2] = cAr[id + 2];
    }
  },
  /** Pull undo triangles */
  pullUndoTriangles: function () {
    var undoCur = this.undos_[this.curUndoIndex_];
    var mesh = undoCur.mesh_;
    var iAr = mesh.indicesABC_;

    var idTriUndoState = undoCur.idTriState_;
    var iArUndoState = undoCur.iArState_;

    var nbTris = idTriUndoState.length;
    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbTris; ++i) {
      id = idTriUndoState[i] * 3;
      j = i * 3;
      iAr[id] = iArUndoState[j];
      iAr[id + 1] = iArUndoState[j + 1];
      iAr[id + 2] = iArUndoState[j + 2];
    }
  },
  /** Pull undo vertices */
  pullUndoVertices: function () {
    var undoCur = this.undos_[this.curUndoIndex_];
    var mesh = undoCur.mesh_;
    var vAr = mesh.verticesXYZ_;
    var nAr = mesh.normalsXYZ_;
    var cAr = mesh.colorsRGB_;

    var vArUndoState = undoCur.vArState_;
    var nArUndoState = undoCur.nArState_;
    var cArUndoState = undoCur.cArState_;
    var idVertUndoState = undoCur.idVertState_;

    var nbVerts = idVertUndoState.length;
    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbVerts; ++i) {
      id = idVertUndoState[i] * 3;
      j = i * 3;
      vAr[id] = vArUndoState[j];
      vAr[id + 1] = vArUndoState[j + 1];
      vAr[id + 2] = vArUndoState[j + 2];
      nAr[id] = nArUndoState[j];
      nAr[id + 1] = nArUndoState[j + 1];
      nAr[id + 2] = nArUndoState[j + 2];
      cAr[id] = cArUndoState[j];
      cAr[id + 1] = cArUndoState[j + 1];
      cAr[id + 2] = cArUndoState[j + 2];
    }
  },
  /** Redo */
  redo: function () {
    if (!this.redos_.length)
      return;

    var redoCur = this.redos_[this.redos_.length - 1];
    // TODO smarter multires redo...
    if (redoCur.mesh_ !== this.multimesh_.getCurrent())
      return;

    this.pullRedoTriangles();
    this.pullRedoVertices();

    curMesh.updateTrianglesAabbAndNormal();
    redoCur.mesh_.computeOctree(redoCur.aabbState_);

    if (!this.firstState_) this.curUndoIndex_++;
    else this.firstState_ = false;
    this.redos_.pop();
  },

  /** Pull redo triangles */
  pullRedoTriangles: function () {
    var redoCur = this.redos_[this.redos_.length - 1];

    var iArRedoState = redoCur.iArState_;
    var idTriRedoState = redoCur.idTriState_;
    var nbTris = idTriRedoState.length;

    var mesh = redoCur.mesh_;
    var iAr = mesh.indicesABC_;

    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbTris; ++i) {
      id = idTriRedoState[i] * 3;
      j = i * 3;
      iAr[id] = iArRedoState[j];
      iAr[id + 1] = iArRedoState[j + 1];
      iAr[id + 2] = iArRedoState[j + 2];
    }

  },
  /** Pull redo vertices */
  pullRedoVertices: function () {
    var redoCur = this.redos_[this.redos_.length - 1];

    var vArRedoState = redoCur.vArState_;
    var nArRedoState = redoCur.nArState_;
    var cArRedoState = redoCur.cArState_;
    var idVertRedoState = redoCur.idVertState_;
    var nbVerts = idVertRedoState.length;

    var mesh = redoCur.mesh_;
    var vAr = mesh.verticesXYZ_;
    var nAr = mesh.normalsXYZ_;
    var cAr = mesh.colorsRGB_;

    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbVerts; ++i) {
      id = idVertRedoState[i] * 3;
      j = i * 3;
      vAr[id] = vArRedoState[j];
      vAr[id + 1] = vArRedoState[j + 1];
      vAr[id + 2] = vArRedoState[j + 2];
      nAr[id] = nArRedoState[j];
      nAr[id + 1] = nArRedoState[j + 1];
      nAr[id + 2] = nArRedoState[j + 2];
      cAr[id] = cArRedoState[j];
      cAr[id + 1] = cArRedoState[j + 1];
      cAr[id + 2] = cArRedoState[j + 2];
    }
  },
  /** Reset */
  reset: function () {
    this.multimesh_ = null;
    this.undos_ = [];
    this.redos_ = [];
    this.curUndoIndex_ = 0;
    this.firstState_ = false;
  }
};