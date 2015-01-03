define([
  'misc/Utils',
  'states/StateAddRemove',
  'states/StateColorAndMaterial',
  'states/StateGeometry',
  'states/StateDynamic',
  'states/StateMultiresolution',
  'states/StateTransform',
  'states/StateCustom'
], function (Utils, StAddRemove, StColorAndMaterial, StGeometry, StDynamic, StMultiresolution, StTransform, StCustom) {

  'use strict';

  function States(main) {
    this.main_ = main; // main
    this.undos_ = []; // undo actions
    this.redos_ = []; // redo actions
    this.curUndoIndex_ = -1; // current index in undo
  }

  States.STACK_LENGTH = 15;

  States.prototype = {
    pushStateCustom: function (undocb, redocb) {
      this.pushState(new StCustom(undocb, redocb));
    },
    pushStateAddRemove: function (addMesh, remMesh, silent) {
      var st = new StAddRemove(this.main_, addMesh, remMesh);
      st.silent = silent;
      this.pushState(st);
    },
    pushStateRemove: function (remMesh) {
      this.pushState(new StAddRemove(this.main_, [], remMesh));
    },
    pushStateAdd: function (addMesh) {
      this.pushState(new StAddRemove(this.main_, addMesh, []));
    },
    pushStateColorAndMaterial: function (mesh) {
      if (mesh.getDynamicTopology)
        this.pushState(new StDynamic(this.main_, mesh));
      else
        this.pushState(new StColorAndMaterial(this.main_, mesh));
    },
    pushStateGeometry: function (mesh) {
      if (mesh.getDynamicTopology)
        this.pushState(new StDynamic(this.main_, mesh));
      else
        this.pushState(new StGeometry(this.main_, mesh));
    },
    pushStateMultiresolution: function (multimesh, type) {
      this.pushState(new StMultiresolution(this.main_, multimesh, type));
    },
    pushStateTransform: function (mesh) {
      this.pushState(new StTransform(this.main_, mesh));
    },
    setNewMaxStack: function (maxStack) {
      States.STACK_LENGTH = maxStack;
      var undos = this.undos_;
      var redos = this.redos_;
      while (this.curUndoIndex_ >= maxStack) {
        undos.shift();
        --this.curUndoIndex_;
      }
      while (undos.length > maxStack) {
        undos.pop();
        redos.shift();
      }
    },
    /** Start push state */
    pushState: function (state) {
      ++Utils.STATE_FLAG;
      var undos = this.undos_;
      if (this.curUndoIndex_ === -1) undos.length = 0;
      else if (undos.length >= States.STACK_LENGTH) {
        undos.shift();
        --this.curUndoIndex_;
      }
      this.redos_.length = 0;
      ++this.curUndoIndex_;
      if (undos.length > 0)
        undos.length = this.curUndoIndex_;
      undos.push(state);
    },
    getCurrentState: function () {
      return this.undos_[this.curUndoIndex_];
    },
    /** Push verts */
    pushVertices: function (iVerts) {
      if (iVerts && iVerts.length > 0)
        this.getCurrentState().pushVertices(iVerts);
    },
    /** Push tris */
    pushFaces: function (iFaces) {
      if (iFaces && iFaces.length > 0)
        this.getCurrentState().pushFaces(iFaces);
    },
    /** Undo (also push the redo) */
    undo: function () {
      if (!this.undos_.length || this.curUndoIndex_ < 0)
        return;
      if (!this.main_.isReplayed())
        this.main_.getReplayWriter().pushAction('UNDO');

      var state = this.getCurrentState();
      var redoState = state.createRedo();
      redoState.silent = state.silent;
      this.redos_.push(redoState);
      state.undo();

      this.curUndoIndex_--;
      if (state.silent === true)
        this.undo();
    },
    /** Redo */
    redo: function () {
      if (!this.redos_.length)
        return;
      if (!this.main_.isReplayed())
        this.main_.getReplayWriter().pushAction('REDO');

      var state = this.redos_[this.redos_.length - 1];
      state.redo();
      this.curUndoIndex_++;
      this.redos_.pop();
      if (state.silent === true)
        this.redo();
    },
    /** Reset */
    reset: function () {
      this.undos_.length = 0;
      this.redos_.length = 0;
      this.curUndoIndex_ = -1;
    }
  };

  return States;
});