define([
  'gui/widgets/GuiUtils',
  'gui/widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  'use strict';

  var Button = function (name, callbackOrObject, key) {
    var callback = key ? callbackOrObject[key].bind(callbackOrObject) : callbackOrObject;

    this.domButton = document.createElement('button');
    this.domButton.className = 'gui-button';
    this.domButton.innerHTML = name || '';
    this.domButton.addEventListener('click', this._onClick.bind(this));

    this.setCallback(callback);
  };

  Button.prototype = {
    _onClick: function () {
      if (this.callback) this.callback();
    }
  };

  GuiUtils.makeProxy(BaseWidget, Button);

  return Button;
});