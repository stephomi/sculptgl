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
    this.op1 = op1;
    this.op2 = op2;

    if (op1.setCombinator) op1.setCombinator(this);
    if (op2.setCombinator) op2.setCombinator(this);

    this.uRoundRadius = 0.3;
    this.uChamferRadius = 0.3;
    this.uColumns = [0.2, 3.0];
    this.uStairs = [0.2, 3.0];
    this._uniformNames.push('uRoundRadius', 'uChamferRadius', 'uColumns', 'uStairs');
  };
  BaseCombination.prototype = {
    type: 'BaseCombination',
    shaderName: 'shaderName',
    toJSON: function () {
      var json = NodeAbstract.prototype.toJSON.call(this);
      json.op1 = this.op1.toJSON();
      json.op2 = this.op2.toJSON();
      return json;
    },
    shaderMaterialColor: function (string) {
      this.op1.shaderMaterialColor(string);
      this.op2.shaderMaterialColor(string);
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
      var isSelected = this.op1._selected || this.op2._selected;
      if (this.uRoundRadius > 0.0) return [isSelected ? 'uRoundRadius' : this.toStr(this.uRoundRadius)];
      if (this.uChamferRadius > 0.0) return [isSelected ? 'uChamferRadius' : this.toStr(this.uChamferRadius)];
      if (this.uColumns[0] > 0.0) return [isSelected ? 'uColumns' : this.toStr(this.uColumns)];
      if (this.uStairs[0] > 0.0) return [isSelected ? 'uStairs' : this.toStr(this.uStairs)];
      return [''];
    },
    combinationDistance: function (string, func, type) {
      var op1 = this.op1[func](string);
      var op2 = this.op2[func](string);

      if (!!this.op1.op1) op1 = declare(type, op1, string);
      if (!!this.op2.op1) op2 = declare(type, op2, string);

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
    type: 'UNION',
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
    type: 'INTER',
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
    type: 'SUB',
    shaderName: 'opSub'
  };
  Utils.makeProxy(BaseCombination, Combinations.SUB);

  Combinations.SUB_INV = function (op1, op2) {
    BaseCombination.call(this, op2, op1);
  };
  Combinations.SUB_INV.prototype = Combinations.SUB.prototype;

  module.exports = Combinations;
});