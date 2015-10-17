define(function (require, exports, module) {

  'use strict';

  var glm = {};

  glm.vec2 = window.vec2;
  glm.vec3 = window.vec3;
  glm.vec4 = window.vec4;
  glm.mat2 = window.mat2;
  glm.mat3 = window.mat3;
  glm.mat4 = window.mat4;
  glm.quat = window.quat;

  module.exports = glm;
});