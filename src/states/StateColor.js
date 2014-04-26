define([
  'object/Mesh'
], function (Mesh) {

  'use strict';

  function StateColor(mesh) {
    this.mesh_ = mesh; //the mesh
    this.idVertState_ = []; // ids of vertices
    this.cArState_ = []; //copies of color vertices
  }

  StateColor.prototype = {
    /** On undo */
    undo: function () {
      this.pullState();
      this.mesh_.updateResolution();
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      var redo = new StateColor(this.mesh_);
      this.pushRedoVertices(redo);
      return redo;
    },
    /** Push vertices */
    pushVertices: function (iVerts) {
      var idVertState = this.idVertState_;
      var cArState = this.cArState_;

      var mesh = this.mesh_;
      var cAr = mesh.getColors();
      var vertStateFlags = mesh.getVerticesStateFlags();

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
      var cAr = mesh.getColors();

      var idVertUndoState = this.idVertState_;
      var nbVerts = idVertUndoState.length;

      var cArRedoState = redoState.cArState_;
      var idVertRedoState = redoState.idVertState_ = new Uint32Array(nbVerts);

      var i = 0;
      for (i = 0; i < nbVerts; ++i)
        idVertRedoState[i] = idVertUndoState[i];

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
      var cAr = mesh.getColors();

      for (var i = 0; i < nbVerts; ++i) {
        var id = idVertState[i] * 3;
        var j = i * 3;
        cAr[id] = cArState[j];
        cAr[id + 1] = cArState[j + 1];
        cAr[id + 2] = cArState[j + 2];
      }
    }
  };

  return StateColor;
});