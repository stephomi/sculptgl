/*global
Mesh:false
*/
'use strict';

function StateColor(multimesh) {
  this.multimesh_ = multimesh; //the multires mesh
  this.mesh_ = multimesh.getCurrent(); //the sub multimesh
  this.idVertState_ = []; // ids of vertices

  this.cArState_ = []; //copies of color vertices
  this.vpfArState_ = []; //copies of vertex paint flags (pain in the ass colors...)
}

StateColor.prototype = {
  /** On undo */
  undo: function () {
    this.pullState();
  },
  /** Push the redo state */
  createRedo: function () {
    var redo = new StateColor(this.multimesh_);
    this.pushRedoVertices(redo);
    return redo;
  },
  /** Push vertices */
  pushVertices: function (iVerts) {
    var idVertState = this.idVertState_;
    var cArState = this.cArState_;

    var mesh = this.mesh_;
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
        cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
      }
    }
  },
  /** Push redo vertices */
  pushRedoVertices: function (redoState) {
    var mesh = redoState.mesh_;
    var cAr = mesh.colorsRGB_;

    var idVertUndoState = this.idVertState_;
    var nbVerts = idVertUndoState.length;

    var cArRedoState = redoState.cArState_;
    var idVertRedoState = redoState.idVertState_;

    var i = 0;
    for (i = 0; i < nbVerts; ++i)
      idVertRedoState.push(idVertUndoState[i]);

    //fill states arrays
    var nbState = idVertRedoState.length;
    cArRedoState.length = nbState * 3;
    for (i = 0; i < nbState; ++i) {
      var id = idVertRedoState[i] * 3;
      var j = i * 3;
      cArRedoState[j] = cAr[id];
      cArRedoState[j + 1] = cAr[id + 1];
      cArRedoState[j + 2] = cAr[id + 2];
    }
  },
  /** Pull vertices */
  pullState: function () {
    var cArState = this.cArState_;
    var idVertState = this.idVertState_;
    var nbVerts = idVertState.length;

    var mesh = this.mesh_;
    var cAr = mesh.colorsRGB_;
    var vpfAr = mesh.vertPaintFlags_;
    var sculptFlag = ++Mesh.SCULPT_FLAG;

    for (var i = 0; i < nbVerts; ++i) {
      var id = idVertState[i] * 3;
      var j = i * 3;
      cAr[id] = cArState[j];
      cAr[id + 1] = cArState[j + 1];
      cAr[id + 2] = cArState[j + 2];
      vpfAr[id / 3] = sculptFlag;
    }
  }
};