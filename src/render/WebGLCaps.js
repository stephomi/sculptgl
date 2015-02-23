define([], function () {

  'use strict';

  // see osgjs WebGLCaps
  var WebGLCaps = {};
  WebGLCaps.gl_ = null;
  WebGLCaps.checkRTT_ = {};
  WebGLCaps.webGLExtensions_ = {};

  WebGLCaps.HALF_FLOAT = WebGLCaps.HALF_FLOAT_OES = 0x8D61;

  WebGLCaps.checkRTTSupport = function (typeFloat, typeTexture) {
    var gl = WebGLCaps.gl_;
    if (gl === undefined)
      return false;
    var key = typeFloat + ',' + typeTexture;
    if (WebGLCaps.checkRTT_[key] !== undefined)
      return WebGLCaps.checkRTT_[key];
    // from http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/#how-can-i-detect-if-i-can-render-to-floating-point-textures

    // setup the texture
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, typeFloat, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, typeTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, typeTexture);

    // setup the framebuffer
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    // check the framebuffer
    var status = WebGLCaps.checkRTT_[key] = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

    // cleanup
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return status;
  };
  WebGLCaps.hasRTTLinearHalfFloat = function () {
    return WebGLCaps.webGLExtensions_.OES_texture_half_float_linear && WebGLCaps.checkRTTSupport(WebGLCaps.HALF_FLOAT, WebGLCaps.gl_.LINEAR);
  };
  WebGLCaps.hasRTTLinearFloat = function () {
    return WebGLCaps.webGLExtensions_.OES_texture_float_linear && WebGLCaps.checkRTTSupport(WebGLCaps.gl_.FLOAT, WebGLCaps.gl_.LINEAR);
  };
  WebGLCaps.hasRTTHalfFloat = function () {
    return WebGLCaps.webGLExtensions_.OES_texture_half_float && WebGLCaps.checkRTTSupport(WebGLCaps.HALF_FLOAT, WebGLCaps.gl_.NEAREST);
  };
  WebGLCaps.hasRTTFloat = function () {
    return WebGLCaps.webGLExtensions_.OES_texture_float && WebGLCaps.checkRTTSupport(WebGLCaps.gl_.FLOAT, WebGLCaps.gl_.NEAREST);
  };
  WebGLCaps.getWebGLExtension = function (str) {
    return WebGLCaps.webGLExtensions_[str];
  };
  WebGLCaps.getWebGLExtensions = function () {
    return WebGLCaps.webGLExtensions_;
  };
  WebGLCaps.initWebGLExtensions = function (gl) {
    WebGLCaps.gl_ = gl;
    var supported = gl.getSupportedExtensions();
    var ext = WebGLCaps.webGLExtensions_;
    // we load all the extensions
    for (var i = 0, len = supported.length; i < len; ++i) {
      var sup = supported[i];
      ext[sup] = gl.getExtension(sup);
    }
  };

  return WebGLCaps;
});