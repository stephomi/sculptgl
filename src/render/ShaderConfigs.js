define([], function () {

  'use strict';

  var ShaderConfig = {};

  ShaderConfig.mode = {
    PHONG: 0,
    TRANSPARENCY: 1,
    WIREFRAME: 2,
    NORMAL: 3,
    BACKGROUND: 4,
    MATERIAL: 5
  };

  var glfloat = 0x1406;

  var vertexConfig = {
    name: 'aVertex',
    size: 3,
    type: glfloat
  };

  var normalConfig = {
    name: 'aNormal',
    size: 3,
    type: glfloat
  };

  var colorConfig = {
    name: 'aColor',
    size: 3,
    type: glfloat
  };

  var texCoordConfig = {
    name: 'aTexCoord',
    size: 2,
    type: glfloat
  };

  ShaderConfig[ShaderConfig.mode.PHONG] = {
    vertex: 'phongVertex',
    fragment: 'phongFragment',
    attributes: [vertexConfig, normalConfig, colorConfig],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[ShaderConfig.mode.WIREFRAME] = {
    vertex: 'wireframeVertex',
    fragment: 'wireframeFragment',
    attributes: [vertexConfig],
    uniforms: ['uMVP']
  };
  ShaderConfig[ShaderConfig.mode.TRANSPARENCY] = {
    vertex: 'transparencyVertex',
    fragment: 'transparencyFragment',
    attributes: [vertexConfig, normalConfig, colorConfig],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[ShaderConfig.mode.NORMAL] = {
    vertex: 'normalVertex',
    fragment: 'normalFragment',
    attributes: [vertexConfig, normalConfig],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uRadiusSquared']
  };
  ShaderConfig[ShaderConfig.mode.MATERIAL] = {
    vertex: 'reflectionVertex',
    fragment: 'reflectionFragment',
    attributes: [vertexConfig, normalConfig, colorConfig],
    uniforms: ['uMV', 'uMVP', 'uN', 'uCenterPicking', 'uCenterPickingSym', 'ptPlane', 'nPlane', 'uScale', 'uRadiusSquared', 'uTexture0']
  };
  ShaderConfig[ShaderConfig.mode.BACKGROUND] = {
    vertex: 'backgroundVertex',
    fragment: 'backgroundFragment',
    attributes: [{
        name: 'aVertex',
        size: 2,
        type: glfloat
      },
      texCoordConfig
    ],
    uniforms: ['uTexture0']
  };

  return ShaderConfig;
});