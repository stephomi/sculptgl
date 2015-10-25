define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Render = require('mesh/Render');
  var Shader = require('render/ShaderLib');
  var Buffer = require('render/Buffer');

  var LowRender = function (render) {
    this._renderOrigin = render; // the base render

    var gl = render.getGL(); // webgl context
    this._indexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // index buffer
    this._wireframeBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // wireframe buffer
  };

  LowRender.prototype = {
    getRenderOrigin: function () {
      return this._renderOrigin;
    },
    getIndexBuffer: function () {
      return this._indexBuffer;
    },
    getWireframeBuffer: function () {
      return this._wireframeBuffer;
    },
    /** No flat shading because we can't share vertices buffer with higher resolution */
    isUsingDrawArrays: function () {
      return false;
    },
    updateBuffers: function (mesh) {
      this.getIndexBuffer().update(mesh.getTriangles());
      this.getWireframeBuffer().update(mesh.getWireframe());
    },
    render: function (main) {
      Shader[this.getShaderName()].getOrCreate(this.getGL()).draw(this, main);
    },
    renderWireframe: function (main) {
      Shader.WIREFRAME.getOrCreate(this.getGL()).draw(this, main);
    },
    release: function () {
      this.getIndexBuffer().release();
      this.getWireframeBuffer().release();
    }
  };

  Utils.makeProxy(Render, LowRender, function (proto) {
    return function () {
      return proto.apply(this.getRenderOrigin(), arguments);
    };
  });

  module.exports = LowRender;
});