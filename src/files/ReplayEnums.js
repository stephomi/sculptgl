define([], function () {

  'use strict';

  var Replay = {};

  var ida = 0;
  // id action (u8)
  Replay.DEVICE_MOVE = ida++; // [x (u16), y (u16), mask (u8)]
  Replay.DEVICE_DOWN = ida++; // [button (u8), x (u16), y (u16), mask (u8)]
  Replay.DEVICE_UP = ida++; // []
  Replay.DEVICE_WHEEL = ida++; // [dir (i8)]

  Replay.UNDO = ida++; // []
  Replay.REDO = ida++; // []

  Replay.CAMERA_SIZE = ida++; // [x (u16), y (u16)]
  Replay.CAMERA_FPS = ida++; // [xmove (i8), zmove (i8)]
  Replay.CAMERA_MODE = ida++; // [mode (u8)]
  Replay.CAMERA_PROJ_TYPE = ida++; // [type (u8)]
  Replay.CAMERA_FOV = ida++; // [fov (u8)]
  Replay.CAMERA_RESET = ida++; // []
  Replay.CAMERA_TOGGLE_FRONT = ida++; // []
  Replay.CAMERA_TOGGLE_LEFT = ida++; // []
  Replay.CAMERA_TOGGLE_TOP = ida++; // []
  Replay.CAMERA_TOGGLE_PIVOT = ida++; // []

  Replay.SCULPT_TOOL = ida++; // [tool (u8)]
  Replay.SCULPT_RADIUS = ida++; // [radius (u8)]
  Replay.SCULPT_TOGGLE_SYMMETRY = ida++; // []
  Replay.SCULPT_TOGGLE_CONTINUOUS = ida++; // []
  Replay.SCULPT_UPDATE_CONTINOUS = ida++; // []

  Replay.BRUSH_INTENSITY = ida++; // [intensity (u8)]
  Replay.BRUSH_TOGGLE_NEGATIVE = ida++; // []
  Replay.BRUSH_TOGGLE_CLAY = ida++; // []
  Replay.BRUSH_TOGGLE_CULLING = ida++; // []
  Replay.BRUSH_TOGGLE_ACCUMULATE = ida++; // []
  Replay.BRUSH_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.BRUSH_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.CREASE_INTENSITY = ida++; // [intensity (u8)]
  Replay.CREASE_TOGGLE_NEGATIVE = ida++; // []
  Replay.CREASE_TOGGLE_CULLING = ida++; // []
  Replay.CREASE_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.CREASE_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.FLATTEN_INTENSITY = ida++; // [intensity (u8)]
  Replay.FLATTEN_TOGGLE_NEGATIVE = ida++; // []
  Replay.FLATTEN_TOGGLE_CULLING = ida++; // []
  Replay.FLATTEN_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.FLATTEN_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.INFLATE_INTENSITY = ida++; // [intensity (u8)]
  Replay.INFLATE_TOGGLE_NEGATIVE = ida++; // []
  Replay.INFLATE_TOGGLE_CULLING = ida++; // []
  Replay.INFLATE_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.INFLATE_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.PINCH_INTENSITY = ida++; // [intensity (u8)]
  Replay.PINCH_TOGGLE_NEGATIVE = ida++; // []
  Replay.PINCH_TOGGLE_CULLING = ida++; // []
  Replay.PINCH_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.PINCH_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.SMOOTH_INTENSITY = ida++; // [intensity (u8)]
  Replay.SMOOTH_TOGGLE_CULLING = ida++; // []
  Replay.SMOOTH_TOGGLE_TANGENT = ida++; // []
  Replay.SMOOTH_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.SMOOTH_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.LOCALSCALE_TOGGLE_CULLING = ida++; // []
  Replay.LOCALSCALE_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.TWIST_TOGGLE_CULLING = ida++; // []
  Replay.TWIST_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.DRAG_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.TRANSLATE_TOGGLE_NEGATIVE = ida++; // []

  Replay.ROTATE_TOGGLE_NEGATIVE = ida++; // []

  Replay.PAINT_INTENSITY = ida++; // [intensity (u8)]
  Replay.PAINT_HARDNESS = ida++; // [hardness (u8)]
  Replay.PAINT_COLOR = ida++; // [r (f32), g (f32), b (f32)]
  Replay.PAINT_ROUGHNESS = ida++; // [roughness (f32)]
  Replay.PAINT_METALLIC = ida++; // [metallic (f32)]
  Replay.PAINT_TOGGLE_CULLING = ida++; // []
  Replay.PAINT_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.PAINT_SELECT_ALPHA = ida++; // [id (u8)]
  Replay.PAINT_ALL = ida++; // []

  Replay.MOVE_INTENSITY = ida++; // [intensity (u8)]
  Replay.MOVE_TOGGLE_TOPOCHECK = ida++; // []
  Replay.MOVE_TOGGLE_NEGATIVE = ida++; // []
  Replay.MOVE_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.MASKING_INTENSITY = ida++; // [intensity (u8)]
  Replay.MASKING_HARDNESS = ida++; // [hardness (u8)]
  Replay.MASKING_TOGGLE_NEGATIVE = ida++; // []
  Replay.MASKING_TOGGLE_CULLING = ida++; // []
  Replay.MASKING_CLEAR = ida++; // []
  Replay.MASKING_INVERT = ida++; // []
  Replay.MASKING_BLUR = ida++; // []
  Replay.MASKING_SHARPEN = ida++; // []
  Replay.MASKING_TOGGLE_LOCK_POSITION = ida++; // []
  Replay.MASKING_SELECT_ALPHA = ida++; // [id (u8)]

  Replay.MULTI_RESOLUTION = ida++; // [res (u8)]
  Replay.MULTI_SUBDIVIDE = ida++; // []
  Replay.MULTI_REVERSE = ida++; // []
  Replay.MULTI_DEL_LOWER = ida++; // []
  Replay.MULTI_DEL_HIGHER = ida++; // []

  Replay.VOXEL_REMESH = ida++; // [res (u16), block (u8)]

  Replay.DYNAMIC_TOGGLE_ACTIVATE = ida++; // []
  Replay.DYNAMIC_TOGGLE_LINEAR = ida++; // []
  Replay.DYNAMIC_SUBDIVISION = ida++; // [val (u8)]
  Replay.DYNAMIC_DECIMATION = ida++; // [val (u8)]

  Replay.LOAD_ALPHA = ida++; // [width (u32), height (u32), len (u32)]
  Replay.LOAD_MESHES = ida++; // [len (u32)]
  Replay.ADD_SPHERE = ida++; // []
  Replay.ADD_CUBE = ida++; // []
  Replay.DELETE_CURRENT_MESH = ida++; // []

  Replay.EXPOSURE_INTENSITY = ida++; // [val (u8)]
  Replay.SHOW_GRID = ida++; // [bool (u8)]
  Replay.SHOW_WIREFRAME = ida++; // [bool (u8)]
  Replay.FLAT_SHADING = ida++; // [bool (u8)]
  Replay.SHADER_SELECT = ida++; // [val (u8)]
  Replay.MATCAP_SELECT = ida++; // [val (u8)]

  Replay.TABLET_TOGGLE_INTENSITY = ida++; // []
  Replay.TABLET_TOGGLE_RADIUS = ida++; // []
  Replay.TABLET_PRESSURE = ida++; // [val (f32)]

  Replay.CTRL = 1 << 0;
  Replay.ALT = 1 << 1;
  Replay.SHIFT = 1 << 2;

  Replay.CODE = 59821876; // code
  Replay.VERSION = 6; // version

  return Replay;
});