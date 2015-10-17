define(function (require, exports, module) {

  'use strict';

  var Brush = require('editor/tools/Brush');
  var Inflate = require('editor/tools/Inflate');
  var Twist = require('editor/tools/Twist');
  var Smooth = require('editor/tools/Smooth');
  var Flatten = require('editor/tools/Flatten');
  var Pinch = require('editor/tools/Pinch');
  var Crease = require('editor/tools/Crease');
  var Drag = require('editor/tools/Drag');
  var Paint = require('editor/tools/Paint');
  var Move = require('editor/tools/Move');
  var Masking = require('editor/tools/Masking');
  var LocalScale = require('editor/tools/LocalScale');
  var Transform = require('editor/tools/Transform');

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