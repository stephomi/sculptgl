define([
  'object/Mesh'
], function (Mesh) {

  'use strict';

  function States() {
    this.undos_ = []; //undo actions
    this.redos_ = []; //redo actions
    this.curUndoIndex_ = 0; //current index in undo
    this.firstState_ = false; //end of undo action
  }

  States.STACK_LENGTH = 10;

  States.prototype = {
    /** Start push state */
    pushState: function (state) {
      ++Mesh.STATE_FLAG;
      var undos = this.undos_;
      if (this.firstState_) undos.length = 0;
      else if (undos.length > States.STACK_LENGTH) {
        undos.shift();
        --this.curUndoIndex_;
      }

      this.firstState_ = false;
      this.redos_.length = 0;
      if (undos.length > 0) {
        var index = undos.length - 1;
        while (index !== this.curUndoIndex_) {
          undos.pop();
          --index;
        }
      }

      this.curUndoIndex_ = undos.length;
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
      if (!this.undos_.length || this.firstState_)
        return;

      var state = this.getCurrentState();
      this.redos_.push(state.createRedo());
      state.undo();

      if (this.curUndoIndex_) {
        this.firstState_ = false;
        --this.curUndoIndex_;
      } else
        this.firstState_ = true;
    },
    /** Redo */
    redo: function () {
      if (!this.redos_.length)
        return;

      this.redos_[this.redos_.length - 1].redo();

      if (!this.firstState_) this.curUndoIndex_++;
      else this.firstState_ = false;
      this.redos_.pop();
    },
    /** Reset */
    reset: function () {
      this.undos_ = [];
      this.redos_ = [];
      this.curUndoIndex_ = 0;
      this.firstState_ = false;
    }
  };

  return States;
});