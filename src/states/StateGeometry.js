define([
  'object/Mesh'
], function (Mesh) {

  'use strict';

  function StateGeometry(mesh) {
    this.mesh_ = mesh; //the mesh
    this.vArState_ = []; //copies of vertices coordinates
    this.idVertState_ = []; // ids of vertices
  }

  StateGeometry.prototype = {
    /** On undo */
    undo: function () {
      this.pullState();
      this.mesh_.updateGeometry();
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      var redo = new StateGeometry(this.mesh_);
      this.pushRedoVertices(redo);
      return redo;
    },
    /** Push vertices */
    pushVertices: function (iVerts) {
      var idVertState = this.idVertState_;
      var vArState = this.vArState_;

      var mesh = this.mesh_;
      var vAr = mesh.verticesXYZ_;
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
        }
      }
    },
    /** Push redo vertices */
    pushRedoVertices: function (redoState) {
      var mesh = redoState.mesh_;
      var vAr = mesh.verticesXYZ_;

      var idVertUndoState = this.idVertState_;
      var nbVerts = idVertUndoState.length;

      var vArRedoState = redoState.vArState_;
      var idVertRedoState = redoState.idVertState_ = new Uint32Array(nbVerts);

      var i = 0;
      for (i = 0; i < nbVerts; ++i)
        idVertRedoState[i] = idVertUndoState[i];

      //fill states arrays
      var nbState = idVertRedoState.length;
      vArRedoState.length = nbState * 3;
      for (i = 0; i < nbState; ++i) {
        var id = idVertRedoState[i] * 3;
        var j = i * 3;
        vArRedoState[j] = vAr[id];
        vArRedoState[j + 1] = vAr[id + 1];
        vArRedoState[j + 2] = vAr[id + 2];
      }
    },
    /** Pull vertices */
    pullState: function () {
      var vArState = this.vArState_;
      var idVertState = this.idVertState_;
      var nbVerts = idVertState.length;

      var mesh = this.mesh_;
      var vAr = mesh.verticesXYZ_;

      for (var i = 0; i < nbVerts; ++i) {
        var id = idVertState[i] * 3;
        var j = i * 3;
        vAr[id] = vArState[j];
        vAr[id + 1] = vArState[j + 1];
        vAr[id + 2] = vArState[j + 2];
      }
    }
  };

  return StateGeometry;
});