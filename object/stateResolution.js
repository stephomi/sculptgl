'use strict';

function StateResolution(multimesh) {
  this.multimesh_ = multimesh; //the multires mesh
  this.mesh_ = multimesh.getCurrent(); //the sub multimesh
  this.aabbState_ = this.mesh_.octree_.aabbSplit_.slice(); //root aabb
}

StateResolution.prototype = {
  /** On undo */
  undo: function () {
    this.multimesh_.selectMesh(this.mesh_);
    // we don't save the triangles normal's and aabb
    this.mesh_.updateTrianglesAabbAndNormal();
    // and we don't save the octree neither
    this.mesh_.computeOctree(this.aabbState_);
  },
  /** Push the redo state */
  createRedo: function () {
    return new StateResolution(this.multimesh_);
  }
};