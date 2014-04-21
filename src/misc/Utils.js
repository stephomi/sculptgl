define([], function () {

  'use strict';

  // Not sure I should put theses functions here...
  /** endsWith function */
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (str) {
      return this.slice(-str.length) === str;
    };
  }

  /** startsWith function */
  if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
      return this.slice(0, str.length) === str;
    };
  }

  var Utils = {};

  Utils.elementIndexType = 0; //element index type (ushort or uint)
  Utils.indexArrayType = Uint16Array; //typed array for index element (uint16Array or uint32Array)

  Utils.littleEndian = (function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  /** Return the nearest power of two value */
  Utils.nextHighestPowerOfTwo = function (x) {
    --x;
    for (var i = 1; i < 32; i <<= 1)
      x = x | x >> i;
    return x + 1;
  };

  /** sort an array and delete duplicate values */
  Utils.tidy = function (array) {
    array.sort(function (a, b) {
      return a - b;
    });
    var len = array.length;
    var i = 0,
      j = 0;
    for (i = 1; i < len; ++i) {
      if (array[j] !== array[i])
        array[++j] = array[i];
    }
    if (i > 1)
      array.length = j + 1;
  };

  /** Intersection between two arrays*/
  Utils.intersectionArrays = function (a, b) {
    var ai = 0,
      bi = 0;
    var result = [];

    var aLen = a.length,
      bLen = b.length;
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

  /** Compute ACMR and ATVR (vertex post transform ratio) */
  Utils.outputsACMRandATVR = function (mesh) {
    var iAr = mesh.indicesABC_;
    var sizeCache = 32;
    var cache = new Array(sizeCache);

    var isCacheMiss = function (id) {
      for (var k = 0; k < sizeCache; ++k) {
        if (cache[k] === undefined) {
          cache[k] = id;
          return 1;
        } else if (cache[k] === id) {
          // not sure about that one...
          // Is a cache HIT moves the vert
          // up in the FIFO ?
          // cache.splice(k,1)
          // cache.push(id)
          return 0;
        }
      }
      cache.shift();
      cache.push(id);
      return 1;
    };

    var nbTriangles = mesh.getNbTriangles();
    var cacheMiss = 0;
    for (var i = 0; i < nbTriangles; ++i) {
      var id = i * 3;
      cacheMiss += isCacheMiss(iAr[id]);
      cacheMiss += isCacheMiss(iAr[id + 1]);
      cacheMiss += isCacheMiss(iAr[id + 2]);
    }

    console.log(cacheMiss / nbTriangles);
    console.log(cacheMiss / mesh.getNbVertices());
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

  return Utils;
});