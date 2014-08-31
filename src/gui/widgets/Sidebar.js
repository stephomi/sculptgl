define([
  'gui/widgets/Folder'
], function (Folder) {

  'use strict';

  var Sidebar = function (callbackResize) {
    this.domSidebar = document.createElement('div');
    this.domSidebar.className = 'gui-sidebar';

    this.domResize = document.createElement('div');
    this.domResize.className = 'gui-resize';

    this.isDragging = false;
    this.mouseX = 0;
    this.domResize.addEventListener('mousedown', this._onMouseDown.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));

    this.callbackResize = callbackResize;
    this.isOnTheRight = false;
  };

  Sidebar.prototype = {
    _setTop: function (nb) {
      this.domSidebar.style.top = this.domResize.style.top = nb + 'px';
    },
    _onTheRight: function () {
      this.isOnTheRight = true;
      this.domSidebar.style.right = 0;
      this.domSidebar.style.borderRight = 0;
      this.domSidebar.style.borderLeft = 'double';
      this.domSidebar.style.borderColor = 'rgba(255,255,255,0.3)';
      this.domResize.style.left = 'auto';
      this.domResize.style.right = this.domSidebar.offsetWidth + 'px';
      this.domResize.style.marginRight = '-3px';
    },
    _onMouseDown: function (ev) {
      this.isDragging = true;
      this.mouseX = ev.clientX;
    },
    _updateCanvasPosition: function (canvas) {
      var w = this.domSidebar.offsetWidth;
      if (this.isOnTheRight) {
        canvas.width -= w;
      } else {
        canvas.style.left = this.domSidebar.offsetLeft + w + 'px';
        canvas.width -= w;
      }
    },
    _onMouseMove: function (ev) {
      if (this.isDragging === false) return;
      var mouseX = ev.clientX;
      var delta = mouseX - this.mouseX;
      if (this.isOnTheRight) delta = -delta;
      var widthBar = Math.max(50, this.domSidebar.offsetWidth + delta);

      var val = widthBar + 'px';
      this.domSidebar.style.width = val;
      if (this.isOnTheRight) this.domResize.style.right = this.domSidebar.offsetWidth + 'px';
      else this.domResize.style.left = val;

      this.mouseX = mouseX;
      this.callbackResize();
    },
    _onMouseUp: function () {
      this.isDragging = false;
    },
    setCallbackOnResize: function (callbackResize) {
      this.callbackResize = callbackResize;
    },
    addMenu: function (name) {
      var folder = new Folder(name);
      this.domSidebar.appendChild(folder.domUl);
      return folder;
    }
  };

  return Sidebar;
});