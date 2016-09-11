// polyfills stuffs

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

if (!Float32Array.prototype.slice) {
  var slicePolyfill = function (start, end) {
    return new this.constructor(this.subarray(start, end));
  };

  Int8Array.prototype.slice = slicePolyfill;
  Uint8Array.prototype.slice = slicePolyfill;
  Uint8ClampedArray.prototype.slice = slicePolyfill;
  Int16Array.prototype.slice = slicePolyfill;
  Uint16Array.prototype.slice = slicePolyfill;
  Int32Array.prototype.slice = slicePolyfill;
  Uint32Array.prototype.slice = slicePolyfill;
  Float32Array.prototype.slice = slicePolyfill;
  Float64Array.prototype.slice = slicePolyfill;
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (str) {
    return this.slice(-str.length) === str;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) === str;
  };
}

var vendors = ['moz', 'webkit'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
}
if (!window.requestAnimationFrame)
  window.alert('browser is too old. Probably no webgl there anyway');
