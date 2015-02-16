(function() {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
define("../tools/almond", function(){});

define('utils/GuiUtils',[], function () {

  

  var GuiUtils = {};

  GuiUtils.makeProxy = function (source, proxy, wrapFunc) {
    var sourceProto = source.prototype;
    var proxyProto = proxy.prototype;
    var protos = Object.keys(sourceProto);
    for (var i = 0, l = protos.length; i < l; ++i) {
      var proto = protos[i];
      if (!proxyProto[proto])
        proxyProto[proto] = wrapFunc ? wrapFunc(sourceProto[proto]) : sourceProto[proto];
    }
  };
  GuiUtils.rgbToHsv = function (rgb) {
    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];
    var maxRGB = Math.max(r, g, b);
    var minRGB = Math.min(r, g, b);
    if (minRGB === maxRGB) return [0, 0, minRGB];
    var d = (r === minRGB) ? g - b : ((b === minRGB) ? r - g : b - r);
    var h = (r === minRGB) ? 3 : ((b === minRGB) ? 1 : 5);
    return [(h - d / (maxRGB - minRGB)) / 6, (maxRGB - minRGB) / maxRGB, maxRGB];
  };
  GuiUtils.hsvToRgb = function (hsv) {
    var h = hsv[0] * 6;
    var s = hsv[1];
    var v = hsv[2];
    var i = Math.floor(h);
    var f = h - i;
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var mod = i % 6;
    if (mod === 0) return [v, t, p];
    else if (mod === 1) return [q, v, p];
    else if (mod === 2) return [p, v, t];
    else if (mod === 3) return [p, q, v];
    else if (mod === 4) return [t, p, v];
    else return [v, p, q];
  };
  GuiUtils.getValidColor = function (color) {
    for (var i = 0; i < 3; ++i) color[i] = Math.max(0.0, Math.min(1.0, color[i]));
    return color;
  };
  GuiUtils.getStrColor = function (color) {
    if (color.length === 3) return GuiUtils.rgbToHex(color);
    return 'rgba(' + Math.round(color[0] * 255) + ',' + Math.round(color[1] * 255) + ',' + Math.round(color[2] * 255) + ',' + color[3] + ')';
  };
  GuiUtils.getColorMult = function (color, fac) {
    return GuiUtils.getValidColor([color[0] * fac, color[1] * fac, color[2] * fac]);
  };
  GuiUtils.getColorAdd = function (color, add) {
    return GuiUtils.getValidColor([color[0] + add, color[1] + add, color[2] + add]);
  };
  GuiUtils.rgbToHex = function (rgb) {
    var h = '#';
    for (var i = 0; i < 3; ++i) {
      var c = Math.round(rgb[i] * 255).toString(16);
      h += c.length === 1 ? '0' + c : c;
    }
    return h;
  };
  GuiUtils.hexToRgb = function (hex) {
    var i = 0;
    if (hex[0] === '#') hex = hex.slice(1);
    var h = hex;
    if (hex.length > 6) h = hex.slice(0, 6);
    else if (hex.length < 6) {
      h = '';
      for (i = 0; i < 3; ++i)
        h += hex[i] ? hex[i] + hex[i] : '00';
    }
    var col = [0, 0, 0];
    for (i = 0; i < 3; ++i) {
      var c = parseInt(h[i * 2] + h[i * 2 + 1], 16);
      col[i] = (c !== c ? 0 : c) / 255;
    }
    return col;
  };

  return GuiUtils;
});
define('widgets/BaseWidget',[], function () {

  

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
define('widgets/Button',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

  var Button = function (name, callbackOrObject, key) {
    var callback = key ? callbackOrObject[key].bind(callbackOrObject) : callbackOrObject;

    this.domButton = document.createElement('button');
    this.domButton.className = 'gui-button';
    this.domButton.innerHTML = name || '';
    this.domButton.addEventListener('click', this._onClick.bind(this));

    this.setCallback(callback);
  };

  Button.prototype = {
    setEnable: function (bool) {
      this.domButton.disabled = bool === undefined ? false : !bool;
    },
    _onClick: function () {
      if (this.callback) this.callback();
    }
  };

  GuiUtils.makeProxy(BaseWidget, Button);

  return Button;
});
define('widgets/Checkbox',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

  var Checkbox = function (valOrObject, callbackOrKey) {
    var value = this._getInitialValue(valOrObject, callbackOrKey);
    var callback = this._getCheckCallback(valOrObject, callbackOrKey);
    this.domCheckbox = document.createElement('input');
    this.domCheckbox.className = 'gui-input-checkbox';
    this.domCheckbox.type = 'checkbox';

    this.domLabelCheckbox = document.createElement('label');

    this.setValue(value === undefined ? true : value);
    this.setCallback(callback);
  };

  Checkbox.prototype = {
    _onMouseDown: function () {
      this.setValue(!this.domCheckbox.checked);
    },
    setValue: function (val, ignoreCB) {
      this.domCheckbox.checked = val;
      if (!ignoreCB && this.callback) this.callback(val);
    },
    getValue: function () {
      return this.domCheckbox.checked;
    }
  };

  GuiUtils.makeProxy(BaseWidget, Checkbox);

  return Checkbox;
});
define('widgets/Color',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

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
define('widgets/Combobox',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

  var Combobox = function (valOrObject, callbackOrKey, options) {
    var value = this._getInitialValue(valOrObject, callbackOrKey);
    var callback = this._getCheckCallback(valOrObject, callbackOrKey);
    options = options || {};
    value = value || options[0];

    this.domSelect = document.createElement('select');
    this.domSelect.className = 'gui-select';
    this.addOptions(options);

    this.domSelect.addEventListener('change', this._onChange.bind(this));
    this.setValue(value);
    this.setCallback(callback);
  };

  Combobox.prototype = {
    _onChange: function (ev) {
      this.setValue(ev.target.value);
    },
    addOptions: function (options) {
      var keys = Object.keys(options);
      for (var i = 0; i < keys.length; ++i) {
        var opt = document.createElement('option');
        opt.innerHTML = options[keys[i]];
        opt.value = keys[i];
        this.domSelect.appendChild(opt);
      }
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
define('widgets/Slider',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

  var Slider = function (valOrObject, callbackOrKey, min, max, step) {
    var value = this._getInitialValue(valOrObject, callbackOrKey);
    var callback = this._getCheckCallback(valOrObject, callbackOrKey);
    value = value !== undefined ? value : 100;
    min = min !== undefined ? min : 0;
    max = max !== undefined ? max : 200;
    step = step !== undefined ? step : 1;

    // slider
    this.domSlider = document.createElement('div');
    this.domSlider.className = 'gui-slider';
    this.domSliderFill = document.createElement('div');
    this.domSlider.appendChild(this.domSliderFill);

    // text input
    this.domInputText = document.createElement('input');
    this.domInputText.className = 'gui-input-number';
    this.domInputText.type = 'number';
    this.min = this.domInputText.min = min;
    this.max = this.domInputText.max = max;
    this.step = this.domInputText.step = step;

    this.domInputText.addEventListener('keydown', this._onKeyDown.bind(this));
    this.domInputText.addEventListener('change', this._onInputText.bind(this));
    this.domInputText.addEventListener('blur', this._onInputText.bind(this));
    this.domSlider.addEventListener('mousedown', this._onMouseDown.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this), true);
    window.addEventListener('mousemove', this._onMouseMove.bind(this));

    this.lastValue = value;
    this.isDown = false;
    this.setValue(value);
    this.setCallback(callback);
  };

  Slider.prototype = {
    _onInputText: function (ev) {
      var val = parseFloat(ev.target.value);
      if (val !== val || val === this.lastValue) return;
      this.setValue(val);
    },
    _onKeyDown: function (ev) {
      ev.stopPropagation();
      if (ev.which === 13) // enter
        this.domInputText.blur();
    },
    _onMouseMove: function (ev) {
      ev.preventDefault();
      if (!this.isDown)
        return;
      var rect = this.domSlider.getBoundingClientRect();
      var val = this.min + (this.max - this.min) * ((ev.clientX - rect.left) / rect.width);
      this.setValue(val);
    },
    _onMouseDown: function (ev) {
      this.isDown = true;
      this._onMouseMove(ev);
    },
    _onMouseUp: function () {
      this.isDown = false;
    },
    _setDomContainer: function (container) {
      this.domContainer = container;
    },
    getValue: function () {
      return parseFloat(this.domInputText.value);
    },
    setValue: function (val, ignoreCB) {
      this.lastValue = val;
      val = Math.max(Math.min(val, this.max), this.min);
      val = Math.round(val / this.step) * this.step;
      this.domInputText.value = val;
      var per = this.min;
      if (this.max !== this.min) per = (val - this.min) / (this.max - this.min);
      this.domSliderFill.style.width = 100 * per + '%';
      if (!ignoreCB && this.callback) this.callback(val);
    },
    setMax: function (max) {
      this.domInputText.max = this.max = max;
      return this;
    },
    setMin: function (min) {
      this.min = min;
      return this;
    }
  };

  GuiUtils.makeProxy(BaseWidget, Slider);

  return Slider;
});
define('widgets/Title',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

  var Title = function (name) {
    this.domText = document.createElement('div');
    this.domText.innerHTML = name || '';
    this.domText.className = 'group-title';
  };

  Title.prototype = {
    setText: function (text) {
      this.domText.innerHTML = text;
    },
    setVisibility: function (visible) {
      this.domText.hidden = !visible;
    }
  };

  GuiUtils.makeProxy(BaseWidget, Title);

  return Title;
});
define('containers/BaseContainer',[
  'widgets/BaseWidget',
  'widgets/Button',
  'widgets/Checkbox',
  'widgets/Color',
  'widgets/Combobox',
  'widgets/Slider',
  'widgets/Title'
], function (BaseWidget, Button, Checkbox, Color, Combobox, Slider, Title) {

  

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
    _setDomContainer: function (container) {
      this.domContainer = container;
    },
    addTitle: function (name) {
      var widget = new Title(name);
      this.domUl.appendChild(widget.domText);
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
    },
    setVisibility: function (visible) {
      if (!this.domContainer) return;
      this.domContainer.hidden = !visible;
    }
  };

  return BaseContainer;
});
define('containers/Folder',[
  'utils/GuiUtils',
  'containers/BaseContainer'
], function (GuiUtils, BaseContainer) {

  

  var Folder = function (name) {
    this.domUl = document.createElement('ul');
    this.domUl.setAttribute('opened', true);

    var domTitle = document.createElement('label');
    domTitle.innerHTML = name || '';

    domTitle.addEventListener('mousedown', this._onMouseDown.bind(this));

    this.domUl.appendChild(domTitle);
    this.isOpen = true;
  };

  Folder.prototype = {
    _onMouseDown: function () {
      this.isOpen = !this.isOpen;
      this.domUl.setAttribute('opened', this.isOpen);
    },
    open: function () {
      this.isOpen = true;
      this.domUl.setAttribute('opened', true);
    },
    close: function () {
      this.isOpen = false;
      this.domUl.setAttribute('opened', false);
    },
    setVisibility: function (visible) {
      if (!visible)
        this.close();
      this.domUl.style.height = visible ? '35px' : '0px';
    }
  };

  GuiUtils.makeProxy(BaseContainer, Folder);

  return Folder;
});
define('containers/Sidebar',[
  'containers/Folder'
], function (Folder) {

  

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
      var w = this.domSidebar.hidden ? 0 : this.domSidebar.offsetWidth;
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
    addMenu: function (name) {
      var folder = new Folder(name);
      this.domSidebar.appendChild(folder.domUl);
      return folder;
    },
    setVisibility: function (visible) {
      this.domSidebar.hidden = !visible;
      this.domResize.hidden = !visible;
      this.callbackResize();
    }
  };

  return Sidebar;
});
define('widgets/MenuButton',[
  'utils/GuiUtils',
  'widgets/BaseWidget'
], function (GuiUtils, BaseWidget) {

  

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
define('containers/Menu',[
  'utils/GuiUtils',
  'containers/BaseContainer',
  'widgets/MenuButton'
], function (GuiUtils, BaseContainer, MenuButton) {

  

  var Menu = function () {
    this.domUl = document.createElement('ul');
  };

  Menu.prototype = {
    addButton: function (name, callbackOrObject, shortcutOrKey, shortcut) {
      var widget = new MenuButton(callbackOrObject, shortcutOrKey, shortcut);
      var domLine = this._addLine(name);
      domLine.appendChild(widget.domSpan);
      widget._setDomContainer(domLine);
      return widget;
    },
    addSlider: function (name, valOrObject, callbackOrKey, min, max, step) {
      var wid = BaseContainer.prototype.addSlider.call(this, name, valOrObject, callbackOrKey, min, max, step);
      // label 36% + slider ?% + 2% + input 18%
      wid.domInputText.style.width = '18%';
      wid.domSlider.style.width = name ? '44%' : '80%';
      return wid;
    }
  };

  GuiUtils.makeProxy(BaseContainer, Menu);

  return Menu;
});
define('utils/EditStyle',[
  'utils/GuiUtils'
], function (GuiUtils) {

  

  var EditStyle = {};

  EditStyle.refRules = {};

  var yaguiSheet;
  var findSheet = function () {
    if (yaguiSheet) return yaguiSheet;
    var sheets = document.styleSheets;
    for (var i = 0, nb = sheets.length; i < nb; ++i) {
      var href = sheets[i].href;
      if (href && href.indexOf('yagui.css') !== -1) {
        yaguiSheet = sheets[i];
        return yaguiSheet;
      }
    }
    return;
  };

  var editStyle = function (selector, key, value) {
    var sheet = findSheet();
    if (!sheet)
      return;
    var rules = sheet.cssRules || sheet.rules;
    var rule = EditStyle.refRules[selector];
    if (!rule) {
      var i = 0;
      var len = rules.length;
      for (i = 0; i < len; ++i) {
        if (rules[i].selectorText === selector) break;
      }
      if (i === len) return false;
      rule = EditStyle.refRules[selector] = rules[i];
    }
    if (rule)
      rule.style[key] = value;
  };

  EditStyle.changeWidgetsColor = function (color) {
    var str = GuiUtils.getStrColor(color);
    // button
    editStyle('.gui-button', 'background', str);
    // select
    editStyle('.gui-select', 'background', str);
    // slider
    editStyle('.gui-slider > div', 'background', str);
    EditStyle._curWidgetColor = color;
  };

  EditStyle.changeDisplayBoorder = function (bool) {
    var str = bool ? '1px solid #000' : '0';
    editStyle('.gui-button', 'border', str);
    // select
    editStyle('.gui-select', 'border', str);
    // slider
    editStyle('.gui-slider', 'border', str);
    editStyle('.gui-input-number', 'border', str);
    // folder
    editStyle('.gui-sidebar > ul > label', 'borderTop', str);
    editStyle('.gui-sidebar > ul > label', 'borderBottom', str);
    // side bar
    editStyle('.gui-sidebar', 'borderLeft', str);
    editStyle('.gui-sidebar', 'borderRight', str);
    // top bar
    editStyle('.gui-topbar', 'borderBottom', str);
    EditStyle._curShowBorder = bool;
  };

  EditStyle.changeBackgroundColor = function (color) {
    // side bar
    editStyle('.gui-sidebar', 'background', GuiUtils.getStrColor(color));
    // top bar
    var colTop = GuiUtils.getStrColor(GuiUtils.getColorMult(color, 0.5));
    editStyle('.gui-topbar', 'background', colTop);
    editStyle('.gui-topbar ul > li > ul', 'background', colTop);
    EditStyle._curBackgroundColor = color;
  };

  EditStyle.changeTextColor = function (color) {
    var strColor = GuiUtils.getStrColor(color);
    editStyle('*', 'color', strColor);
    editStyle('.gui-sidebar > ul > label', 'color', strColor);
    EditStyle._curTextColor = color;
  };

  EditStyle.changeOverallColor = function (color) {
    EditStyle.changeWidgetsColor(color);
    var bgCol = GuiUtils.getColorMult(color, 0.5);
    EditStyle.changeBackgroundColor(bgCol);

    var texCol = GuiUtils.getColorAdd(color, 0.5);
    for (var i = 0; i < 3; ++i) texCol[i] = Math.min(0.8, texCol[i]);
    EditStyle.changeTextColor(texCol);

    EditStyle._curWidgetColor = color;
    EditStyle._curBackgroundColor = bgCol;
    EditStyle._curTextColor = texCol;
  };

  // init value
  EditStyle._curTextColor = [0.73, 0.73, 0.73];
  EditStyle._curWidgetColor = [0.32, 0.37, 0.39];
  EditStyle._curBackgroundColor = [0.24, 0.24, 0.24];
  EditStyle._curShowBorder = false;

  EditStyle.changeOverallColor([0.3, 0.34, 0.4]);
  return EditStyle;
});
define('containers/Topbar',[
  'containers/Menu',
  'utils/EditStyle'
], function (Menu, EditStyle) {

  

  var Topbar = function (callbackResize) {
    this.domTopbar = document.createElement('div');
    this.domTopbar.className = 'gui-topbar';

    this.domUl = document.createElement('ul');
    this.domTopbar.appendChild(this.domUl);

    this.callbackResize = callbackResize;
    this.uiExtra = {};
  };

  Topbar.prototype = {
    _updateCanvasPosition: function (canvas) {
      var h = this.domTopbar.hidden ? 0 : this.domTopbar.offsetHeight;
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
      menu._setDomContainer(li);
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
    },
    setVisibility: function (visible) {
      this.domTopbar.hidden = !visible;
      this.callbackResize();
    }
  };

  return Topbar;
});
define('GuiMain',[
  'containers/Sidebar',
  'containers/Topbar'
], function (Sidebar, Topbar) {

  

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
        this.domCanvas.left = 0;
        this.domCanvas.top = 0;
        if (this.leftSidebar)
          this.leftSidebar._updateCanvasPosition(this.domCanvas);
        if (this.rightSidebar)
          this.rightSidebar._updateCanvasPosition(this.domCanvas);
        if (this.topbar)
          this.topbar._updateCanvasPosition(this.domCanvas);
      }
      this._updateSidebarsPosition();
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
      this.topbar = new Topbar(this.cbResize_);
      this.domMain.appendChild(this.topbar.domTopbar);

      this._updateSidebarsPosition();
      this.topbar._updateCanvasPosition(this.domCanvas);
      return this.topbar;
    },
    setVisibility: function (visible) {
      this.domMain.hidden = !visible;
      this._onWindowResize();
    }
  };

  return GuiMain;
});
define('yagui',[
  'GuiMain',
], function (GuiMain) {

  

  var yagui = {};
  yagui.GuiMain = GuiMain;
  window.yagui = yagui;

  return yagui;
});
return require("yagui");}());