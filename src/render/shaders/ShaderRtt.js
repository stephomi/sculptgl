define([
  'render/shaders/ShaderBase',
  'render/Attribute',
  'misc/getOptionsURL',
  'text!render/shaders/glsl/fxaa.glsl'
], function (ShaderBase, Attribute, getOptionsURL, fxaaGLSL) {

  'use strict';

  var ShaderRtt = ShaderBase.getCopy();
  ShaderRtt.vertexName = ShaderRtt.fragmentName = 'FxaaFilmic';

  ShaderRtt.FILMIC = getOptionsURL().filmic; // edited by the gui

  ShaderRtt.uniforms = {};
  ShaderRtt.attributes = {};

  ShaderRtt.uniformNames = ['uTexture0', 'uSize', 'uFilmic'];

  ShaderRtt.vertex = [
    'precision mediump float;',
    'attribute vec2 aVertex;',
    'uniform vec2 uInvSize;',
    'varying vec2 vUVNW;',
    'varying vec2 vUVNE;',
    'varying vec2 vUVSW;',
    'varying vec2 vUVSE;',
    'varying vec2 vUVM;',
    'void main() {',
    '  vUVM = aVertex * 0.5 + 0.5;',
    '  vUVNW = vUVM + vec2(-1.0, -1.0) * uInvSize;',
    '  vUVNE = vUVM + vec2(1.0, -1.0) * uInvSize;',
    '  vUVSW = vUVM + vec2(-1.0, 1.0) * uInvSize;',
    '  vUVSE = vUVM + vec2(1.0, 1.0) * uInvSize;',
    '  gl_Position = vec4(aVertex, 0.5, 1.0);',
    '}'
  ].join('\n');

  ShaderRtt.fragment = [
    'precision mediump float;',
    'uniform sampler2D uTexture0;',
    'uniform int uFilmic;',
    'uniform vec2 uInvSize;',
    'varying vec2 vUVNW;',
    'varying vec2 vUVNE;',
    'varying vec2 vUVSW;',
    'varying vec2 vUVSE;',
    'varying vec2 vUVM;',
    fxaaGLSL,
    ShaderBase.strings.colorSpaceGLSL,
    'void main() {',
    // the fxaa runs in linear, to run it in srgb we'd need to:
    // - convert each tex fetch into srgb
    // - OR do the filmic in the forward shading pass (alpha blending in srgb though)
    // - OR move the filmic op + (other cool linear post process) in a first separate pass
    '  vec3 color = fxaa(uTexture0, vUVNW, vUVNE, vUVSW, vUVSE, vUVM, uInvSize);',
    // http://filmicgames.com/archives/75
    '  if(uFilmic == 1){',
    '    vec3 x = max(vec3(0.0), color - vec3(0.004));',
    '    gl_FragColor = vec4((x*(6.2*x+0.5))/(x*(6.2*x+1.7)+0.06), 1.0);',
    '  }else{',
    '    gl_FragColor = vec4(linearTosRGB(color), 1.0);',
    '  }',
    '}'
  ].join('\n');

  ShaderRtt.draw = function (rtt) {
    var gl = rtt.getGL();
    gl.useProgram(this.program);

    ShaderRtt.attributes.aVertex.bindToBuffer(rtt.getVertexBuffer());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtt.getTexture());
    gl.uniform1i(this.uniforms.uTexture0, 0);

    gl.uniform2fv(this.uniforms.uInvSize, [1.0 / rtt._size[0], 1.0 / rtt._size[1]]);

    gl.uniform1i(this.uniforms.uFilmic, ShaderRtt.FILMIC);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  ShaderRtt.initAttributes = function (gl) {
    ShaderRtt.attributes.aVertex = new Attribute(gl, ShaderRtt.program, 'aVertex', 2, gl.FLOAT);
  };

  return ShaderRtt;
});