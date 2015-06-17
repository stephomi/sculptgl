define([], function () {

  'use strict';

  // Not sure I should put theses functions here...
  // polyfills
  if (!window.Map) {
    window.Map = function () {
      this.map = {};
    };
    window.Map.prototype = {
      set: function (key, value) {
        this.map[key] = value;
      },
      get: function (key) {
        return this.map[key];
      }
    };
  }

  /** endsWith function */
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (str) {
      return this.slice(-str.length) === str;
    };
  }

  /** startsWith function */
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str) {
      return this.slice(0, str.length) === str;
    };
  }

  (function () {
    var vendors = ['moz', 'webkit'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
      window.alert('browser is too old. Probably no webgl there anyway');
  }());

  var Utils = {};

  Utils.SCALE = 100.0; // scale factor
  Utils.TAG_FLAG = 1; // flag value for comparison (always >= tags values)
  Utils.SCULPT_FLAG = 1; // flag value for sculpt (always >= tags values)
  Utils.STATE_FLAG = 1; // flag value for states (always >= tags values)

  Utils.makeProxy = function (source, proxy, wrapFunc) {
    var sourceProto = source.prototype;
    var proxyProto = proxy.prototype;
    var protos = Object.keys(sourceProto);
    for (var i = 0, l = protos.length; i < l; ++i) {
      var proto = protos[i];
      if (!proxyProto[proto])
        proxyProto[proto] = wrapFunc ? wrapFunc(sourceProto[proto]) : sourceProto[proto];
    }
  };

  Utils.littleEndian = (function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  Utils.replaceElement = function (array, oldValue, newValue) {
    for (var i = 0, l = array.length; i < l; ++i) {
      if (array[i] === oldValue) {
        array[i] = newValue;
        return;
      }
    }
  };

  Utils.removeElement = function (array, remValue) {
    for (var i = 0, l = array.length; i < l; ++i) {
      if (array[i] === remValue) {
        array[i] = array[l - 1];
        array.pop();
        return;
      }
    }
  };

  Utils.appendArray = function (array1, array2) {
    var nb1 = array1.length;
    var nb2 = array2.length;
    array1.length += nb2;
    for (var i = 0; i < nb2; ++i)
      array1[nb1 + i] = array2[i];
  };

  /** Return true if the number is a power of two */
  Utils.isPowerOfTwo = function (x) {
    return x !== 0 && (x & (x - 1)) === 0;
  };

  /** Return the nearest power of two value */
  Utils.nextHighestPowerOfTwo = function (x) {
    --x;
    for (var i = 1; i < 32; i <<= 1)
      x = x | x >> i;
    return x + 1;
  };

  var sortFunc = function (a, b) {
    return a - b;
  };
  /** sort an array and delete duplicate values */
  Utils.tidy = function (array) {
    array.sort(sortFunc);
    var len = array.length;
    var i = 0;
    var j = 0;
    for (i = 1; i < len; ++i) {
      if (array[j] !== array[i])
        array[++j] = array[i];
    }
    if (i > 1)
      array.length = j + 1;
  };

  /** Intersection between two arrays */
  Utils.intersectionArrays = function (a, b) {
    var ai = 0;
    var bi = 0;
    var result = [];

    var aLen = a.length;
    var bLen = b.length;
    while (ai < aLen && bi < bLen) {
      if (a[ai] < b[bi]) ai++;
      else if (a[ai] > b[bi]) bi++;
      else {
        result.push(a[ai]);
        ++ai;
        ++bi;
      }
    }
    return result;
  };

  /** Get bytes */
  Utils.getBytes = function (data, offset) {
    return [data[offset].charCodeAt(), data[offset + 1].charCodeAt(), data[offset + 2].charCodeAt(), data[offset + 3].charCodeAt()];
  };

  /** Read a binary uint32 */
  Utils.getUint32 = function (data, offset) {
    var b = Utils.getBytes(data, offset);
    return (b[0] << 0) | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
  };

  /** Read a binary float32 */
  Utils.getFloat32 = function (data, offset) {
    var b = Utils.getBytes(data, offset),
      sign = 1 - (2 * (b[3] >> 7)),
      exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
      mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0];

    if (exponent === 128) {
      if (mantissa !== 0)
        return NaN;
      else
        return sign * Infinity;
    }
    if (exponent === -127)
      return sign * mantissa * Math.pow(2, -126 - 23);
    return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
  };

  /** Array buffer to string utf-8 */
  Utils.ab2str = function (buf) {
    var str = '';
    var ab = new Uint8Array(buf);
    var chunkSize = 65535;
    for (var off = 0, abLen = ab.length; off < abLen; off += chunkSize) {
      var subab = ab.subarray(off, chunkSize < abLen - off ? chunkSize + off : abLen);
      str += String.fromCharCode.apply(null, subab);
    }
    return str;
  };

  /** Return a buffer array which is at least nbBytes long */
  Utils.getMemory = (function () {
    var pool = new ArrayBuffer(100000);
    return function (nbBytes) {
      if (pool.byteLength >= nbBytes)
        return pool;
      pool = new ArrayBuffer(nbBytes);
      return pool;
    };
  })();

  /** Return the current time */
  Utils.now = Date.now || function () {
    return new Date().getTime();
  };

  Utils.throttle = function (func, wait) {
    var result;
    var args = [];
    var timeout = null;
    var previous = 0;
    var later = function () {
      previous = Utils.now();
      timeout = null;
      result = func.apply(func, args);
    };
    return function () {
      var now = Utils.now();
      var remaining = wait - (now - previous);

      var nbArgs = args.length = arguments.length;
      for (var i = 0; i < nbArgs; ++i)
        args[i] = arguments[i];

      if (remaining <= 0 || remaining > wait) {
        window.clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(func, args);
      } else if (!timeout) {
        timeout = window.setTimeout(later, remaining);
      }
      return result;
    };
  };

  Utils.normalizeArrayVec3 = function (array, out) {
    var arrayOut = out || array;
    for (var i = 0, l = array.length; i < l; ++i) {
      var j = i * 3;
      var nx = array[j];
      var ny = array[j + 1];
      var nz = array[j + 2];
      var len = nx * nx + ny * ny + nz * nz;
      if (len === 0) {
        arrayOut[j] = 1.0;
        continue;
      }
      len = 1.0 / Math.sqrt(len);
      arrayOut[j] = nx * len;
      arrayOut[j + 1] = ny * len;
      arrayOut[j + 2] = nz * len;
    }
    return arrayOut;
  };

  // var vector = function (ArrayConstructor, initSize) {
  //   this._constructor = ArrayConstructor;
  //   this._data = new ArrayConstructor(initSize);
  //   this.length = 0;
  // };
  // vector.prototype = {
  //   push: function (element) {
  //     if (this.length === this._data.length) {
  //       var tmp = this._data;
  //       this._data = new this._constructor(1 + this.length * 2);
  //       this._data.set(tmp);
  //     }
  //     this._data[this.length++] = element;
  //   },
  //   pop: function () {
  //     --this.length;
  //     if (this.length < this._data.length * 4) {
  //       this._data.subarray(0, 1 + this.length * 2);
  //     }
  //   },
  //   append: function (array) {
  //     var offset = this.length;
  //     this.length += array.length;
  //     if (this.length >= this._data.length) {
  //       var tmp = this._data;
  //       this._data = new this._constructor(1 + this.length * 2);
  //       this._data.set(tmp);
  //     }
  //     this._data.set(array, offset);
  //   },
  //   getShrinked: function () {
  //     return this._data.subarray(0, this.length);
  //   }
  // };
  // Utils.vector = vector;

  // /** Compute ACMR and ATVR (vertex post transform ratio) */
  // Utils.outputsACMRandATVR = function (mesh) {
  //   var iAr = mesh.getTriangles();
  //   var sizeCache = 32;
  //   var cache = [];
  //   cache.length = sizeCache;

  //   var isCacheMiss = function (id) {
  //     for (var k = 0; k < sizeCache; ++k) {
  //       if (cache[k] === undefined) {
  //         cache[k] = id;
  //         return 1;
  //       } else if (cache[k] === id) {
  //         // not sure about that one...
  //         // Does a cache HIT moves the vert
  //         // up in the FIFO ?
  //         // cache.splice(k,1)
  //         // cache.push(id)
  //         return 0;
  //       }
  //     }
  //     cache.shift();
  //     cache.push(id);
  //     return 1;
  //   };

  //   var nbTriangles = mesh.getNbTriangles();
  //   var cacheMiss = 0;
  //   for (var i = 0; i < nbTriangles; ++i) {
  //     var id = i * 3;
  //     cacheMiss += isCacheMiss(iAr[id]);
  //     cacheMiss += isCacheMiss(iAr[id + 1]);
  //     cacheMiss += isCacheMiss(iAr[id + 2]);
  //   }

  //   console.log('ACMR : ' + cacheMiss / nbTriangles);
  //   console.log('ATVR : ' + cacheMiss / mesh.getNbVertices());
  // };

  // Utils.optimizePreTransform = function (newMesh) {
  //   var vArOld = newMesh.getVertices();
  //   var cArOld = newMesh.getColors();
  //   var mArOld = newMesh.getMaterials();
  //   var fArOld = newMesh.getFaces();

  //   // var hasUV = newMesh.hasUV();
  //   // var fArUVOld = newMesh.getFacesTexCoord();
  //   // var uvArOld = newMesh.getTexCoords();
  //   // var dupOld = newMesh.getVerticesDuplicateStartCount();

  //   var nbVerts = newMesh.getNbVertices();

  //   var vArNew = new Float32Array(nbVerts * 3);
  //   var cArNew = cArOld ? new Float32Array(nbVerts * 3) : null;
  //   var mArNew = mArOld ? new Float32Array(nbVerts * 3) : null;
  //   var fArNew = new Uint32Array(newMesh.getNbFaces() * 4);

  //   // var dupNew = hasUV ? new Uint32Array(nbVerts * 2) : null;
  //   // var uvArNew = hasUV ? new Float32Array(uvArOld.subarray(0, newMesh.getNbTexCoords() * 2)) : null;
  //   // var fArUVNew = hasUV ? new Int32Array(fArUVOld.subarray(0, newMesh.getNbFaces() * 4)) : null;

  //   var idvPos = new Int32Array(nbVerts);
  //   var acc = 0;
  //   for (var i = 0, l = fArNew.length; i < l; ++i) {
  //     var iv = fArOld[i];
  //     var tag = idvPos[iv] - 1;
  //     if (tag === -1) {
  //       var idNew = acc * 3;
  //       var idOld = iv * 3;
  //       vArNew[idNew] = vArOld[idOld];
  //       vArNew[idNew + 1] = vArOld[idOld + 1];
  //       vArNew[idNew + 2] = vArOld[idOld + 2];
  //       if (cArNew) {
  //         cArNew[idNew] = cArOld[idOld];
  //         cArNew[idNew + 1] = cArOld[idOld + 1];
  //         cArNew[idNew + 2] = cArOld[idOld + 2];
  //       }
  //       if (mArNew) {
  //         mArNew[idNew] = mArOld[idOld];
  //         mArNew[idNew + 1] = mArOld[idOld + 1];
  //         mArNew[idNew + 2] = mArOld[idOld + 2];
  //       }
  //       // if (dupNew) {
  //       //   dupNew[acc * 2] = dupOld[iv * 2];
  //       //   dupNew[acc * 2 + 1] = dupOld[iv * 2 + 1];
  //       // }
  //       // if (uvArNew) {
  //       //   uvArNew[acc * 2] = uvArOld[iv * 2];
  //       //   uvArNew[acc * 2 + 1] = uvArOld[iv * 2 + 1];
  //       // }
  //       tag = acc++;
  //       idvPos[iv] = tag + 1;
  //     }
  //     fArNew[i] = tag;
  //     // if (fArUVNew && fArUVNew[i] < nbVerts)
  //     //   fArUVNew[i] = tag;
  //   }
  //   newMesh.setVertices(vArNew);
  //   newMesh.setColors(cArNew);
  //   newMesh.setMaterials(mArNew);
  //   newMesh.setFaces(fArNew);
  //   // newMesh.setVerticesDuplicateStartCount(dupNew);
  //   // newMesh.setTexCoords(uvArNew);
  //   // newMesh.setFacesTexCoord(fArUVNew);
  // };

  return Utils;
});