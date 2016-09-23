class StateCustom {

  constructor(undocb, redocb) {
    this._undocb = undocb;
    this._redocb = redocb ? redocb : undocb;
  }

  isNoop() {
    return !this._undocb;
  }

  undo() {
    this._undocb();
  }

  redo() {
    this._redocb();
  }

  createRedo() {
    return new StateCustom(this._undocb, this._redocb);
  }
}

export default StateCustom;
