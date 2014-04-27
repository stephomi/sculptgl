define([
  'lib/glMatrix',
  'misc/Utils'
], function (glm, Utils) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  function TransformData(mesh) {
    this.mesh_ = mesh; //the mesh

    this.center_ = [0.0, 0.0, 0.0]; //center of the mesh
    this.matTransform_ = mat4.create(); //transformation matrix of the mesh
    this.scale_ = -1.0; //the scale is already applied in the matrix transform
  }

  TransformData.prototype = {
    getCenter: function () {
      return this.center_;
    },
    getMatrix: function () {
      return this.matTransform_;
    },
    getScale: function () {
      return this.scale_;
    },
    /** Initialize the mesh, octree, topology, geometry, bbox, transformation */
    scaleAndCenter: function () {
      var box = this.mesh_.getBound();
      this.center_ = [(box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5];
      //scale and center
      var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
      var scale = this.scale_ = Utils.SCALE / diag;
      mat4.scale(this.matTransform_, this.matTransform_, [scale, scale, scale]);
      this.moveTo([0.0, 0.0, 0.0]);
    },
    /** Move the mesh center to a certain point */
    moveTo: function (destination) {
      mat4.translate(this.matTransform_, this.matTransform_, vec3.sub(destination, destination, this.center_));
    },
  };

  return TransformData;
});