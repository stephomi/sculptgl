import { vec3, mat3, mat4 } from 'gl-matrix';

var TransformData = function () {
  return {
    _center: vec3.create(), // center of the mesh (local space, before transformation)
    _matrix: mat4.create(), // transformation matrix of the mesh
    _editMatrix: mat4.create(), // edit matrix

    _symmetryNormal: [1.0, 0.0, 0.0], // symmetry normal
    _symmetryOffset: 0.0, // offset

    // the model-view and model-view-projection and normal matrices 
    // are computed at the beginning of each frame (after camera update)
    _lastComputedMV: mat4.create(), // MV matrix
    _lastComputedMVP: mat4.create(), // MVP matrix
    _lastComputedN: mat3.create(), // N matrix
    _lastComputedEN: mat3.create(), // Editmatrix N matrix
    _lastComputedDepth: 0.0, // depth of center

    _lastWorldBound: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]
  };
};

export default TransformData;
