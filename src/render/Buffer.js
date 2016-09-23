class Buffer {

  constructor(gl, type, hint) {
    this._gl = gl; // webgl context
    this._buffer = gl.createBuffer(); // the buffer
    this._type = type; // the type (vert data vs index)
    this._hint = hint; //the buffer update hint
    this._size = 0; // the size of the buffer
  }

  bind() {
    this._gl.bindBuffer(this._type, this._buffer);
  }

  release() {
    this._gl.deleteBuffer(this._buffer);
  }

  update(data, nbElts) {
    this._gl.bindBuffer(this._type, this._buffer);

    if (nbElts !== undefined && nbElts !== data.length)
      data = data.subarray(0, nbElts);

    if (data.length > this._size) {
      this._gl.bufferData(this._type, data, this._hint);
      this._size = data.length;
    } else {
      this._gl.bufferSubData(this._type, 0, data);
    }
  }
}

export default Buffer;
