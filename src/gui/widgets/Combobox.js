define([
  'gui/widgets/GuiUtils',
  'gui/widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  'use strict';

  var Combobox = function ( valOrObject, callbackOrKey, options) {
    var value = this._getInitialValue(valOrObject, callbackOrKey);
    var callback = this._getCheckCallback(valOrObject, callbackOrKey);
    options = options || {};
    value = value || options[0];

    this.domSelect = document.createElement('select');
    this.domSelect.className = 'gui-select';
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; ++i) {
      var opt = document.createElement('option');
      opt.innerHTML = options[keys[i]];
      opt.value = keys[i];
      this.domSelect.appendChild(opt);
    }

    this.domSelect.addEventListener('change', this._onChange.bind(this));
    this.setValue(value);
    this.setCallback(callback);
  };

  Combobox.prototype = {
    _onChange: function (ev) {
      this.setValue(ev.target.value);
    },
    setValue: function (val, ignoreCB) {
      this.domSelect.value = val;
      if (!ignoreCB && this.callback) this.callback(val);
    },
    getValue: function () {
      return this.domSelect.value;
    }
  };

  GuiUtils.makeProxy(BaseWidget, Combobox);

  return Combobox;
});