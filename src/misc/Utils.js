define(function (require, exports, module) {

  'use strict';

  var Utils = {};

  Utils.SCALE = 100.0; // scale factor
  Utils.TAG_FLAG = 1; // flag value for comparison (always >= tags values)
  Utils.SCULPT_FLAG = 1; // flag value for sculpt (always >= tags values)
  Utils.STATE_FLAG = 1; // flag value for states (always >= tags values)

  Utils.cursors = {};
  Utils.cursors.dropper = 'url(resources/dropper.png) 5 25, auto';

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
    for (var i = 0, l = array.length / 3; i < l; ++i) {
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

  Utils.convertArrayVec3toSRGB = function (array, out) {
    var arrayOut = out || array;
    for (var i = 0, l = array.length; i < l; ++i) {
      var c = array[i];
      var S1 = Math.sqrt(c);
      var S2 = Math.sqrt(S1);
      var S3 = Math.sqrt(S2);
      arrayOut[i] = 0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * c;
    }
    return arrayOut;
  };

  Utils.convertArrayVec3toLinear = function (array, out) {
    var arrayOut = out || array;
    for (var i = 0, l = array.length; i < l; ++i) {
      var c = array[i];
      arrayOut[i] = c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
    }
    return arrayOut;
  };

  module.exports = Utils;
});