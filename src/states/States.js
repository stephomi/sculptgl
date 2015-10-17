define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var StAddRemove = require('states/StateAddRemove');
  var StColorAndMaterial = require('states/StateColorAndMaterial');
  var StGeometry = require('states/StateGeometry');
  var StDynamic = require('states/StateDynamic');
  var StMultiresolution = require('states/StateMultiresolution');
  var StCustom = require('states/StateCustom');

  var States = function (main) {
    this._main = main; // main
    this._undos = []; // undo actions
    this._redos = []; // redo actions
    this._curUndoIndex = -1; // current index in undo
  };

  States.STACK_LENGTH = 15;

  States.prototype = {
    pushStateCustom: function (undocb, redocb, squash) {
      var st = new StCustom(undocb, redocb);
      st.squash = squash;
      this.pushState(st);
    },
    pushStateAddRemove: function (addMesh, remMesh, squash) {
      var st = new StAddRemove(this._main, addMesh, remMesh);
      st.squash = squash;
      this.pushState(st);
    },
    pushStateRemove: function (remMesh) {
      this.pushState(new StAddRemove(this._main, [], remMesh));
    },
    pushStateAdd: function (addMesh) {
      this.pushState(new StAddRemove(this._main, addMesh, []));
    },
    pushStateColorAndMaterial: function (mesh) {
      if (mesh.getDynamicTopology)
        this.pushState(new StDynamic(this._main, mesh));
      else
        this.pushState(new StColorAndMaterial(this._main, mesh));
    },
    pushStateGeometry: function (mesh) {
      if (mesh.getDynamicTopology)
        this.pushState(new StDynamic(this._main, mesh));
      else
        this.pushState(new StGeometry(this._main, mesh));
    },
    pushStateMultiresolution: function (multimesh, type) {
      this.pushState(new StMultiresolution(this._main, multimesh, type));
    },
    setNewMaxStack: function (maxStack) {
      States.STACK_LENGTH = maxStack;
      var undos = this._undos;
      var redos = this._redos;
      while (this._curUndoIndex >= maxStack) {
        undos.shift();
        --this._curUndoIndex;
      }
      while (undos.length > maxStack) {
        undos.pop();
        redos.shift();
      }
    },
    pushState: function (state) {
      ++Utils.STATE_FLAG;
      var undos = this._undos;
      if (this._curUndoIndex === -1) undos.length = 0;
      else if (undos.length >= States.STACK_LENGTH) {
        undos.shift();
        --this._curUndoIndex;
      }
      this._redos.length = 0;
      ++this._curUndoIndex;
      if (undos.length > 0)
        undos.length = this._curUndoIndex;
      undos.push(state);
    },
    getCurrentState: function () {
      return this._undos[this._curUndoIndex];
    },
    pushVertices: function (iVerts) {
      if (iVerts && iVerts.length > 0)
        this.getCurrentState().pushVertices(iVerts);
    },
    pushFaces: function (iFaces) {
      if (iFaces && iFaces.length > 0)
        this.getCurrentState().pushFaces(iFaces);
    },
    undo: function () {
      if (!this._undos.length || this._curUndoIndex < 0)
        return;

      var state = this.getCurrentState();
      var redoState = state.createRedo();
      redoState.squash = state.squash;
      this._redos.push(redoState);
      state.undo();

      this._curUndoIndex--;
      if (state.squash === true)
        this.undo();
    },
    redo: function () {
      if (!this._redos.length)
        return;

      var state = this._redos[this._redos.length - 1];
      state.redo();
      this._curUndoIndex++;
      this._redos.pop();
      if (state.squash === true)
        this.redo();
    },
    reset: function () {
      this._undos.length = 0;
      this._redos.length = 0;
      this._curUndoIndex = -1;
    },
    cleanNoop: function () {
      while (this._curUndoIndex >= 0 && this.getCurrentState().isNoop()) {
        this._undos.length--;
        this._curUndoIndex--;
        this._redos.length = 0;
      }
    },
  };

  module.exports = States;
});