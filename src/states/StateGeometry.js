define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;

  var StateGeometry = function (main, mesh) {
    this.main_ = main; // main application
    this.mesh_ = mesh; // the mesh
    this.center_ = vec3.copy([0.0, 0.0, 0.0], mesh.getCenter());

    this.idVertState_ = []; // ids of vertices
    this.vArState_ = []; // copies of vertices coordinates
  };

  StateGeometry.prototype = {
    /** On undo */
    undo: function (skipUpdate) {
      this.pullVertices();
      if (skipUpdate) return;
      var mesh = this.mesh_;
      mesh.updateGeometry(mesh.getFacesFromVertices(this.idVertState_), this.idVertState_);
      mesh.updateGeometryBuffers();
      vec3.copy(mesh.getCenter(), this.center_);
      this.main_.setMesh(mesh);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      var redo = new StateGeometry(this.main_, this.mesh_);
      this.pushRedoVertices(redo);
      return redo;
    },
    /** Push vertices */
    pushVertices: function (iVerts) {
      var idVertState = this.idVertState_;
      var vArState = this.vArState_;

      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
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
        vArState.push(vAr[id], vAr[id + 1], vAr[id + 2]);
      }
    },
    /** Push redo vertices */
    pushRedoVertices: function (redoState) {
      var mesh = redoState.mesh_;
      var vAr = mesh.getVertices();

      var idVertUndoState = this.idVertState_;
      var nbVerts = idVertUndoState.length;

      var vArRedoState = redoState.vArState_ = new Float32Array(nbVerts * 3);
      var idVertRedoState = redoState.idVertState_ = new Uint32Array(nbVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var id = idVertRedoState[i] = idVertUndoState[i];
        id *= 3;
        var j = i * 3;
        vArRedoState[j] = vAr[id];
        vArRedoState[j + 1] = vAr[id + 1];
        vArRedoState[j + 2] = vAr[id + 2];
      }
    },
    /** Pull vertices */
    pullVertices: function () {
      var vArState = this.vArState_;
      var idVertState = this.idVertState_;
      var nbVerts = idVertState.length;

      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
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