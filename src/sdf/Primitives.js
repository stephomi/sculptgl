define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');
  var NodeAbstract = require('sdf/NodeAbstract');

  var mat4 = glm.mat4;
  var vec3 = glm.vec3;

  var m4tmp = mat4.create();
  var v3zero = [0.0, 0.0, 0.0];

  var Primitives = {};
  Primitives.SHADER_UID_VAR = 1;

  var declare = function (type, strVal, string) {
    var varName = 'tmpPrim_' + (Primitives.SHADER_UID_VAR++);
    string[0] += type + ' ' + varName + ' = ' + strVal + ';\n';
    return varName;
  };

  /////////////////
  // BASE PRIMITIVE
  /////////////////
  var BasePrimitive = function () {
    NodeAbstract.call(this);

    // for transforms
    this._matrix = mat4.create();
    this._editMatrix = mat4.create();

    this.uBaseTransform = mat4.create();
    this.uBaseScale = 1.0;
    this.uBaseColor = [1.0, 0.5, 0.5];
    this.uBaseMod = [-50.0, -50.0, -50.0];
    this._uniformNames.push('uBaseTransform', 'uBaseScale', 'uBaseColor', 'uBaseMod');

    this._combinator = undefined;
  };
  BasePrimitive.prototype = {
    setCombinator: function (combinator) {
      this._combinator = combinator;
    },
    getParam: function (name) {
      if (name === 'uBaseTransform') return mat4.invert(this.uBaseTransform, mat4.mul(m4tmp, this._matrix, this._editMatrix));
      if (name === 'uBaseScale') return vec3.len(mat4.mul(m4tmp, this._matrix, this._editMatrix));
      return this[name];
    },
    declareUniforms: function () {
      var unifs = NodeAbstract.prototype.declareUniforms.call(this);
      if (this._combinator) unifs = unifs.concat(this._combinator.declareUniforms());
      return unifs;
    },
    updateUniforms: function (gl, uniforms) {
      NodeAbstract.prototype.updateUniforms.call(this, gl, uniforms);
      if (this._combinator) this._combinator.updateUniforms(gl, uniforms);
    },
    getUniformNames: function () {
      var unifs = this._uniformNames;
      if (this._combinator) unifs = unifs.concat(this._combinator.getUniformNames());
      return unifs;
    },
    shaderDistanceMat: function (string) {
      var dist = this.shaderDistance(string);
      return declare('vec4', 'vec4(' + dist + ', ' + this.getParamStr('uBaseColor') + ')', string);
    },
    getCenter: function () {
      return v3zero;
    },
    getMatrix: function () {
      return this._matrix;
    },
    getEditMatrix: function () {
      return this._editMatrix;
    },
    getTransformPointStr: function () {
      return 'pMod((' + this.getParamStr('uBaseTransform') + ' * vec4(point, 1.0)).xyz, ' + this.getParamStr('uBaseMod') + ')';
    }
  };
  Utils.makeProxy(NodeAbstract, BasePrimitive);

  /////////
  // SPHERE
  /////////
  Primitives.SPHERE = function () {
    BasePrimitive.call(this);
    this.uSphereRadius = 4.0;
    this._uniformNames.push('uSphereRadius');
  };
  Primitives.SPHERE.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var radius = this.getParamStr('uSphereRadius');
      var scale = this.getParamStr('uBaseScale');
      return 'sdSphere(' + pt + ', ' + radius + ') * ' + scale;
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.SPHERE);

  //////
  // BOX
  //////
  Primitives.BOX = function () {
    BasePrimitive.call(this);
    this.uBoxSides = [2.0, 4.0, 8.0, 1.0];
    this._uniformNames.push('uBoxSides');
  };
  Primitives.BOX.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var sides = this.getParamStr('uBoxSides');
      var scale = this.getParamStr('uBaseScale');
      return 'sdBox(' + pt + ', ' + sides + ') * ' + scale;
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.BOX);

  ////////
  // TORUS
  ////////
  Primitives.TORUS = function () {
    BasePrimitive.call(this);
    this.uTorusRadii = [4.0, 0.5];
    this._uniformNames.push('uTorusRadii');
  };
  Primitives.TORUS.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var radii = this.getParamStr('uTorusRadii');
      var scale = this.getParamStr('uBaseScale');
      return 'sdTorus(' + pt + ', ' + radii + ') * ' + scale;
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.TORUS);

  //////////
  // CAPSULE
  //////////
  Primitives.CAPSULE = function () {
    BasePrimitive.call(this);
    this.uCapsuleRH = [2.0, 5.0];
    this._uniformNames.push('uCapsuleRH');
  };
  Primitives.CAPSULE.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var rh = this.getParamStr('uCapsuleRH');
      var scale = this.getParamStr('uBaseScale');
      return 'sdCapsule(' + pt + ', ' + rh + ') * ' + scale;
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.CAPSULE);

  ////////////
  // ELLIPSOID
  ////////////
  Primitives.ELLIPSOID = function () {
    BasePrimitive.call(this);
    this.uEllipsoidSides = [2.0, 4.0, 8.0];
    this._uniformNames.push('uEllipsoidSides');
  };
  Primitives.ELLIPSOID.prototype = {
    type: 'PRIMITIVE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var sides = this.getParamStr('uEllipsoidSides');
      var scale = this.getParamStr('uBaseScale');
      return 'sdEllipsoid(' + pt + ', ' + sides + ') * ' + scale;
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.ELLIPSOID);

  module.exports = Primitives;
});