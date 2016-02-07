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
    this.uBaseColor = [1.0, 0.5, 0.5];
    this.uBaseMod = [-5.0, -5.0, -5.0];
    this._uniformNames.push('uBaseTransform', 'uBaseColor', 'uBaseMod');

    this._combinator = undefined;
  };
  BasePrimitive.prototype = {
    type: 'BasePrimitive',
    initObjectJSON: function (obj) {
      NodeAbstract.prototype.initObjectJSON.call(this, obj);
      mat4.invert(this._matrix, this.uBaseTransform);
    },
    setCombinator: function (combinator) {
      this._combinator = combinator;
    },
    getParam: function (name) {
      if (name === 'uBaseTransform') return mat4.invert(this.uBaseTransform, mat4.mul(m4tmp, this._matrix, this._editMatrix));
      return this[name];
    },
    getScale: function () {
      return vec3.len(mat4.mul(m4tmp, this._matrix, this._editMatrix));
    },
    declareUniforms: function () {
      var unifs = NodeAbstract.prototype.declareUniforms.call(this) + '\n';
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
    getScaleStr: function () {
      if (!this._selected) return this.toStr(this.getScale());
      var uMat = this.getParamStr('uBaseTransform');
      return '1.0 / length(' + uMat + '[0] )';
    },
    getTransformPointStr: function () {
      return 'pMod((' + this.getParamStr('uBaseTransform') + ' * vec4(point, 1.0)).xyz, ' + this.getParamStr('uBaseMod') + ')';
    }
  };
  Utils.makeProxy(NodeAbstract, BasePrimitive);

  ////////
  // PLANE
  ////////
  Primitives.PLANE = function () {
    BasePrimitive.call(this);
  };
  Primitives.PLANE.prototype = {
    type: 'PLANE',
    getParamStr: function (name) {
      if (name === 'uBaseColor')
        return 'vec3(0.1) * (mod(floor(5.0 * point.z) + floor(5.0 * point.x), 2.0)) + 0.4';
      return BasePrimitive.prototype.getParamStr.call(this, name);
    },
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      return 'cullPlane(' + pt + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.PLANE);

  /////////
  // SPHERE
  /////////
  Primitives.SPHERE = function () {
    BasePrimitive.call(this);
    this.uSphereRadius = 0.4;
    this._uniformNames.push('uSphereRadius');
  };
  Primitives.SPHERE.prototype = {
    type: 'SPHERE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var radius = this.getParamStr('uSphereRadius');
      return 'sdSphere(' + pt + ', ' + radius + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.SPHERE);

  //////
  // BOX
  //////
  Primitives.BOX = function () {
    BasePrimitive.call(this);
    this.uBoxSides = [0.2, 0.4, 0.8, 0.1];
    this._uniformNames.push('uBoxSides');
  };
  Primitives.BOX.prototype = {
    type: 'BOX',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var sides = this.getParamStr('uBoxSides');
      return 'sdBox(' + pt + ', ' + sides + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.BOX);

  ////////
  // TORUS
  ////////
  Primitives.TORUS = function () {
    BasePrimitive.call(this);
    this.uTorusRadii = [0.4, 0.05];
    this._uniformNames.push('uTorusRadii');
  };
  Primitives.TORUS.prototype = {
    type: 'TORUS',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var radii = this.getParamStr('uTorusRadii');
      return 'sdTorus(' + pt + ', ' + radii + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.TORUS);

  //////////
  // CAPSULE
  //////////
  Primitives.CAPSULE = function () {
    BasePrimitive.call(this);
    this.uCapsuleRH = [0.2, 0.5];
    this._uniformNames.push('uCapsuleRH');
  };
  Primitives.CAPSULE.prototype = {
    type: 'CAPSULE',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var rh = this.getParamStr('uCapsuleRH');
      return 'sdCapsule(' + pt + ', ' + rh + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.CAPSULE);

  ////////////
  // ELLIPSOID
  ////////////
  Primitives.ELLIPSOID = function () {
    BasePrimitive.call(this);
    this.uEllipsoidSides = [0.2, 0.4, 0.8];
    this._uniformNames.push('uEllipsoidSides');
  };
  Primitives.ELLIPSOID.prototype = {
    type: 'ELLIPSOID',
    shaderDistance: function () {
      var pt = this.getTransformPointStr();
      var sides = this.getParamStr('uEllipsoidSides');
      return 'sdEllipsoid(' + pt + ', ' + sides + ') * ' + this.getScaleStr();
    }
  };
  Utils.makeProxy(BasePrimitive, Primitives.ELLIPSOID);

  module.exports = Primitives;
});