'use strict';

function State()
{
  this.nbTrianglesState_ = 0; //number of triangles
  this.nbVerticesState_ = 0; //number of vertices
  this.vArState_ = []; //copies of vertices coordinates
  this.nArState_ = []; //copies of normal coordinates
  this.cArState_ = []; //copies of color vertices
  this.iArState_ = []; //copies of indices
  this.vState_ = []; //copies of vertex topology
  this.tState_ = []; //copies of triangle topology
  this.aabbState_ = new Aabb(); //root aabb
}

function States()
{
  this.mesh_ = null; //the mesh
  this.undos_ = []; //undo actions
  this.redos_ = []; //redo actions
  this.curUndoIndex_ = 0; //current index in undo
  this.firstState_ = false; //end of undo action
}

States.prototype = {
  /** Start push state */
  start: function ()
  {
    ++Mesh.stateMask_;
    var undos = this.undos_;
    if (this.firstState_) undos.length = 0;
    else if (undos.length > 10)
    {
      undos.shift();
      --this.curUndoIndex_;
    }

    this.firstState_ = false;
    this.redos_.length = 0;
    if (undos.length)
    {
      var index = undos.length - 1;
      while (index !== this.curUndoIndex_)
      {
        undos.pop();
        --index;
      }
    }

    undos.push(new State());
    this.curUndoIndex_ = undos.length - 1;
    var undoCur = undos[this.curUndoIndex_];
    var mesh = this.mesh_;
    undoCur.nbTrianglesState_ = mesh.triangles_.length;
    undoCur.nbVerticesState_ = mesh.vertices_.length;
    undoCur.aabbState_ = mesh.octree_.aabbSplit_.clone();
  },

  /** Push verts and tris */
  pushState: function (iTris, iVerts)
  {
    if (iTris && iTris.length > 0)
      this.pushStateTriangles(iTris);
    if (iVerts && iVerts.length > 0)
      this.pushStateVertices(iVerts);
  },

  /** Push triangles */
  pushStateTriangles: function (iTris)
  {
    var undoCur = this.undos_[this.curUndoIndex_];
    var iArState = undoCur.iArState_;
    var tState = undoCur.tState_;

    var mesh = this.mesh_;
    var iAr = mesh.indexArray_;
    var triangles = mesh.triangles_;

    var meshStateMask = Mesh.stateMask_;
    var nbTris = iTris.length;
    for (var i = 0; i < nbTris; ++i)
    {
      var id = iTris[i];
      var t = triangles[id];
      if (t.stateFlag_ !== meshStateMask)
      {
        t.stateFlag_ = meshStateMask;
        tState.push(t.clone());
        id *= 3;
        iArState.push(iAr[id], iAr[id + 1], iAr[id + 2]);
      }
    }
  },

  /** Push vertices */
  pushStateVertices: function (iVerts)
  {
    var undoCur = this.undos_[this.curUndoIndex_];
    var vArState = undoCur.vArState_;
    var nArState = undoCur.nArState_;
    var cArState = undoCur.cArState_;
    var vState = undoCur.vState_;

    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var cAr = mesh.colorArray_;
    var vertices = mesh.vertices_;

    var meshStateMask = Mesh.stateMask_;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i)
    {
      var id = iVerts[i];
      var v = vertices[id];
      if (v.stateFlag_ !== meshStateMask)
      {
        v.stateFlag_ = meshStateMask;
        vState.push(v.clone());
        id *= 3;
        vArState.push(vAr[id], vAr[id + 1], vAr[id + 2]);
        nArState.push(nAr[id], nAr[id + 1], nAr[id + 2]);
        cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
      }
    }
  },

  /** Undo (also push the redo) */
  undo: function ()
  {
    if (!this.undos_.length || this.firstState_)
      return;

    var redoState = new State();
    var mesh = this.mesh_;
    redoState.nbTrianglesState_ = mesh.triangles_.length;
    redoState.nbVerticesState_ = mesh.vertices_.length;
    redoState.aabbState_ = mesh.octree_.aabbSplit_.clone();

    this.pushRedoTriangles(redoState);
    this.pushRedoVertices(redoState);
    this.pullUndoTriangles();
    this.pullUndoVertices();

    this.mesh_.computeOctree(this.undos_[this.curUndoIndex_].aabbState_);
    mesh.updateBuffers();

    this.redos_.push(redoState);
    if (this.curUndoIndex_)
    {
      this.firstState_ = false;
      --this.curUndoIndex_;
    }
    else
      this.firstState_ = true;
  },

  /** Push redo triangles */
  pushRedoTriangles: function (redoState)
  {
    var mesh = this.mesh_;
    var iAr = mesh.indexArray_;
    var triangles = mesh.triangles_;
    var nbTriangles = triangles.length;

    var undoCur = this.undos_[this.curUndoIndex_];
    var tUndoState = undoCur.tState_;
    var nbTris = tUndoState.length;
    var nbTrianglesState = undoCur.nbTrianglesState_;

    var iArRedoState = redoState.iArState_;
    var tRedoState = redoState.tState_;

    var i = 0,
      id = 0;
    if (nbTrianglesState < nbTriangles)
    {
      for (i = nbTrianglesState; i < nbTriangles; ++i)
        tRedoState.push(triangles[i].clone());
      for (i = 0; i < nbTris; ++i)
      {
        id = tUndoState[i].id_;
        if (id < nbTrianglesState)
          tRedoState.push(triangles[id].clone());
      }
      triangles.length = nbTrianglesState;
    }
    else
    {
      triangles.length = nbTrianglesState;
      for (i = 0; i < nbTris; ++i)
      {
        id = tUndoState[i].id_;
        if (id < nbTriangles)
          tRedoState.push(triangles[id].clone());
      }
    }

    //fill states arrays
    var nbState = tRedoState.length;
    iArRedoState.length = nbState * 3;
    var j = 0;
    for (i = 0; i < nbState; ++i)
    {
      id = tRedoState[i].id_ * 3;
      j = i * 3;
      iArRedoState[j] = iAr[id];
      iArRedoState[j + 1] = iAr[id + 1];
      iArRedoState[j + 2] = iAr[id + 2];
    }
  },

  /** Push redo vertices */
  pushRedoVertices: function (redoState)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var cAr = mesh.colorArray_;
    var vertices = mesh.vertices_;

    var nbVertices = vertices.length;

    var undoCur = this.undos_[this.curUndoIndex_];
    var vUndoState = undoCur.vState_;
    var nbVerts = vUndoState.length;
    var nbVerticesState = undoCur.nbVerticesState_;

    var vArRedoState = redoState.vArState_;
    var nArRedoState = redoState.nArState_;
    var cArRedoState = redoState.cArState_;
    var vRedoState = redoState.vState_;

    var i = 0,
      id = 0;
    if (nbVerticesState < nbVertices)
    {
      for (i = nbVerticesState; i < nbVertices; ++i)
        vRedoState.push(vertices[i].clone());
      for (i = 0; i < nbVerts; ++i)
      {
        id = vUndoState[i].id_;
        if (id < nbVerticesState)
          vRedoState.push(vertices[id].clone());
      }
      vertices.length = nbVerticesState;
    }
    else
    {
      vertices.length = nbVerticesState;
      for (i = 0; i < nbVerts; ++i)
      {
        id = vUndoState[i].id_;
        if (id < nbVertices)
          vRedoState.push(vertices[id].clone());
      }
    }

    //fill states arrays
    var nbState = vRedoState.length;
    vArRedoState.length = nbState * 3;
    nArRedoState.length = nbState * 3;
    cArRedoState.length = nbState * 3;
    var j = 0;
    for (i = 0; i < nbState; ++i)
    {
      id = vRedoState[i].id_ * 3;
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
  pullUndoTriangles: function ()
  {
    var undoCur = this.undos_[this.curUndoIndex_];
    var mesh = this.mesh_;
    var iAr = mesh.indexArray_;
    var triangles = mesh.triangles_;

    var tUndoState = undoCur.tState_;
    var iArUndoState = undoCur.iArState_;
    var nbTrianglesState = undoCur.nbTrianglesState_;

    var nbTris = tUndoState.length;
    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbTris; ++i)
    {
      var t = tUndoState[i];
      if (t.id_ < nbTrianglesState)
      {
        id = t.id_;
        triangles[id] = t.clone();
        id *= 3;
        j = i * 3;
        iAr[id] = iArUndoState[j];
        iAr[id + 1] = iArUndoState[j + 1];
        iAr[id + 2] = iArUndoState[j + 2];
      }
    }
  },

  /** Pull undo vertices */
  pullUndoVertices: function ()
  {
    var undoCur = this.undos_[this.curUndoIndex_];
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var cAr = mesh.colorArray_;
    var vertices = mesh.vertices_;

    var vUndoState = undoCur.vState_;
    var vArUndoState = undoCur.vArState_;
    var nArUndoState = undoCur.nArState_;
    var cArUndoState = undoCur.cArState_;
    var nbVerticesState = undoCur.nbVerticesState_;

    var nbVerts = vUndoState.length;
    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbVerts; ++i)
    {
      var v = vUndoState[i];
      if (v.id_ < nbVerticesState)
      {
        id = v.id_;
        vertices[id] = v.clone();
        id *= 3;
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
    }
  },

  /** Redo */
  redo: function ()
  {
    if (!this.redos_.length)
      return;

    var redoCur = this.redos_[this.redos_.length - 1];
    var mesh = this.mesh_;
    mesh.triangles_.length = redoCur.nbTrianglesState_;
    mesh.vertices_.length = redoCur.nbVerticesState_;

    this.pullRedoTriangles();
    this.pullRedoVertices();

    this.mesh_.computeOctree(redoCur.aabbState_);
    mesh.updateBuffers();

    if (!this.firstState_) this.curUndoIndex_++;
    else this.firstState_ = false;
    this.redos_.pop();
  },

  /** Pull redo triangles */
  pullRedoTriangles: function ()
  {
    var redoCur = this.redos_[this.redos_.length - 1];

    var iArRedoState = redoCur.iArState_;
    var tRedoState = redoCur.tState_;
    var nbTris = tRedoState.length;

    var mesh = this.mesh_;
    var iAr = mesh.indexArray_;
    var triangles = mesh.triangles_;

    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbTris; ++i)
    {
      var t = tRedoState[i];
      id = t.id_;
      triangles[id] = t.clone();
      id *= 3;
      j = i * 3;
      iAr[id] = iArRedoState[j];
      iAr[id + 1] = iArRedoState[j + 1];
      iAr[id + 2] = iArRedoState[j + 2];
    }

  },

  /** Pull redo vertices */
  pullRedoVertices: function ()
  {
    var redoCur = this.redos_[this.redos_.length - 1];

    var vArRedoState = redoCur.vArState_;
    var nArRedoState = redoCur.nArState_;
    var cArRedoState = redoCur.cArState_;
    var vRedoState = redoCur.vState_;
    var nbVerts = vRedoState.length;

    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var cAr = mesh.colorArray_;
    var vertices = mesh.vertices_;

    var i = 0,
      j = 0,
      id = 0;
    for (i = 0; i < nbVerts; ++i)
    {
      var v = vRedoState[i];
      id = v.id_;
      vertices[id] = v.clone();
      id *= 3;
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
  reset: function ()
  {
    this.mesh_ = null;
    this.undos_ = [];
    this.redos_ = [];
    this.curUndoIndex_ = 0;
    this.firstState_ = false;
  }
};