'use strict';

function Render(gl, mesh)
{
  this.mesh_ = mesh; //webgl context
  this.gl_ = gl; //webgl context
  this.shader_ = new Shader(gl); //the program shader

  this.flatShading_ = false; //use of drawArrays vs drawElements

  this.vertexBuffer_ = null; //vertices buffer
  this.normalBuffer_ = null; //normals buffer
  this.colorBuffer_ = null; //colors buffer
  this.indexBuffer_ = null; //indexes buffer
  this.reflectionLoc_ = null; //texture reflection

  this.cacheDrawArraysV_ = null; //cache array for vertices
  this.cacheDrawArraysN_ = null; //cache array for normals
  this.cacheDrawArraysC_ = null; //cache array for colors
}

Render.prototype = {
  /** Update the shaders on the mesh, load the texture(s) first if the shaders need it */
  updateShaders: function (shaderType, textures, shaders)
  {
    if (shaderType >= Shader.mode.MATERIAL)
      this.reflectionLoc_ = textures[shaderType];
    this.shader_.type_ = shaderType;
    this.shader_.init(shaders);
  },

  /** Initialize Vertex Buffer Object (VBO) */
  initBuffers: function ()
  {
    var gl = this.gl_;
    this.vertexBuffer_ = gl.createBuffer();
    this.normalBuffer_ = gl.createBuffer();
    this.colorBuffer_ = gl.createBuffer();
    this.indexBuffer_ = gl.createBuffer();
  },

  /** Render the mesh */
  render: function (camera, picking, lineOrigin, lineNormal)
  {
    var gl = this.gl_;
    var shader = this.shader_;
    var lengthIndexArray = this.mesh_.triangles_.length * 3;

    gl.useProgram(shader.program_);

    var centerPicking = picking.interPoint_;
    var radiusSquared = picking.rWorldSqr_;
    var mvMatrix = mat4.create();
    mat4.mul(mvMatrix, camera.view_, this.mesh_.matTransform_);
    var mvpMatrix = mat4.create();
    mat4.mul(mvpMatrix, camera.proj_, mvMatrix);

    gl.enableVertexAttribArray(shader.vertexAttrib_);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.vertexAttribPointer(shader.vertexAttrib_, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(shader.normalAttrib_);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    if (shader.type_ === Shader.mode.WIREFRAME)
      gl.vertexAttribPointer(shader.normalAttrib_, 4, gl.FLOAT, false, 0, 0);
    else
      gl.vertexAttribPointer(shader.normalAttrib_, 3, gl.FLOAT, false, 0, 0);

    if (shader.type_ !== Shader.mode.WIREFRAME && shader.type_ !== Shader.mode.NORMAL)
    {
      gl.enableVertexAttribArray(shader.colorAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
      gl.vertexAttribPointer(shader.colorAttrib_, 3, gl.FLOAT, false, 0, 0);
    }

    gl.uniformMatrix4fv(shader.mvMatrixUnif_, false, mvMatrix);
    gl.uniformMatrix4fv(shader.mvpMatrixUnif_, false, mvpMatrix);
    gl.uniformMatrix3fv(shader.normalMatrixUnif_, false, mat3.normalFromMat4(mat3.create(), mvMatrix));
    gl.uniform3fv(shader.centerPickingUnif_, vec3.transformMat4([0, 0, 0], centerPicking, mvMatrix));
    gl.uniform1f(shader.radiusSquaredUnif_, radiusSquared);

    gl.uniform2fv(shader.lineOriginUnif_, lineOrigin);
    gl.uniform2fv(shader.lineNormalUnif_, lineNormal);

    switch (shader.type_)
    {
    case Shader.mode.PHONG:
      this.drawBuffer(lengthIndexArray);
      break;
    case Shader.mode.TRANSPARENCY:
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      this.drawBuffer(lengthIndexArray);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      break;
    case Shader.mode.WIREFRAME:
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
      break;
    case Shader.mode.NORMAL:
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
    if (this.flatShading_ === true)
      gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
    else
    {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
      gl.drawElements(gl.TRIANGLES, lengthIndexArray, SculptGL.elementIndexType, 0);
    }
  },

  /** Update buffers */
  updateBuffers: function ()
  {
    if (this.shader_.type_ === Shader.mode.WIREFRAME)
      this.makeWireframeBuffers();
    else if (this.flatShading_ === true)
      this.flatShadingBuffers();
    else
    {
      var gl = this.gl_;
      var mesh = this.mesh_;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexArray_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normalArray_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.colorArray_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indexArray_, gl.STATIC_DRAW);
    }
  },

  /** Create arrays for the drawArrays function */
  flatShadingBuffers: function ()
  {
    var gl = this.gl_;
    var mesh = this.mesh_;
    var triangles = mesh.triangles_;
    var nbTriangles = triangles.length;
    var vAr = mesh.vertexArray_;
    var cAr = mesh.colorArray_;
    var iAr = mesh.indexArray_;

    var cdv = this.cacheDrawArraysV_;
    var cdn = this.cacheDrawArraysN_;
    var cdc = this.cacheDrawArraysC_;
    if (cdv === null || cdv.length <= nbTriangles * 9)
    {
      this.cacheDrawArraysV_ = new Float32Array(nbTriangles * 9 * 1.5);
      cdv = this.cacheDrawArraysV_;
    }
    if (cdn === null || cdn.length <= nbTriangles * 9)
    {
      this.cacheDrawArraysN_ = new Float32Array(nbTriangles * 9 * 1.5);
      cdn = this.cacheDrawArraysN_;
    }
    if (cdc === null || cdc.length <= nbTriangles * 9)
    {
      this.cacheDrawArraysC_ = new Float32Array(nbTriangles * 9 * 1.5);
      cdc = this.cacheDrawArraysC_;
    }

    var i = 0,
      j = 0,
      id = 0;
    var len = nbTriangles * 3;
    for (i = 0; i < len; ++i)
    {
      j = i * 3;
      id = iAr[i] * 3;
      cdv[j] = vAr[id];
      cdv[j + 1] = vAr[id + 1];
      cdv[j + 2] = vAr[id + 2];

      var normal = triangles[Math.floor(i / 3)].normal_;
      cdn[j] = normal[0];
      cdn[j + 1] = normal[1];
      cdn[j + 2] = normal[2];

      cdc[j] = cAr[id];
      cdc[j + 1] = cAr[id + 1];
      cdc[j + 2] = cAr[id + 2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cdv, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cdn, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, cdc, gl.DYNAMIC_DRAW);
  },

  /** Create arrays for the drawArrays function */
  makeWireframeBuffers: function ()
  {
    var gl = this.gl_;
    var mesh = this.mesh_;
    var nbTriangles = mesh.triangles_.length;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var iAr = mesh.indexArray_;

    var cdv = this.cacheDrawArraysV_;
    var cdn = this.cacheDrawArraysN_;
    if (cdv === null || cdv.length <= nbTriangles * 9)
    {
      this.cacheDrawArraysV_ = new Float32Array(nbTriangles * 9 * 1.5);
      cdv = this.cacheDrawArraysV_;
    }
    if (cdn === null || cdn.length <= nbTriangles * 12)
    {
      this.cacheDrawArraysN_ = new Float32Array(nbTriangles * 12 * 1.5);
      cdn = this.cacheDrawArraysN_;
    }

    var i = 0,
      j = 0,
      id = 0;
    var len = nbTriangles * 3;
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