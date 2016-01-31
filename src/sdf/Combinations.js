define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var NodeAbstract = require('sdf/NodeAbstract');

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
    NodeAbstract.call(this);
    this._op1 = op1;
    this._op2 = op2;

    if (op1.setCombinator) op1.setCombinator(this);
    if (op2.setCombinator) op2.setCombinator(this);

    this.uRoundRadius = 3.0;
    this.uChamferRadius = 3.0;
    this.uColumns = [2.0, 3.0];
    this.uStairs = [2.0, 3.0];
    this._uniformNames.push('uRoundRadius', 'uChamferRadius', 'uColumns', 'uStairs');
  };
  BaseCombination.prototype = {
    type: 'COMBINATION',
    shaderName: 'shaderName',
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
    resetTransitions: function (name) {
      this.uRoundRadius = Math.abs(this.uRoundRadius) * (name === 'ROUND' ? 1.0 : -1.0);
      this.uChamferRadius = Math.abs(this.uChamferRadius) * (name === 'CHAMFER' ? 1.0 : -1.0);
      this.uColumns[0] = Math.abs(this.uColumns[0]) * (name === 'COLUMNS' ? 1.0 : -1.0);
      this.uStairs[0] = Math.abs(this.uStairs[0]) * (name === 'STAIRS' ? 1.0 : -1.0);
    },
    getShaderFunc: function () {
      if (this.uRoundRadius > 0.0) return this.shaderName + 'Round';
      if (this.uChamferRadius > 0.0) return this.shaderName + 'Chamfer';
      if (this.uColumns[0] > 0.0) return this.shaderName + 'Columns';
      if (this.uStairs[0] > 0.0) return this.shaderName + 'Stairs';
      return this.shaderName;
    },
    extraParameter: function () {
      var isSelected = this._op1._selected || this._op2._selected;
      if (this.uRoundRadius > 0.0) return [isSelected ? 'uRoundRadius' : this.toStr(this.uRoundRadius)];
      if (this.uChamferRadius > 0.0) return [isSelected ? 'uChamferRadius' : this.toStr(this.uChamferRadius)];
      if (this.uColumns[0] > 0.0) return [isSelected ? 'uColumns' : this.toStr(this.uColumns)];
      if (this.uStairs[0] > 0.0) return [isSelected ? 'uStairs' : this.toStr(this.uStairs)];
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
  Utils.makeProxy(NodeAbstract, BaseCombination);

  ////////
  // UNION
  ////////
  Combinations.UNION = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.UNION.prototype = {
    shaderName: 'opUnion'
  };
  Utils.makeProxy(BaseCombination, Combinations.UNION);

  ////////
  // INTER
  ////////
  Combinations.INTER = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.INTER.prototype = {
    shaderName: 'opInter'
  };
  Utils.makeProxy(BaseCombination, Combinations.INTER);

  //////
  // SUB
  //////
  Combinations.SUB = function (op1, op2) {
    BaseCombination.call(this, op1, op2);
  };
  Combinations.SUB.prototype = {
    shaderName: 'opSub'
  };
  Utils.makeProxy(BaseCombination, Combinations.SUB);

  Combinations.SUB_INV = function (op1, op2) {
    BaseCombination.call(this, op2, op1);
  };
  Combinations.SUB_INV.prototype = Combinations.SUB.prototype;

  module.exports = Combinations;
});