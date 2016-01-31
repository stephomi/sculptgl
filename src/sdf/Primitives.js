define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var m4identity = mat4.create(); // should not be modified
  var tmp3 = [0.0, 0.0, 0.0];

  var toVec3str = function (arr) {
    return 'vec3(' + arr[0].toExponential() + ',' + arr[1].toExponential() + ',' + arr[2].toExponential() + ')';
  };
  var toVec2str = function (arr) {
    return 'vec2(' + arr[0].toExponential() + ',' + arr[1].toExponential() + ')';
  };

  var Primitives = {};
  Primitives.SHADER_UID_VAR = 1;
  Primitives.MATERIAL_UID_VAR = 1;

  var declare = function (type, strVal, string) {
    var varName = 'tmpPrim_' + (Primitives.SHADER_UID_VAR++);
    string[0] += type + ' ' + varName + ' = ' + strVal + ';\n';
    return varName;
  };

  /////////////////
  // BASE PRIMITIVE
  /////////////////
  var BasePrimitive = function () {
    this._id = Primitives.SHADER_UID_VAR++;

    this._center = [0.0, 0.0, 0.0];
    this._color = [1.0, 0.5, 0.5];
    this._editMatrix = mat4.create();
    this._uniformNames = ['uPrimitivePos', 'uPrimitiveColor'];

    this._selected = false;
    this._combinator = undefined;
  };
  BasePrimitive.prototype = {
    getID: function () {
      return this._id;
    },
    setCombinator: function (combinator) {
      this._combinator = combinator;
    },
    declareUniforms: function () {
      var unifs = [
        'uniform vec3 uPrimitivePos;',
        'uniform vec3 uPrimitiveColor;'
      ];
      if (this._combinator)
        unifs = unifs.concat(this._combinator.declareUniforms());
      return unifs.join('\n');
    },
    updateUniforms: function (gl, uniforms) {
      gl.uniform3fv(uniforms.uPrimitivePos, this.getPosition());
      gl.uniform3fv(uniforms.uPrimitiveColor, this.getColor());
      if (this._combinator)
        this._combinator.updateUniforms(gl, uniforms);
    },
    getUniformNames: function () {
      var unifs = this._uniformNames;
      if (this._combinator)
        unifs = unifs.concat(this._combinator.getUniformNames());
      return unifs;
    },
    getSelected: function () {
      return this._selected;
    },
    setSelected: function (bool) {
      this._selected = bool;
    },
    shaderDistanceMat: function (string) {
      var dist = this.shaderDistance(string);
      return declare('vec4', 'vec4(' + dist + ', ' + this.getColorStr() + ')', string);
    },
    getColor: function () {
      return this._color;
    },
    getColorStr: function () {
      if (this._selected) return 'uPrimitiveColor';
      return toVec3str(this._color);
    },
    getPosition: function () {
      return vec3.transformMat4(tmp3, this._center, this._editMatrix);
    },
    getPositionStr: function () {
      if (this._selected) return 'uPrimitivePos';
      return toVec3str(vec3.transformMat4(tmp3, this._center, this._editMatrix));
    },
    getCenter: function () {
      return this._center;
    },
    getMatrix: function () {
      return m4identity;
    },
    getEditMatrix: function () {
      return this._editMatrix;
    }
  };

  /////////
  // SPHERE
  /////////
  Primitives.SPHERE = function () {
    BasePrimitive.call(this);
    this._radius = 4.0;
  };
  Primitives.SPHERE.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      return 'sdSphere(point - ' + this.getPositionStr() + ', ' + this._radius.toExponential() + ')';
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.SPHERE);

  //////
  // BOX
  //////
  Primitives.BOX = function () {
    BasePrimitive.call(this);
    this._side = [4.0, 4.0, 4.0];
  };
  Primitives.BOX.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      return 'sdBox(point - ' + this.getPositionStr() + ', ' + toVec3str(this._side) + ')';
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.BOX);

  ////////
  // TORUS
  ////////
  Primitives.TORUS = function () {
    BasePrimitive.call(this);
    this._side = [4.0, 0.5];
  };
  Primitives.TORUS.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      return 'sdTorus(point - ' + this.getPositionStr() + ', ' + toVec2str(this._side) + ')';
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.TORUS);

  module.exports = Primitives;
});