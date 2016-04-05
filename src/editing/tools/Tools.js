define(function (require, exports, module) {

  'use strict';

  var Enums = require('misc/Enums');

  var Tools = [];

  Tools[Enums.Tools.BRUSH] = require('editing/tools/Brush');
  Tools[Enums.Tools.INFLATE] = require('editing/tools/Inflate');
  Tools[Enums.Tools.TWIST] = require('editing/tools/Twist');
  Tools[Enums.Tools.SMOOTH] = require('editing/tools/Smooth');
  Tools[Enums.Tools.FLATTEN] = require('editing/tools/Flatten');
  Tools[Enums.Tools.PINCH] = require('editing/tools/Pinch');
  Tools[Enums.Tools.CREASE] = require('editing/tools/Crease');
  Tools[Enums.Tools.DRAG] = require('editing/tools/Drag');
  Tools[Enums.Tools.PAINT] = require('editing/tools/Paint');
  Tools[Enums.Tools.MOVE] = require('editing/tools/Move');
  Tools[Enums.Tools.MASKING] = require('editing/tools/Masking');
  Tools[Enums.Tools.LOCALSCALE] = require('editing/tools/LocalScale');
  Tools[Enums.Tools.TRANSFORM] = require('editing/tools/Transform');

  Tools[Enums.Tools.BRUSH].uiName = 'sculptBrush';
  Tools[Enums.Tools.INFLATE].uiName = 'sculptInflate';
  Tools[Enums.Tools.TWIST].uiName = 'sculptTwist';
  Tools[Enums.Tools.SMOOTH].uiName = 'sculptSmooth';
  Tools[Enums.Tools.FLATTEN].uiName = 'sculptFlatten';
  Tools[Enums.Tools.PINCH].uiName = 'sculptPinch';
  Tools[Enums.Tools.CREASE].uiName = 'sculptCrease';
  Tools[Enums.Tools.DRAG].uiName = 'sculptDrag';
  Tools[Enums.Tools.PAINT].uiName = 'sculptPaint';
  Tools[Enums.Tools.MOVE].uiName = 'sculptMove';
  Tools[Enums.Tools.MASKING].uiName = 'sculptMasking';
  Tools[Enums.Tools.LOCALSCALE].uiName = 'sculptLocalScale';
  Tools[Enums.Tools.TRANSFORM].uiName = 'sculptTransform';

  module.exports = Tools;
});
