'use strict';

function Shader(gl)
{
  this.gl_ = gl; //webgl context
  this.type_ = Shader.mode.MATERIAL; //type of shader

  this.program_ = null; //program shader
  this.fragmentShader_ = null; //fragment shader
  this.vertexShader_ = null; //fragment shader

  this.vertexAttrib_ = null; //vertex attribute location
  this.colorAttrib_ = null; //color vertex attribute location
  this.normalAttrib_ = null; //normal attribute location
  
  this.mvpMatrixUnif_ = null; //model view projection matrix uniform location
  this.mvMatrixUnif_ = null; //model view matrix uniform location
  this.normalMatrixUnif_ = null; //normal matrix uniform location

  this.centerPickingUnif_ = null; //center of selection uniform location
  this.radiusSquaredUnif_ = null; //radius of selection uniform location

  this.reflectionTexUnif_ = null; //reflection texture uniform location
}

//the rendering mode
Shader.mode = {
  PHONG: 0,
  TRANSPARENCY: 1,
  WIREFRAME: 2,
  NORMAL: 3,
  MATERIAL: 4
};

Shader.prototype = {
  /** Initialize the shaders on the mesh */
  init: function (shaders)
  {
    var gl = this.gl_;
    switch (this.type_)
    {
    case Shader.mode.PHONG:
      this.loadShaders(shaders.phongVertex, shaders.phongFragment);
      break;
    case Shader.mode.WIREFRAME:
      this.loadShaders(shaders.wireframeVertex, shaders.wireframeFragment);
      break;
    case Shader.mode.TRANSPARENCY:
      this.loadShaders(shaders.transparencyVertex, shaders.transparencyFragment);
      break;
    case Shader.mode.NORMAL:
      this.loadShaders(shaders.normalVertex, shaders.normalFragment);
      break;
    default:
      this.loadShaders(shaders.reflectionVertex, shaders.reflectionFragment);
      break;
    }
    if (this.program_)
      gl.deleteProgram(this.program_);
    this.program_ = gl.createProgram();
    var program = this.program_;

    gl.attachShader(program, this.vertexShader_);
    gl.attachShader(program, this.fragmentShader_);
    gl.linkProgram(program);
    gl.useProgram(program);

    this.vertexAttrib_ = gl.getAttribLocation(program, 'vertex');
    this.normalAttrib_ = gl.getAttribLocation(program, 'normal');
    if (this.type_ !== Shader.mode.NORMAL && this.type_ !== Shader.mode.WIREFRAME)
      this.colorAttrib_ = gl.getAttribLocation(program, 'color');

    this.mvpMatrixUnif_ = gl.getUniformLocation(program, 'mvpMat');
    this.mvMatrixUnif_ = gl.getUniformLocation(program, 'mvMat');
    this.normalMatrixUnif_ = gl.getUniformLocation(program, 'nMat');
    this.centerPickingUnif_ = gl.getUniformLocation(program, 'centerPicking');
    this.radiusSquaredUnif_ = gl.getUniformLocation(program, 'radiusSquared');

    if (this.type_ >= Shader.mode.MATERIAL)
      this.reflectionTexUnif_ = gl.getUniformLocation(program, 'refTex');

    gl.detachShader(program, this.fragmentShader_);
    gl.deleteShader(this.fragmentShader_);
    gl.detachShader(program, this.vertexShader_);
    gl.deleteShader(this.vertexShader_);
  },

  /** Load vertex and fragment shaders */
  loadShaders: function (vertex, fragment)
  {
    var gl = this.gl_;
    this.vertexShader_ = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vertexShader_, vertex);
    gl.compileShader(this.vertexShader_);
    this.fragmentShader_ = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader_, fragment);
    gl.compileShader(this.fragmentShader_);
  }
};