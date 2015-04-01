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

  var Scale = function (states) {
    SculptBase.call(this, states);
    this.matrixInv_ = mat4.create();
    this.preTranslate_ = mat4.create();
    this.postTranslate_ = mat4.create();
    this.refMX_ = 0.0;
    this.refMY_ = 0.0;
  };

  Scale.prototype = {
    end: Rotate.prototype.endTransform,
    applyEditMatrix: Rotate.prototype.applyEditMatrix,
    startSculpt: (function () {
      var tmp = [0.0, 0.0, 0.0];
      // var qu = [0.0, 0.0, 0.0, 1.0];
      return function (main) {
        var matrix = this.mesh_.getMatrix();
        mat4.invert(this.matrixInv_, matrix);
        vec3.transformMat4(tmp, this.mesh_.getCenter(), matrix);
        mat4.translate(this.preTranslate_, mat4.identity(this.preTranslate_), tmp);
        mat4.translate(this.postTranslate_, mat4.identity(this.postTranslate_), vec3.negate(tmp, tmp));

        this.refMX_ = main.mouseX_;
        this.refMY_ = main.mouseY_;
      };
    })(),
    update: (function () {
      var tmp = [0.0, 0.0, 0.0];
      return function (main) {
        tmp[0] = tmp[1] = tmp[2] = 1.0 + (main.mouseX_ - this.refMX_ + main.mouseY_ - this.refMY_) / 400;
        var mEdit = this.mesh_.getEditMatrix();
        mat4.identity(mEdit);
        mat4.scale(mEdit, mEdit, tmp);

        mat4.mul(mEdit, this.preTranslate_, mEdit);
        mat4.mul(mEdit, mEdit, this.postTranslate_);

        mat4.mul(mEdit, this.matrixInv_, mEdit);
        mat4.mul(mEdit, mEdit, this.mesh_.getMatrix());

        main.render();
        main.getCanvas().style.cursor = 'default';
      };
    })()
  };

  Utils.makeProxy(SculptBase, Scale);

  return Scale;
});