define(function (require, exports, module) {

  'use strict';

  /////////////////
  // BASE PRIMITIVE
  /////////////////
  var NodeAbstract = function () {
    this._uniformNames = [];
    this._selected = false;
  };
  NodeAbstract.prototype = {
    toStr: function (val) {
      if (!val.length) return val.toExponential();

      var str = val[0].toExponential();
      for (var i = 1, nbElt = val.length; i < nbElt; ++i) str += ',' + val[i].toExponential();

      if (val.length < 5) return 'vec' + val.length + '(' + str + ')';
      return 'mat4(' + str + ')';
    },
    getSelected: function () {
      return this._selected;
    },
    setSelected: function (bool) {
      this._selected = bool;
    },
    getParam: function (name) {
      return this[name];
    },
    getParamStr: function (name) {
      if (this._selected) return name;
      return this.toStr(this.getParam(name));
    },
    getParamType: function (name) {
      var val = this[name];
      if (!val.length) return 'float';
      if (val.length < 5) return 'vec' + val.length;
      return 'mat' + Math.sqrt(val.length);
    },
    declareUniforms: function () {
      var uNames = this._uniformNames;
      var unifs = [];
      for (var i = 0, nbNames = uNames.length; i < nbNames; ++i) {
        var uName = uNames[i];
        unifs.push('uniform ' + this.getParamType(uName) + ' ' + uName + ';');
      }
      return unifs.join('\n');
    },
    updateUniforms: function (gl, uniforms) {
      var uNames = this._uniformNames;
      for (var i = 0, nbNames = uNames.length; i < nbNames; ++i) {
        var uName = uNames[i];
        var len = this[uName].length;
        if (!len) gl.uniform1f(uniforms[uName], this.getParam(uName));
        else if (len < 5) gl['uniform' + len + 'fv'](uniforms[uName], this.getParam(uName));
        else gl['uniformMatrix' + Math.sqrt(len) + 'fv'](uniforms[uName], false, this.getParam(uName));
      }
    },
    getUniformNames: function () {
      return this._uniformNames;
    }
  };

  module.exports = NodeAbstract;
});