define([
  'lib/glMatrix',
  'misc/Utils',
  'math3d/Geometry',
  'editor/tools/SculptBase',
  'editor/tools/Rotate'
], function (glm, Utils, Geometry, SculptBase, Rotate) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Scale = function (main) {
    SculptBase.call(this, main);
    this._matrixInv = mat4.create();
    this._preTranslate = mat4.create();
    this._postTranslate = mat4.create();
    this._refMX = 0.0;
    this._refMY = 0.0;
  };

  Scale.prototype = {
    end: Rotate.prototype.endTransform,
    applyEditMatrix: Rotate.prototype.applyEditMatrix,
    startSculpt: (function () {
      var tmp = [0.0, 0.0, 0.0];
      return function () {
        var matrix = this._mesh.getMatrix();
        mat4.invert(this._matrixInv, matrix);
        vec3.transformMat4(tmp, this._mesh.getCenter(), matrix);
        mat4.translate(this._preTranslate, mat4.identity(this._preTranslate), tmp);
        mat4.translate(this._postTranslate, mat4.identity(this._postTranslate), vec3.negate(tmp, tmp));

        var main = this._main;
        this._refMX = main._mouseX;
        this._refMY = main._mouseY;
      };
    })(),
    update: (function () {
      var tmp = [0.0, 0.0, 0.0];
      return function () {
        var main = this._main;
        tmp[0] = tmp[1] = tmp[2] = 1.0 + (main._mouseX - this._refMX + main._mouseY - this._refMY) / 400;
        var mEdit = this._mesh.getEditMatrix();
        mat4.identity(mEdit);
        mat4.scale(mEdit, mEdit, tmp);

        mat4.mul(mEdit, this._preTranslate, mEdit);
        mat4.mul(mEdit, mEdit, this._postTranslate);

        mat4.mul(mEdit, this._matrixInv, mEdit);
        mat4.mul(mEdit, mEdit, this._mesh.getMatrix());

        main.render();
        main.getCanvas().style.cursor = 'default';
      };
    })()
  };

  Utils.makeProxy(SculptBase, Scale);

  return Scale;
});