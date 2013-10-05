'use strict';

function Octree(parent, depth)
{
  this.parent_ = typeof parent !== 'undefined' ? parent : null; //parent
  this.depth_ = typeof depth !== 'undefined' ? depth : 0; //depth of current node
  this.child_ = []; //children
  this.aabbLoose_ = new Aabb(); //extended boundary for intersect test
  this.aabbSplit_ = new Aabb(); //boundary in order to store exactly the triangle according to their center
  this.iTris_ = []; //triangles (if cell is a leaf)
}

Octree.maxDepth_ = 8; //maximum depth
Octree.maxTriangles_ = 100; //maximum triangles per cell

Octree.prototype = {
  /** Build octree */
  build: function (mesh, iTris, aabb)
  {
    var aabbSplit = this.aabbSplit_;
    var aabbLoose = this.aabbLoose_;
    aabbSplit.copy(aabb);
    aabbLoose.copy(aabb);
    this.iTris_.length = 0;
    var thisTris = this.iTris_;
    var triangles = mesh.triangles_;
    var nbTriangles = iTris.length;
    var triangleTagMask = Triangle.tagMask_;
    var i = 0;
    var t;
    if (this.parent_ && this.parent_.child_[7] === this)
    {
      for (i = 0; i < nbTriangles; ++i)
      {
        t = triangles[iTris[i]];
        if (t.tagFlag_ !== triangleTagMask)
        {
          aabbLoose.expandsWithAabb(t.aabb_);
          thisTris.push(iTris[i]);
        }
      }
    }
    else
    {
      for (i = 0; i < nbTriangles; ++i)
      {
        t = triangles[iTris[i]];
        if (aabbSplit.pointInside(t.aabb_.computeCenter()) && t.tagFlag_ !== triangleTagMask)
        {
          aabbLoose.expandsWithAabb(t.aabb_);
          thisTris.push(iTris[i]);
        }
      }
    }
    var nbTrianglesCell = thisTris.length;
    if (nbTrianglesCell > Octree.maxTriangles_ && this.depth_ < Octree.maxDepth_)
      this.constructCells(mesh);
    else
    {
      for (i = 0; i < nbTrianglesCell; ++i)
      {
        t = triangles[thisTris[i]];
        t.tagFlag_ = triangleTagMask;
        t.leaf_ = this;
        t.posInLeaf_ = i;
      }
    }
  },

  /** Construct cell */
  constructCells: function (mesh)
  {
    var child = this.child_;
    var iTris = this.iTris_;
    var min = this.aabbSplit_.min_,
      max = this.aabbSplit_.max_;
    var xmin = min[0],
      ymin = min[1],
      zmin = min[2];
    var xmax = max[0],
      ymax = max[1],
      zmax = max[2];
    var cen = this.aabbSplit_.computeCenter();
    var xcen = cen[0],
      ycen = cen[1],
      zcen = cen[2];
    var dX = (xmax - xmin) * 0.5,
      dY = (ymax - ymin) * 0.5,
      dZ = (zmax - zmin) * 0.5;
    var nextDepth = this.depth_ + 1;
    var aabb = new Aabb();
    child[0] = new Octree(this, nextDepth);
    child[0].build(mesh, iTris, aabb.setCopy(min, cen));
    child[1] = new Octree(this, nextDepth);
    child[1].build(mesh, iTris, aabb.set(xmin + dX, ymin, zmin, xcen + dX, ycen, zcen));
    child[2] = new Octree(this, nextDepth);
    child[2].build(mesh, iTris, aabb.set(xcen, ycen - dY, zcen, xmax, ymax - dY, zmax));
    child[3] = new Octree(this, nextDepth);
    child[3].build(mesh, iTris, aabb.set(xmin, ymin, zmin + dZ, xcen, ycen, zcen + dZ));
    child[4] = new Octree(this, nextDepth);
    child[4].build(mesh, iTris, aabb.set(xmin, ymin + dY, zmin, xcen, ycen + dY, zcen));
    child[5] = new Octree(this, nextDepth);
    child[5].build(mesh, iTris, aabb.set(xcen, ycen, zcen - dZ, xmax, ymax, zmax - dZ));
    child[6] = new Octree(this, nextDepth);
    child[6].build(mesh, iTris, aabb.setCopy(cen, max));
    child[7] = new Octree(this, nextDepth);
    child[7].build(mesh, iTris, aabb.set(xcen - dX, ycen, zcen, xmax - dX, ymax, zmax));
    this.iTris_.length = 0;
  },

  /** Return triangles in cells hit by a ray */
  intersectRay: function (vNear, rayInv)
  {
    if (this.aabbLoose_.intersectRay(vNear, rayInv))
    {
      if (this.child_[0])
      {
        var iTriangles = [];
        var child = this.child_;
        for (var i = 0; i < 8; ++i)
        {
          var iTris = child[i].intersectRay(vNear, rayInv);
          iTriangles.push.apply(iTriangles, iTris);
        }
        return iTriangles;
      }
      else
        return this.iTris_;
    }
    return [];
  },

  /** Return triangles inside a sphere */
  intersectSphere: function (vert, radiusSquared, leavesHit)
  {
    if (this.aabbSplit_.intersectSphere(vert, radiusSquared))
    {
      if (this.child_[0])
      {
        var iTriangles = [];
        var child = this.child_;
        for (var i = 0; i < 8; ++i)
        {
          var iTris = child[i].intersectSphere(vert, radiusSquared, leavesHit);
          iTriangles.push.apply(iTriangles, iTris);
        }
        return iTriangles;
      }
      else
      {
        leavesHit.push(this);
        return this.iTris_;
      }
    }
    return [];
  },

  /** Return triangles inside a sphere */
  cullPlane: function (origin, normal, iTrisCulled, iTrisIntersect)
  {
    var inter = 0;
    if (inter = this.aabbSplit_.intersectPlane(origin, normal))
    {
      if (this.child_[0])
      {
        var child = this.child_;
        for (var i = 0; i < 8; ++i)
          child[i].cullPlane(origin, normal, iTrisCulled, iTrisIntersect);
      }
      else
      {
        if (inter === 1) //above the plane
          iTrisCulled.push.apply(iTrisCulled, this.iTris_);
        else //intersect
          iTrisIntersect.push.apply(iTrisIntersect, this.iTris_);
      }
    }
  },

  /** Add triangle in the octree, subdivide the cell if necessary */
  addTriangle: function (mesh, tri)
  {
    if (this.aabbSplit_.pointInside(tri.aabb_.computeCenter()))
    {
      this.aabbLoose_.expandsWithAabb(tri.aabb_);
      var child = this.child_;
      if (child[0])
      {
        for (var i = 0; i < 8; ++i)
          child[i].addTriangle(mesh, tri);
      }
      else
      {
        tri.posInLeaf_ = this.iTris_.length;
        tri.leaf_ = this;
        this.iTris_.push(tri.id_);
      }
    }
  }
};

/** Cut leaves if needed */
Octree.checkEmptiness = function (leaf, cutLeaves)
{
  var parent = leaf.parent_;
  if (parent)
  {
    var child = parent.child_;
    var i = 0;
    for (i = 0; i < 8; ++i)
    {
      if (child[i].iTris_.length > 0 || child[i].child_[0])
        return;
    }
    cutLeaves.push(parent);
    for (i = 0; i < 8; ++i)
      cutLeaves.push(child[i]);
    Octree.checkEmptiness(parent, cutLeaves);
  }
};