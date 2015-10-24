define(function (require, exports, module) {

  'use strict';

  var Brush = require('editing/tools/Brush');
  var Inflate = require('editing/tools/Inflate');
  var Twist = require('editing/tools/Twist');
  var Smooth = require('editing/tools/Smooth');
  var Flatten = require('editing/tools/Flatten');
  var Pinch = require('editing/tools/Pinch');
  var Crease = require('editing/tools/Crease');
  var Drag = require('editing/tools/Drag');
  var Paint = require('editing/tools/Paint');
  var Move = require('editing/tools/Move');
  var Masking = require('editing/tools/Masking');
  var LocalScale = require('editing/tools/LocalScale');
  var Transform = require('editing/tools/Transform');

  var Tools = {};

  Tools.BRUSH = Brush;
  Tools.INFLATE = Inflate;
  Tools.TWIST = Twist;
  Tools.SMOOTH = Smooth;
  Tools.FLATTEN = Flatten;
  Tools.PINCH = Pinch;
  Tools.CREASE = Crease;
  Tools.DRAG = Drag;
  Tools.PAINT = Paint;
  Tools.MOVE = Move;
  Tools.MASKING = Masking;
  Tools.LOCALSCALE = LocalScale;
  Tools.TRANSFORM = Transform;

  Tools.BRUSH.uiName = 'sculptBrush';
  Tools.INFLATE.uiName = 'sculptInflate';
  Tools.TWIST.uiName = 'sculptTwist';
  Tools.SMOOTH.uiName = 'sculptSmooth';
  Tools.FLATTEN.uiName = 'sculptFlatten';
  Tools.PINCH.uiName = 'sculptPinch';
  Tools.CREASE.uiName = 'sculptCrease';
  Tools.DRAG.uiName = 'sculptDrag';
  Tools.PAINT.uiName = 'sculptPaint';
  Tools.MOVE.uiName = 'sculptMove';
  Tools.MASKING.uiName = 'sculptMasking';
  Tools.LOCALSCALE.uiName = 'sculptLocalScale';
  Tools.TRANSFORM.uiName = 'sculptTransform';

  Tools.keys = Object.keys(Tools);

  module.exports = Tools;
});