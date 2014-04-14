define([
  'lib/glMatrix',
  'misc/Utils',
  'object/Shader'
], function (glm, Utils, Shader) {

  'use strict';

  var vec3 = glm.vec3;
  var mat3 = glm.mat3;
  var mat4 = glm.mat4;

  function Render(gl, mesh) {
    this.multimesh_ = mesh; //webgl context
    this.gl_ = gl; //webgl context
    this.shader_ = new Shader(gl); //the program shader
    this.shaderWireframe_ = new Shader(gl); //the program shader for the wireframe

    this.flatShading_ = false; //use of drawArrays vs drawElements
    this.showWireframe_ = true; //show wireframe

    this.vertexBuffer_ = null; //vertices buffer
    this.normalBuffer_ = null; //normals buffer
    this.colorBuffer_ = null; //colors buffer
    this.indexBuffer_ = null; //indexes buffer
    this.wireframeBuffer_ = null; //wireframe buffer
    this.reflectionLoc_ = null; //texture reflection
  }

  Render.prototype = {
    /** Creates the wireframe shader */
    initShaderWireframe: function (shaders) {
      this.shaderWireframe_.type_ = Shader.mode.WIREFRAME;
      this.shaderWireframe_.init(shaders);
    },
    /** Update the shaders on the mesh, load the texture(s) first if the shaders need it */
    updateShaders: function (shaderType, textures, shaders) {
      if (shaderType >= Shader.mode.MATERIAL)
        this.reflectionLoc_ = textures[shaderType];
      this.shader_.type_ = shaderType;
      this.shader_.init(shaders);
    },
    /** Initialize Vertex Buffer Object (VBO) */
    initBuffers: function () {
      var gl = this.gl_;
      this.vertexBuffer_ = gl.createBuffer();
      this.normalBuffer_ = gl.createBuffer();
      this.colorBuffer_ = gl.createBuffer();
      this.indexBuffer_ = gl.createBuffer();
      this.wireframeBuffer_ = gl.createBuffer();
    },
    /** Render the mesh */
    render: function (camera, picking) {
      var gl = this.gl_;
      var shader = this.shader_;
      var lengthIndexArray = this.multimesh_.getCurrent().getNbTriangles() * 3;

      gl.useProgram(shader.program_);

      var centerPicking = picking.interPoint_;
      var radiusSquared = picking.rWorldSqr_;
      var mvMatrix = mat4.create();
      mat4.mul(mvMatrix, camera.view_, this.multimesh_.getMatrix());
      var mvpMatrix = mat4.create();
      mat4.mul(mvpMatrix, camera.proj_, mvMatrix);

      gl.enableVertexAttribArray(shader.vertexAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.vertexAttribPointer(shader.vertexAttrib_, 3, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(shader.normalAttrib_);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.vertexAttribPointer(shader.normalAttrib_, 3, gl.FLOAT, false, 0, 0);

      if (shader.type_ !== Shader.mode.NORMAL) {
        gl.enableVertexAttribArray(shader.colorAttrib_);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
        gl.vertexAttribPointer(shader.colorAttrib_, 3, gl.FLOAT, false, 0, 0);
      }

      gl.uniformMatrix4fv(shader.mvMatrixUnif_, false, mvMatrix);
      gl.uniformMatrix4fv(shader.mvpMatrixUnif_, false, mvpMatrix);
      gl.uniformMatrix3fv(shader.nMatrixUnif_, false, mat3.normalFromMat4(mat3.create(), mvMatrix));
      gl.uniform3fv(shader.centerPickingUnif_, vec3.transformMat4([0.0, 0.0, 0.0], centerPicking, mvMatrix));
      gl.uniform1f(shader.radiusSquaredUnif_, radiusSquared);

      switch (shader.type_) {
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
      if (this.showWireframe_ === true) {
        var shaderWire = this.shaderWireframe_;
        gl.useProgram(shaderWire.program_);
        gl.enableVertexAttribArray(shaderWire.vertexAttrib_);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
        gl.vertexAttribPointer(shaderWire.vertexAttrib_, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(shaderWire.mvpMatrixUnif_, false, mvpMatrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer_);
        gl.enable(gl.BLEND);
        gl.drawElements(gl.LINES, this.multimesh_.getCurrent().getNbEdges() * 2, Utils.elementIndexType, 0);
        gl.disable(gl.BLEND);
      }
      // bind to null
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },
    /** Draw buffer */
    drawBuffer: function (lengthIndexArray) {
      var gl = this.gl_;
      if (this.flatShading_ === true)
        gl.drawArrays(gl.TRIANGLES, 0, lengthIndexArray);
      else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
        gl.drawElements(gl.TRIANGLES, lengthIndexArray, Utils.elementIndexType, 0);
      }
    },
    /** Update buffers */
    updateBuffers: function (updateColors, updateIndex) {
      if (this.flatShading_ === true)
        this.updateDrawArrays(updateColors);
      else
        this.updateDrawElements(updateColors, updateIndex);
    },
    /** Updates DrawArrays buffers */
    updateDrawArrays: function (updateColors) {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysV_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysN_, gl.DYNAMIC_DRAW);

      if (updateColors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.cacheDrawArraysC_, gl.DYNAMIC_DRAW);
      }
    },
    /** Updates DrawElements buffers */
    updateDrawElements: function (updateColors, updateIndex) {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.verticesXYZ_, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer_);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normalsXYZ_, gl.DYNAMIC_DRAW);

      if (updateColors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer_);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.colorsRGB_, gl.DYNAMIC_DRAW);
      }

      if (updateIndex) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indicesABC_, gl.STATIC_DRAW);
      }
    },
    /** Updates wireframe buffer */
    updateLinesBuffer: function () {
      var gl = this.gl_;
      var mesh = this.multimesh_.getCurrent();
      var lineBuffer = this.flatShading_ ? mesh.cacheDrawArraysWireframe_ : mesh.cacheDrawElementsWireframe_;

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer_);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineBuffer, gl.STATIC_DRAW);
    }
  };

  return Render;
});