define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var Render = require('mesh/Render');
  var Buffer = require('render/Buffer');

  var LowRender = function (render) {
    this._renderOrigin = render; // the base render

    var gl = render.getGL(); // webgl context
    this._indexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // index buffer
    this._wireframeBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW); // wireframe buffer
  };

  LowRender.prototype = {
    /** Return base render */
    getRenderOrigin: function () {
      return this._renderOrigin;
    },
    /** Return index buffer */
    getIndexBuffer: function () {
      return this._indexBuffer;
    },
    /** Return wireframe buffer */
    getWireframeBuffer: function () {
      return this._wireframeBuffer;
    },
    /** No flat shading because we can't share vertices buffer with higher resolution */
    isUsingDrawArrays: function () {
      return false;
    },
    /** Updates buffer */
    updateBuffers: function (mesh) {
      this.getIndexBuffer().update(mesh.getTriangles());
      this.getWireframeBuffer().update(mesh.getWireframe());
    },
    /** Render the mesh */
    render: function (main) {
      var ro = this.getRenderOrigin();
      ro._shader.draw(this, main);
      if (ro.getShowWireframe())
        ro._shaderWireframe.draw(this, main);
    },
    /** Free gl memory */
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