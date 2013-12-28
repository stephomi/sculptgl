'use strict';

function Render(gl)
{
  this.gl_ = gl; //webgl context
  this.shaderType_ = Render.mode.PHONG; //type of shader

  this.vertexBuffer_ = null; //vertices buffer
  this.normalBuffer_ = null; //normals buffer
  this.colorBuffer_ = null; //colors buffer
  this.indexBuffer_ = null; //indexes buffer
  this.reflectionLoc_ = null; //texture reflection

  this.shaderProgram_ = null; //program shader
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

  this.lineOriginUnif_ = null; //line origin uniform location
  this.lineNormalUnif_ = null; //line normal uniform location

  this.reflectionTexUnif_ = null; //reflection texture uniform location

  this.cacheDrawArraysV_ = null; //cache array for vertices
  this.cacheDrawArraysN_ = null; //cache array for normals
}

//the rendering mode
Render.mode = {
  PHONG: 0,
  TRANSPARENCY: 1,
  WIREFRAME: 2,
  NORMAL: 3,
  MATERIAL: 4
};

Render.prototype = {
  /** Update the shaders on the mesh, load the texture(s) first if the shaders need it */
  updateShaders: function (shaderType, textures, shaders)
  {
    var gl = this.gl_;
    this.shaderType_ = shaderType;
    gl.deleteProgram(this.shaderProgram_);
    if (shaderType >= Render.mode.MATERIAL)
      this.reflectionLoc_ = textures[shaderType];
    this.initShaders(shaders);
  },

  /** Initialize the shaders on the mesh */
  initShaders: function (shaders)
  {
    var gl = this.gl_;
    switch (this.shaderType_)
    {
    case Render.mode.PHONG:
      this.loadShaders(shaders.phongVertex, shaders.phongFragment);
      break;
    case Render.mode.WIREFRAME:
      this.loadShaders(shaders.wireframeVertex, shaders.wireframeFragment);
      break;
    case Render.mode.TRANSPARENCY:
      this.loadShaders(shaders.transparencyVertex, shaders.transparencyFragment);
      break;
    case Render.mode.NORMAL:
      this.loadShaders(shaders.normalVertex, shaders.normalFragment);
      break;
    default:
      this.loadShaders(shaders.reflectionVertex, shaders.reflectionFragment);
      break;
    }
    this.shaderProgram_ = gl.createProgram();
    var shaderProgram = this.shaderProgram_;

    gl.attachShader(shaderProgram, this.vertexShader_);
    gl.attachShader(shaderProgram, this.fragmentShader_);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    this.vertexAttrib_ = gl.getAttribLocation(this.shaderProgram_, 'vertex');
    this.normalAttrib_ = gl.getAttribLocation(this.shaderProgram_, 'normal');
    if (this.shaderType_ !== Render.mode.NORMAL && this.shaderType_ !== Render.mode.WIREFRAME)
      this.colorAttrib_ = gl.getAttribLocation(this.shaderProgram_, 'color');

    this.mvpMatrixUnif_ = gl.getUniformLocation(shaderProgram, 'mvpMat');
    this.mvMatrixUnif_ = gl.getUniformLocation(shaderProgram, 'mvMat');
    this.normalMatrixUnif_ = gl.getUniformLocation(shaderProgram, 'nMat');
    this.centerPickingUnif_ = gl.getUniformLocation(shaderProgram, 'centerPicking');
    this.radiusSquaredUnif_ = gl.getUniformLocation(shaderProgram, 'radiusSquared');

    this.lineOriginUnif_ = gl.getUniformLocation(shaderProgram, 'lineOrigin');
    this.lineNormalUnif_ = gl.getUniformLocation(shaderProgram, 'lineNormal');

    if (this.shaderType_ >= Render.mode.MATERIAL)
      this.reflectionTexUnif_ = gl.getUniformLocation(shaderProgram, 'refTex');

    gl.detachShader(shaderProgram, this.fragmentShader_);
    gl.deleteShader(this.fragmentShader_);
    gl.detachShader(shaderProgram, this.vertexShader_);
    gl.deleteShader(this.vertexShader_);
  },

  /** Load vertex and fragment shaders */
  loadShaders: function (vertex, fragment)
  {
    var gl = this.gl_;
    this.vertexShader_ = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vertexShader_, '\n' + vertex + '\n');
    gl.compileShader(this.vertexShader_);
    this.fragmentShader_ = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader_, fragment);
    gl.compileShader(this.fragmentShader_);
  },

  /** Initialize Vertex Buffer Object (VBO) */
  initBuffers: function (vAr, nAr, cAr, iAr)
  {
    var gl = this.gl_;
    this.vertexBuffer_ = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, vAr, gl.DYNAMIC_DRAW);

    this.normalBuffer_ = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, nAr, gl.DYNAMIC_DRAW);

    this.colorBuffer_ = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cAr, gl.DYNAMIC_DRAW);

    this.indexBuffer_ = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iAr, gl.STATIC_DRAW);
  },

  /** Render the mesh */
  render: function (camera, picking, matTransform, lengthIndexArray, center, lineOrigin, lineNormal)
  {
    var gl = this.gl_;
    gl.useProgram(this.shaderProgram_);

    var centerPicking = picking.interPoint_;
    var radiusSquared = picking.rWorldSqr_;
    var mvMatrix = mat4.create();
    mat4.mul(mvMatrix, camera.view_, matTransform);
    var mvpMatrix = mat4.create();
    mat4.mul(mvpMatrix, camera.proj_, mvMatrix);

    gl.enableVertexAttribArray(this.vertexAttrib_);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.vertexAttribPointer(this.vertexAttrib_, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.normalAttrib_);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    if (this.shaderType_ === Render.mode.WIREFRAME)
      gl.vertexAttribPointer(this.normalAttrib_, 4, gl.FLOAT, false, 0, 0);
    else
      gl.vertexAttribPointer(this.normalAttrib_, 3, gl.FLOAT, false, 0, 0);

    if (this.shaderType_ !== Render.mode.WIREFRAME && this.shaderType_ !== Render.mode.NORMAL)
    {
      gl.enableVertexAttribArray(this.colorAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
      gl.vertexAttribPointer(this.colorAttrib_, 3, gl.FLOAT, false, 0, 0);
    }

    gl.uniformMatrix4fv(this.mvMatrixUnif_, false, mvMatrix);
    gl.uniformMatrix4fv(this.mvpMatrixUnif_, false, mvpMatrix);
    gl.uniformMatrix3fv(this.normalMatrixUnif_, false, mat3.normalFromMat4(mat3.create(), mvMatrix));
    gl.uniform3fv(this.centerPickingUnif_, vec3.transformMat4([0, 0, 0], centerPicking, mvMatrix));
    gl.uniform1f(this.radiusSquaredUnif_, radiusSquared);

    gl.uniform2fv(this.lineOriginUnif_, lineOrigin);
    gl.uniform2fv(this.lineNormalUnif_, lineNormal);

    switch (this.shaderType_)
    {
    case Render.mode.PHONG:
      this.drawBuffer(lengthIndexArray);
      break;
    case Render.mode.TRANSPARENCY:
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      this.drawBuffer(lengthIndexArray);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      break;
    case Render.mode.WIREFRAME:
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
      break;
    case Render.mode.NORMAL:
      this.drawBuffer(lengthIndexArray);
      break;
    default:
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.reflectionLoc_);
      gl.uniform1i(this.reflectionTexUnif_, 0);
      this.drawBuffer(lengthIndexArray);
      break;
    }
  },

  /** Draw buffer */
  drawBuffer: function (lengthIndexArray)
  {
    var gl = this.gl_;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
    gl.drawElements(gl.TRIANGLES, lengthIndexArray, SculptGL.elementIndexType, 0);
  },

  /** Update buffers */
  updateBuffers: function (vAr, nAr, cAr, iAr, nbTriangles)
  {
    if (this.shaderType_ === Render.mode.WIREFRAME)
    {
      this.makeWireframeBuffers(vAr, nAr, iAr, nbTriangles);
      return;
    }
    var gl = this.gl_;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, vAr, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, nAr, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cAr, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iAr, gl.STATIC_DRAW);
  },

  /** Create arrays for the drawArrays function */
  makeWireframeBuffers: function (vAr, nAr, iAr, nbTriangles)
  {
    var gl = this.gl_;

    var cdv = this.cacheDrawArraysV_;
    var cdn = this.cacheDrawArraysN_;
    if (cdv === null || cdv.length <= nbTriangles * 9)
    {
      this.cacheDrawArraysV_ = new Float32Array(nbTriangles * 9 * 1.5);
      this.cacheDrawArraysN_ = new Float32Array(nbTriangles * 12 * 1.5);
      cdv = this.cacheDrawArraysV_;
      cdn = this.cacheDrawArraysN_;
    }

    var i = 0,
      j = 0,
      id = 0;
    var len = nbTriangles * 9;
    for (i = 0; i < len; ++i)
    {
      j = i * 3;
      id = iAr[i] * 3;
      cdv[j] = vAr[id];
      cdv[j + 1] = vAr[id + 1];
      cdv[j + 2] = vAr[id + 2];

      j = i * 4;
      cdn[j] = nAr[id];
      cdn[j + 1] = nAr[id + 1];
      cdn[j + 2] = nAr[id + 2];
      cdn[j + 3] = i % 3;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cdv, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cdn, gl.DYNAMIC_DRAW);
  }
};