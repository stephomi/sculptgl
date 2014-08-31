define([
  'gui/widgets/Menu',
  'gui/widgets/EditStyle'
], function (Menu, EditStyle) {

  'use strict';

  var Topbar = function () {
    this.domTopbar = document.createElement('div');
    this.domTopbar.className = 'gui-topbar';

    this.domUl = document.createElement('ul');
    this.domTopbar.appendChild(this.domUl);

    this.uiExtra = {};
  };

  Topbar.prototype = {
    _updateCanvasPosition: function (canvas) {
      var h = this.domTopbar.offsetHeight;
      canvas.style.top = h + 'px';
      canvas.height -= h;
    },
    _onChangeColor: function (callback, color) {
      callback(color);
      this.uiExtra.overallColor.setValue(EditStyle._curWidgetColor, true);
      this.uiExtra.widgetColor.setValue(EditStyle._curWidgetColor, true);
      this.uiExtra.backColor.setValue(EditStyle._curBackgroundColor, true);
      this.uiExtra.textColor.setValue(EditStyle._curTextColor, true);
    },
    addMenu: function (name) {
      var menu = new Menu();
      var li = document.createElement('li');
      li.innerHTML = name || '';
      this.domUl.appendChild(li);
      li.appendChild(menu.domUl);
      return menu;
    },
    addExtra: function () {
      var cb = this._onChangeColor;
      var menu = this.addMenu('Extra UI');
      var ext = this.uiExtra;
      menu.addTitle('Overall');
      ext.overallColor = menu.addColor('', EditStyle._curWidgetColor, cb.bind(this, EditStyle.changeOverallColor));

      menu.addTitle('Advanced');
      ext.widgetColor = menu.addColor('Widget', EditStyle._curWidgetColor, cb.bind(this, EditStyle.changeWidgetsColor));
      ext.backColor = menu.addColor('Back', EditStyle._curBackgroundColor, cb.bind(this, EditStyle.changeBackgroundColor));
      ext.textColor = menu.addColor('Text', EditStyle._curTextColor, cb.bind(this, EditStyle.changeTextColor));
      ext.showBorder = menu.addCheckbox('Border', EditStyle._curShowBorder, EditStyle.changeDisplayBoorder);
      return menu;
    }
  };

  return Topbar;
});