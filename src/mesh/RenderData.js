import getOptionsURL from 'misc/getOptionsURL';
import Buffer from 'render/Buffer';
import ShaderMatcap from 'render/shaders/ShaderMatcap';

var RenderData = function (gl) {
  var opts = getOptionsURL();

  return {
    _gl: gl,

    _shaderType: opts.shader,
    _flatShading: opts.flatshading,
    _showWireframe: opts.wireframe,
    _matcap: Math.min(opts.matcap, ShaderMatcap.matcaps.length - 1), // matcap id
    _curvature: Math.min(opts.curvature, 5.0),
    _texture0: null,

    _useDrawArrays: false,
    _vertexBuffer: new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
    _normalBuffer: new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
    _colorBuffer: new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
    _materialBuffer: new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
    _texCoordBuffer: new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
    _indexBuffer: new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW),
    _wireframeBuffer: new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW),

    // these material values overrides the vertex attributes
    // it's here for debug or preview
    _albedo: new Float32Array([-1.0, -1.0, -1.0]),
    _roughness: -0.18,
    _metallic: -0.78,
    _alpha: 1.0,

    _flatColor: new Float32Array([1.0, 0.0, 0.0]),
    _mode: gl.TRIANGLES
  };
};

RenderData.ONLY_DRAW_ARRAYS = false;

export default RenderData;
