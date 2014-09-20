define([
  'misc/Utils',
  'states/StateAddRemove',
  'states/StateColor',
  'states/StateGeometry',
  'states/StateMultiresolution',
  'states/StateTransform'
], function (Utils, StAddRemove, StColor, StGeometry, StMultiresolution, StTransform) {

  'use strict';

  function States(main) {
    this.main_ = main; // main
    this.undos_ = []; // undo actions
    this.redos_ = []; // redo actions
    this.curUndoIndex_ = -1; // current index in undo
  }

  States.STACK_LENGTH = 15;

  States.prototype = {
    pushStateAddRemove: function (addMesh, remMesh) {
      this.pushState(new StAddRemove(this.main_, addMesh, remMesh));
    },
    pushStateRemove: function (remMesh) {
      this.pushState(new StAddRemove(this.main_, [], remMesh));
    },
    pushStateAdd: function (addMesh) {
      this.pushState(new StAddRemove(this.main_, addMesh, []));
    },
    pushStateColor: function (mesh) {
      this.pushState(new StColor(this.main_, mesh));
    },
    pushStateGeometry: function (mesh) {
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
        undos.length--;
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
    /** Push verts and tris */
    pushVertices: function (iVerts) {
      if (iVerts && iVerts.length > 0)
        this.getCurrentState().pushVertices(iVerts);
    },
    /** Undo (also push the redo) */
    undo: function () {
      if (!this.undos_.length || this.curUndoIndex_ < 0)
        return;

      var state = this.getCurrentState();
      this.redos_.push(state.createRedo());
      state.undo();

      this.curUndoIndex_--;
    },
    /** Redo */
    redo: function () {
      if (!this.redos_.length)
        return;
      this.redos_[this.redos_.length - 1].redo();
      this.curUndoIndex_++;
      this.redos_.pop();
    },
    /** Reset */
    reset: function () {
      this.undos_ = [];
      this.redos_ = [];
      this.curUndoIndex_ = -1;
    }
  };

  return States;
});