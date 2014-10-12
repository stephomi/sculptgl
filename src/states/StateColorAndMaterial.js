define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function StateColorAndMaterial(main, mesh) {
    this.main_ = main; // main application
    this.mesh_ = mesh; // the mesh
    this.idVertState_ = []; // ids of vertices
    this.cArState_ = []; // copies of color vertices
    this.mArState_ = []; // copies of material vertices
  }

  StateColorAndMaterial.prototype = {
    /** On undo */
    undo: function () {
      this.pullState();
      this.mesh_.updateDuplicateColorsAndMaterials();
      this.mesh_.updateFlatShading();
      this.mesh_.updateColorBuffer();
      this.mesh_.updateMaterialBuffer();
      this.main_.setMesh(this.mesh_);
    },
    /** On redo */
    redo: function () {
      this.undo();
    },
    /** Push the redo state */
    createRedo: function () {
      var redo = new StateColorAndMaterial(this.main_, this.mesh_);
      this.pushRedoVertices(redo);
      return redo;
    },
    /** Push vertices */
    pushVertices: function (iVerts) {
      var idVertState = this.idVertState_;
      var cArState = this.cArState_;
      var mArState = this.mArState_;

      var mesh = this.mesh_;
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();
      var vertStateFlags = mesh.getVerticesStateFlags();

      var stateFlag = Utils.STATE_FLAG;
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var id = iVerts[i];
        if (vertStateFlags[id] !== stateFlag) {
          vertStateFlags[id] = stateFlag;
          idVertState.push(id);
          id *= 3;
          cArState.push(cAr[id], cAr[id + 1], cAr[id + 2]);
          mArState.push(mAr[id], mAr[id + 1], mAr[id + 2]);
        }
      }
    },
    /** Push redo vertices */
    pushRedoVertices: function (redoState) {
      var mesh = redoState.mesh_;
      var cAr = mesh.getColors();
      var mAr = mesh.getMaterials();

      var idVertUndoState = this.idVertState_;
      var nbVerts = idVertUndoState.length;

      var cArRedoState = redoState.cArState_;
      var mArRedoState = redoState.mArState_;
      var idVertRedoState = redoState.idVertState_ = new Uint32Array(nbVerts);

      var i = 0;
      for (i = 0; i < nbVerts; ++i)
        idVertRedoState[i] = idVertUndoState[i];

      // fill states arrays
      var nbState = idVertRedoState.length;
      cArRedoState.length = nbState * 3;
      mArRedoState.length = nbState * 3;
      for (i = 0; i < nbState; ++i) {
        var id = idVertRedoState[i] * 3;
        var j = i * 3;
        cArRedoState[j] = cAr[id];
        cArRedoState[j + 1] = cAr[id + 1];
        cArRedoState[j + 2] = cAr[id + 2];
        mArRedoState[j] = mAr[id];
        mArRedoState[j + 1] = mAr[id + 1];
        mArRedoState[j + 2] = mAr[id + 2];
      }
    },
    /** Pull vertices */
    pullState: function () {
      var cArState = this.cArState_;
      var mArState = this.mArState_;
      var idVertState = this.idVertState_;
      var nbVerts = idVertState.length;

      var mesh = this.mesh_;
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
  };

  return StateColorAndMaterial;
});