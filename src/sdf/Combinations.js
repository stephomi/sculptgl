define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');

  var vec2 = glm.vec2;

  var Combinations = {};
  Combinations.SHADER_UID_VAR = 1;

  var declare = function (type, strVal, string) {
    var varName = 'tmpComb_' + (Combinations.SHADER_UID_VAR++);
    string[0] += type + ' ' + varName + ' = ' + strVal + ';\n';
    return varName;
  };

  ///////////////////
  // BASE COMBINATION
  ///////////////////
  var BaseCombination = function (op1, op2) {
    this._op1 = op1;
    this._op2 = op2;

    if (op1.setCombinator) op1.setCombinator(this);
    if (op2.setCombinator) op2.setCombinator(this);

    this._roundRadius = 0.0;
    this._chamferRadius = 0.0;
    this._uniformNames = ['uRoundRadius', 'uChamferRadius'];
  };
  BaseCombination.prototype = {
    type: 'COMBINATION',
    shaderName: 'shaderName',
    getRoundRadius: function () {
      return this._roundRadius;
    },
    setRoundRadius: function (r) {
      this._roundRadius = r;
    },
    getChamferRadius: function () {
      return this._chamferRadius;
    },
    setChamferRadius: function (r) {
      this._chamferRadius = r;
    },
    declareUniforms: function () {
      return [
        'uniform float uRoundRadius;',
        'uniform float uChamferRadius;',
      ].join('\n');
    },
    updateUniforms: function (gl, uniforms) {
      gl.uniform1f(uniforms.uRoundRadius, this._roundRadius);
      gl.uniform1f(uniforms.uChamferRadius, this._chamferRadius);
    },
    getUniformNames: function () {
      return this._uniformNames;
    },
    shaderMaterialColor: function (string) {
      this._op1.shaderMaterialColor(string);
      this._op2.shaderMaterialColor(string);
    },
    shaderDistanceMat: function (string) {
      return this.combinationDistance(string, 'shaderDistanceMat', 'vec4');
    },
    shaderDistance: function (string) {
      return this.combinationDistance(string, 'shaderDistance', 'float');
    },
    getShaderFunc: function () {
      if (this._roundRadius > 0.0) return this.shaderName + 'Round';
      if (this._chamferRadius > 0.0) return this.shaderName + 'Chamfer';
      return this.shaderName;
    },
    extraParameter: function () {
      var isSelected = this._op1._selected || this._op2._selected;
      if (this._roundRadius > 0.0) return [isSelected ? 'uRoundRadius' : this._roundRadius.toExponential()];
      if (this._chamferRadius > 0.0) return [isSelected ? 'uChamferRadius' : this._chamferRadius.toExponential()];
      return [''];
    },
    combinationDistance: function (string, func, type) {
      var op1 = this._op1[func](string);
      var op2 = this._op2[func](string);

      if (this._op1.type !== 'PRIMITIVE') op1 = declare(type, op1, string);
      if (this._op2.type !== 'PRIMITIVE') op2 = declare(type, op2, string);

      var params = this.extraParameter().join(',');
      if (params.length > 1) params = ', ' + params;

      return declare(type, this.getShaderFunc() + '(' + op1 + ', ' + op2 + params + ')', string);
    }
  };

  ////////
  // UNION
  ////////
  Combinations.UNION = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.UNION.prototype = {
    shaderName: 'opUnion',
    distanceTo: function (p) {
      var a = this._op1.distanceTo(p);
      var b = this._op2.distanceTo(p);

      if (this._roundRadius > 0.0) {
        var e = Math.max(this._roundRadius - Math.abs(a[0] - b[0]), 0.0);
        var dr = Math.min(a[0], b[0]) - e * e * 0.25 / this._roundRadius;
        return [dr, a[0] < b[0] ? a[1] : b[1]];
      }

      if (this._chamferRadius > 0.0) {
        var dc = Math.min(Math.min(a[0], b[0]), (a[0] - this._chamferRadius + b[0]) * Math.SQRT1_2);
        return [dc, a[0] < b[0] ? a[1] : b[1]];
      }

      return a[0] < b[0] ? a : b;
    }
  };
  Utils.makeProxy(BaseCombination, Combinations.UNION);

  ////////
  // INTER
  ////////
  Combinations.INTER = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.INTER.prototype = {
    shaderName: 'opInter',
    distanceTo: function (p) {
      var a = this._op1.distanceTo(p);
      var b = this._op2.distanceTo(p);

      if (this._roundRadius > 0.0) {
        var u = [Math.max(0.0, this._roundRadius + a[0]), Math.max(0.0, this._roundRadius + b[0])];
        var d = Math.min(this._roundRadius, Math.max(a[0], b[0])) + vec2.len(u);
        return [d, a[0] > b[0] ? a[1] : b[1]];
      }

      if (this._chamferRadius > 0.0) {
        var dc = Math.max(Math.max(a[0], b[0]), (a[0] + this._chamferRadius + b[0]) * Math.SQRT1_2);
        return [dc, a[0] > b[0] ? a[1] : b[1]];
      }

      return a[0] > b[0] ? a : b;
    }
  };
  Utils.makeProxy(BaseCombination, Combinations.INTER);

  //////
  // SUB
  //////
  Combinations.SUB = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.SUB.prototype = {
    shaderName: 'opSub',
    distanceTo: function (p) {
      var a = this._op1.distanceTo(p);
      var b = this._op2.distanceTo(p);

      if (this._roundRadius > 0.0) {
        var u = [Math.max(0.0, this._roundRadius + a[0]), Math.max(0.0, this._roundRadius - b[0])];
        var d = Math.min(this._roundRadius, Math.max(a[0], -b[0])) + vec2.len(u);
        return [d, a[1]];
      }

      if (this._chamferRadius > 0.0) {
        var dc = Math.max(Math.max(a[0], -b[0]), (a[0] + this._chamferRadius - b[0]) * Math.SQRT1_2);
        return [dc, a[1]];
      }

      return [Math.max(-b[0], a[0]), a[1]];
    }
  };
  Utils.makeProxy(BaseCombination, Combinations.SUB);

  Combinations.SUB_INV = function (op1, op2) {
    BaseCombination.call(this, op2, op1);
  };
  Combinations.SUB_INV.prototype = Combinations.SUB.prototype;

  module.exports = Combinations;
});