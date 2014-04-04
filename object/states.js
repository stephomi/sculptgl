/*global
Mesh:false,
StateGeometry:false,
StateColor:false,
StateResolution:false
*/
'use strict';

function States() {
  this.undos_ = []; //undo actions
  this.redos_ = []; //redo actions
  this.curUndoIndex_ = 0; //current index in undo
  this.firstState_ = false; //end of undo action
}

States.STATE_GEOMETRY = 0;
States.STATE_COLOR = 1;
States.STATE_RESOLUTION = 2;

States.STACK_LENGTH = 10;

States.prototype = {
  /** Start push state */
  start: function (multimesh, flag) {
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

    var undo = this.createState(multimesh, flag);
    this.curUndoIndex_ = undos.length;
    undos.push(undo);
  },
  createState: function (multimesh, flag) {
    if (flag === States.STATE_GEOMETRY)
      return new StateGeometry(multimesh);
    else if (flag === States.STATE_COLOR)
      return new StateColor(multimesh);
    else
      return new StateResolution(multimesh);
  },
  /** Push verts and tris */
  pushVertices: function (iVerts) {
    if (iVerts && iVerts.length > 0)
      this.undos_[this.curUndoIndex_].pushVertices(iVerts);
  },
  /** Undo (also push the redo) */
  undo: function () {
    if (!this.undos_.length || this.firstState_)
      return;

    var state = this.undos_[this.curUndoIndex_];
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

    this.redos_[this.redos_.length - 1].undo();

    if (!this.firstState_) this.curUndoIndex_++;
    else this.firstState_ = false;
    this.redos_.pop();
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