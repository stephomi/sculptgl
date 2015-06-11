define([
  'editor/tools/Brush',
  'editor/tools/Inflate',
  'editor/tools/Twist',
  'editor/tools/Smooth',
  'editor/tools/Flatten',
  'editor/tools/Pinch',
  'editor/tools/Crease',
  'editor/tools/Drag',
  'editor/tools/Paint',
  'editor/tools/Move',
  'editor/tools/Masking',
  'editor/tools/LocalScale',
  'editor/tools/Transform'
], function (Brush, Inflate, Twist, Smooth, Flatten, Pinch, Crease, Drag, Paint, Move, Masking, LocalScale, Transform) {

  'use strict';

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

  return Tools;
});