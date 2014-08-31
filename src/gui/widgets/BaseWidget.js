define([], function () {

  'use strict';

  var BaseWidget = function () {};

  BaseWidget.prototype = {
    _getInitialValue: function (valOrObject, callbackOrKey) {
      if (typeof callbackOrKey !== 'string') return valOrObject;
      return valOrObject[callbackOrKey];
    },
    _getCheckCallback: function (valOrObject, callbackOrKey) {
      if (typeof callbackOrKey !== 'string') return callbackOrKey;
      return function (val) {
        valOrObject[callbackOrKey] = val;
      };
    },
    _setDomContainer: function (container) {
      this.domContainer = container;
    },
    setCallback: function (callback) {
      this.callback = callback;
    },
    setVisibility: function (visible) {
      if (!this.domContainer) return;
      this.domContainer.hidden = !visible;
    }
  };

  return BaseWidget;
});