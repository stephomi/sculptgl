'use strict';

function Triangle(id)
{
  this.id_ = id; //id
  this.normal_ = [0.0, 0.0, 1.0]; //normal of triangle
  this.aabb_ = new Aabb(); //bounding box of the triangle
  this.leaf_ = null; //octree leaf
  this.posInLeaf_ = null; //position index in the leaf

  this.tagFlag_ = 1; //general purpose flag (<0 means the vertex is to be deleted)
}

Triangle.tagMask_ = 1; //flag mask value (should be always >= tagFlag_)

Triangle.prototype = {
  /** Clone triangle */
  clone: function ()
  {
    var t = new Triangle(this.id_);
    t.normal_ = this.normal_.slice();
    t.aabb_ = this.aabb_.clone();
    t.leaf_ = this.leaf_;
    t.posInLeaf_ = this.posInLeaf_;
    return t;
  }
};