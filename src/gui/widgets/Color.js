define([
  'gui/widgets/GuiUtils',
  'gui/widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  'use strict';

  var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

  var Color = function (valOrObject, callbackOrKey) {
    var value = this._getInitialValue(valOrObject, callbackOrKey);
    var callback = this._getCheckCallback(valOrObject, callbackOrKey);
    if (value) value = GuiUtils.getValidColor(value);
    else value = [1.0, 0.0, 0.0];

    // container
    this.domColor = document.createElement('div');
    this.domColor.className = 'gui-widget-color';

    // input text
    this.domInputColor = document.createElement('input');
    this.domPopup = document.createElement('div');

    // hue picker
    this.domHue = document.createElement('div');
    this.domHue.className = 'gui-color-hue';
    this.domHueKnob = document.createElement('div');
    this.domHueKnob.className = 'gui-knob-hue';

    // saturation picker
    this.domSaturation = document.createElement('div');
    this.domSaturation.className = 'gui-color-saturation';
    var zAlphaSat = document.createElement('div');
    this.domSaturation.appendChild(zAlphaSat);
    this.domSaturationKnob = document.createElement('div');
    this.domSaturationKnob.className = 'gui-knob-saturation';

    this.domHue.appendChild(this.domHueKnob);
    this.domPopup.appendChild(this.domSaturationKnob);
    this.domPopup.appendChild(this.domSaturation);
    this.domPopup.appendChild(this.domHue);
    this.domColor.appendChild(this.domInputColor);
    this.domColor.appendChild(this.domPopup);

    this._hueGradient(this.domHue);
    this._linearGradient(zAlphaSat, 'top', 'rgba(0,0,0,0)', '#000');

    this.domColor.addEventListener('keydown', this._onInputDown.bind(this));
    this.domSaturation.addEventListener('mousedown', this._onSaturationDown.bind(this));
    this.domHue.addEventListener('mousedown', this._onHueDown.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));
    window.addEventListener('mouseout', this._onMouseUp.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));

    this.editHue = this.editSaturation = false;
    this.saturationWidth = this.saturationHeight = this.hueHeight = 100;
    this.setValue(value);
    this.setCallback(callback);
  };

  Color.prototype = {
    _onInputDown: function (ev) {
      ev.stopPropagation();
      if (ev.keyCode === 13)
        this.setValue(GuiUtils.hexToRgb(ev.target.value));
    },
    _onUpdateSaturation: function (ev) {
      var rect = this.domSaturation.getBoundingClientRect();
      var hsv = GuiUtils.rgbToHsv(this.getValue());
      hsv[1] = Math.min(1.0, Math.max(0.0, (ev.clientX - rect.left) / rect.width));
      hsv[2] = Math.min(1.0, Math.max(0.0, 1.0 - (ev.clientY - rect.top) / rect.width));
      this.setValue(GuiUtils.hsvToRgb(hsv), false, true);
      this._onSaturationEdit(hsv);
    },
    _onUpdateHue: function (ev) {
      var rect = this.domHue.getBoundingClientRect();
      var hsv = GuiUtils.rgbToHsv(this.getValue());
      hsv[0] = Math.min(1.0, Math.max(0.0, 1.0 - (ev.clientY - rect.top) / rect.height));
      this.setValue(GuiUtils.hsvToRgb(hsv), false, true);
      this._onHueEdit(hsv);
    },
    _onSaturationEdit: function (hsv) {
      this.domSaturationKnob.style.marginLeft = this.saturationWidth * hsv[1] - 7 + 'px';
      this.domSaturationKnob.style.marginTop = this.saturationHeight * (1.0 - hsv[2]) - 7 + 'px';
    },
    _onHueEdit: function (hsv) {
      hsv[1] = hsv[2] = 1.0;
      this._linearGradient(this.domSaturation, 'left', '#fff', GuiUtils.getStrColor(GuiUtils.hsvToRgb(hsv)));
      this.domHueKnob.style.marginTop = (1.0 - hsv[0]) * this.hueHeight + 'px';
    },
    _onMouseMove: function (ev) {
      if (!this.editSaturation && !this.editHue) return;
      if (this.editSaturation) return this._onUpdateSaturation(ev);
      else return this._onUpdateHue(ev);
    },
    _onSaturationDown: function (ev) {
      this.editSaturation = true;
      this._onMouseMove(ev);
    },
    _onHueDown: function (ev) {
      this.editHue = true;
      this._onMouseMove(ev);
    },
    _onMouseUp: function () {
      this.editHue = this.editSaturation = false;
    },
    _hueGradient: function (dom) {
      dom.style.background = '';
      for (var i = 0, l = vendors.length; i < l; ++i)
        dom.style.cssText += 'background: ' + vendors[i] + 'linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
    },
    _linearGradient: function (dom, dir, col1, col2) {
      dom.style.background = '';
      for (var i = 0, l = vendors.length; i < l; ++i)
        dom.style.cssText += 'background: ' + vendors[i] + 'linear-gradient(' + dir + ', ' + col1 + ' 0%, ' + col2 + ' 100%);';
    },
    setValue: function (color, ignoreCB, ignoreUI) {
      var hex = GuiUtils.rgbToHex(color);
      this.domInputColor.value = this.domInputColor.style.background = hex;
      // color of text
      var hsv = GuiUtils.rgbToHsv(color);
      this.domInputColor.style.color = this.domSaturationKnob.style.borderColor = (hsv[2] < 0.5 || hsv[1] > 0.5) ? '#fff' : '#000';
      if (!ignoreUI) {
        this._onSaturationEdit(hsv);
        this._onHueEdit(hsv);
      }
      if (!ignoreCB && this.callback) this.callback(color);
    },
    getValue: function () {
      return GuiUtils.hexToRgb(this.domInputColor.value);
    }
  };

  GuiUtils.makeProxy(BaseWidget, Color);

  return Color;
});