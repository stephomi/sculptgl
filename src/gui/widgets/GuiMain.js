define([
  'gui/widgets/Sidebar',
  'gui/widgets/Topbar'
], function (Sidebar, Topbar) {

  'use strict';

  var GuiMain = function (canvas, callbackResize) {
    this.domMain = document.createElement('div');
    this.domCanvas = canvas;

    this.callbackResize = callbackResize;
    if (this.domCanvas) {
      this.domCanvas.width = window.innerWidth;
      this.domCanvas.height = window.innerHeight;
    }
    this.cbResize_ = this._onWindowResize.bind(this);

    document.body.appendChild(this.domMain);
    this.leftSidebar = undefined;
    this.rightSidebar = undefined;
    this.topbar = undefined;

    window.addEventListener('resize', this._onWindowResize.bind(this), false);
  };

  GuiMain.prototype = {
    _onWindowResize: function () {
      if (this.domCanvas) {
        this.domCanvas.width = window.innerWidth;
        this.domCanvas.height = window.innerHeight;
        if (this.leftSidebar)
          this.leftSidebar._updateCanvasPosition(this.domCanvas);
        if (this.rightSidebar)
          this.rightSidebar._updateCanvasPosition(this.domCanvas);
        if (this.topbar)
          this.topbar._updateCanvasPosition(this.domCanvas);
      }
      if (this.callbackResize)
        this.callbackResize();
    },
    _updateSidebarsPosition: function () {
      if (!this.topbar) return;
      var off = this.topbar.domTopbar.offsetHeight;
      if (this.leftSidebar)
        this.leftSidebar._setTop(off);
      if (this.rightSidebar)
        this.rightSidebar._setTop(off);
    },
    addLeftSidebar: function () {
      this.leftSidebar = new Sidebar(this.cbResize_);
      var domSide = this.leftSidebar.domSidebar;
      this.domMain.appendChild(domSide);
      this.domMain.appendChild(this.leftSidebar.domResize);

      this._updateSidebarsPosition();
      this.leftSidebar._updateCanvasPosition(this.domCanvas);
      return this.leftSidebar;
    },
    addRightSidebar: function () {
      this.rightSidebar = new Sidebar(this.cbResize_);
      var domSide = this.rightSidebar.domSidebar;
      this.domMain.appendChild(domSide);
      this.domMain.appendChild(this.rightSidebar.domResize);

      this.rightSidebar._onTheRight();
      this._updateSidebarsPosition();
      this.rightSidebar._updateCanvasPosition(this.domCanvas);
      return this.rightSidebar;
    },
    addTopbar: function () {
      this.topbar = new Topbar();
      this.domMain.appendChild(this.topbar.domTopbar);

      this._updateSidebarsPosition();
      this.topbar._updateCanvasPosition(this.domCanvas);
      return this.topbar;
    }
  };

  return GuiMain;
});