define([
  'gui/widgets/BaseWidget',
  'gui/widgets/Button',
  'gui/widgets/Checkbox',
  'gui/widgets/Color',
  'gui/widgets/Combobox',
  'gui/widgets/Slider'
], function (BaseWidget, Button, Checkbox, Color, Combobox, Slider) {

  'use strict';

  var BaseContainer = function () {};

  // label : 36%
  // slider : bar 52% + margin 2% + input 10%
  // combobox : 64%
  // color : 64%
  BaseContainer.prototype = {
    _addLine: function (name) {
      var domLine = document.createElement('li');
      domLine.innerHTML = name || '';
      this.domUl.appendChild(domLine);
      return domLine;
    },
    _createLabel: function (name) {
      var domLabel = document.createElement('label');
      domLabel.className = 'gui-label-side';
      domLabel.innerHTML = name || '';
      return domLabel;
    },
    addTitle: function (name) {
      var widget = new BaseWidget();
      var domTitle = this._addLine(name);
      domTitle.className = 'group-title';
      widget._setDomContainer(domTitle);
      return widget;
    },
    addCheckbox: function (name, valOrObject, callbackOrKey) {
      var widget = new Checkbox(valOrObject, callbackOrKey);
      var domLine = this._addLine();
      domLine.className += ' gui-pointerOnHover gui-glowOnHover';
      var domLabel = this._createLabel(name);
      domLabel.style.overflow = 'visible';
      domLabel.className += ' gui-pointerOnHover';
      domLine.appendChild(domLabel);
      domLine.appendChild(widget.domCheckbox);
      domLine.appendChild(widget.domLabelCheckbox);
      domLine.addEventListener('mousedown', widget._onMouseDown.bind(widget));
      widget._setDomContainer(domLine);
      return widget;
    },
    addCombobox: function (name, valOrObject, callbackOrKey, options) {
      var widget = new Combobox(valOrObject, callbackOrKey, options);
      var domLine = this._addLine();
      if (name) domLine.appendChild(this._createLabel(name));
      else widget.domSelect.style.width = '100%';
      domLine.appendChild(widget.domSelect);
      widget._setDomContainer(domLine);
      return widget;
    },
    addSlider: function (name, valOrObject, callbackOrKey, min, max, step) {
      var widget = new Slider(valOrObject, callbackOrKey, min, max, step);
      var domLine = this._addLine();
      if (name) domLine.appendChild(this._createLabel(name));
      domLine.appendChild(widget.domInputText);
      domLine.appendChild(widget.domSlider);
      widget._setDomContainer(domLine);
      return widget;
    },
    addColor: function (name, valOrObject, callbackOrKey) {
      var widget = new Color(valOrObject, callbackOrKey);
      var domLine = this._addLine();
      if (name) domLine.appendChild(this._createLabel(name));
      else widget.domColor.style.width = '100%';
      domLine.appendChild(widget.domColor);
      widget._setDomContainer(domLine);
      return widget;
    },
    addButton: function (name, callbackOrObject, key) {
      var widget = new Button(name, callbackOrObject, key);
      var domLine = this._addLine();
      domLine.appendChild(widget.domButton);
      widget._setDomContainer(domLine);
      return widget;
    },
    addDualButton: function (name1, name2, callbackOrObject1, callbackOrObject2, key1, key2) {
      var widget1 = new Button(name1, callbackOrObject1, key1);
      var widget2 = new Button(name2, callbackOrObject2, key2);
      var domLine = this._addLine();
      domLine.appendChild(widget2.domButton);
      domLine.appendChild(widget1.domButton);
      var style1 = widget1.domButton.style;
      var style2 = widget2.domButton.style;
      style1.width = style2.width = '49%';
      style1.marginRight = style2.marginLeft = '1%';
      widget1._setDomContainer(domLine);
      widget2._setDomContainer(domLine);
      return [widget1, widget2];
    }
  };

  return BaseContainer;
});