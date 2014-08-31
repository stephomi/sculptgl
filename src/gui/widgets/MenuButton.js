define([
  'gui/widgets/GuiUtils',
  'gui/widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  'use strict';

  var MenuButton = function (callbackOrObject, shortcutOrKey, shortcut) {
    var callback = callbackOrObject;
    if (callback && typeof callback !== 'function') callback = callbackOrObject[shortcutOrKey].bind(callbackOrObject);
    else shortcut = shortcutOrKey;

    this.domSpan = document.createElement('span');
    this.domSpan.className = 'shortcut';
    this.domSpan.innerHTML = shortcut || '';

    this.setCallback(callback);
  };

  MenuButton.prototype = {
    _setDomContainer: function (container) {
      this.domContainer = container;
      container.addEventListener('click', this._onClick.bind(this));
    },
    _onClick: function () {
      if (this.callback) this.callback();
    }
  };

  GuiUtils.makeProxy(BaseWidget, MenuButton);

  return MenuButton;
});