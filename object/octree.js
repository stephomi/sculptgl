'use strict';

function Octree(parent, depth)
{
  this.parent_ = parent !== undefined ? parent : null; //parent
  this.depth_ = depth !== undefined ? depth : 0; //depth of current node
  this.children_ = []; //children
  this.aabbLoose_ = new Aabb(); //extended boundary for intersect test
  this.aabbSplit_ = new Aabb(); //boundary in order to store exactly the triangle according to their center
  this.iTris_ = []; //triangles (if cell is a leaf)
}

Octree.maxDepth_ = 8; //maximum depth
Octree.maxTriangles_ = 100; //maximum triangles per cell

Octree.prototype = {
  /** Subdivide octree, aabbSplit must be already set, and aabbLoose will be expanded if it's a leaf  */
  build: function (mesh, iTris)
  {
    var aabbLoose = this.aabbLoose_;
    aabbLoose.copy(this.aabbSplit_);
    this.iTris_ = iTris;
    var nbTriangles = iTris.length;
    if (nbTriangles > Octree.maxTriangles_ && this.depth_ < Octree.maxDepth_)
      this.constructCells(mesh);
    else if (nbTriangles > 0)
    {
      var bxmin = Infinity;
      var bymin = Infinity;
      var bzmin = Infinity;
      var bxmax = -Infinity;
      var bymax = -Infinity;
      var bzmax = -Infinity;
      var triangles = mesh.triangles_;
      for (var i = 0; i < nbTriangles; ++i)
      {
        var t = triangles[iTris[i]];
        t.leaf_ = this;
        t.posInLeaf_ = i;
        var aabb = t.aabb_;
        var min = aabb.min_;
        var max = aabb.max_;
        var xmin = min[0];
        var ymin = min[1];
        var zmin = min[2];
        var xmax = max[0];
        var ymax = max[1];
        var zmax = max[2];
        if (xmax > bxmax) bxmax = xmax;
        if (xmin < bxmin) bxmin = xmin;
        if (ymax > bymax) bymax = ymax;
        if (ymin < bymin) bymin = ymin;
        if (zmax > bzmax) bzmax = zmax;
        if (zmin < bzmin) bzmin = zmin;
      }
      aabbLoose.set(bxmin, bymin, bzmin, bxmax, bymax, bzmax);
      var parent = this.parent_;
      while (parent !== null)
      {
        parent.aabbLoose_.expandsWithAabb(aabbLoose);
        parent = parent.parent_;
      }
    }
  },

  /** Construct sub cells of the octree */
  constructCells: function (mesh)
  {
    var min = this.aabbSplit_.min_,
      max = this.aabbSplit_.max_;
    var xmin = min[0],
      ymin = min[1],
      zmin = min[2];
    var xmax = max[0],
      ymax = max[1],
      zmax = max[2];
    var dX = (xmax - xmin) * 0.5,
      dY = (ymax - ymin) * 0.5,
      dZ = (zmax - zmin) * 0.5;
    var xcen = (xmax + xmin) * 0.5,
      ycen = (ymax + ymin) * 0.5,
      zcen = (zmax + zmin) * 0.5;

    var iTris0 = [];
    var iTris1 = [];
    var iTris2 = [];
    var iTris3 = [];
    var iTris4 = [];
    var iTris5 = [];
    var iTris6 = [];
    var iTris7 = [];
    var triangles = mesh.triangles_;
    var iTris = this.iTris_;
    var nbTriangles = iTris.length;
    for (var i = 0; i < nbTriangles; ++i)
    {
      var iTri = iTris[i];
      var t = triangles[iTri];
      var center = t.aabb_.center_;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];

      if (cx > xcen)
      {
        if (cy > ycen)
        {
          if (cz > zcen)
            iTris6.push(iTri);
          else
            iTris5.push(iTri);
        }
        else
        {
          if (cz > zcen)
            iTris2.push(iTri);
          else
            iTris1.push(iTri);
        }
      }
      else
      {
        if (cy > ycen)
        {
          if (cz > zcen)
            iTris7.push(iTri);
          else
            iTris4.push(iTri);
        }
        else
        {
          if (cz > zcen)
            iTris3.push(iTri);
          else
            iTris0.push(iTri);
        }
      }
    }
    var nextDepth = this.depth_ + 1;

    var child0 = new Octree(this, nextDepth);
    child0.aabbSplit_.set(xmin, ymin, zmin, xcen, ycen, zcen);
    child0.build(mesh, iTris0);

    var child1 = new Octree(this, nextDepth);
    child1.aabbSplit_.set(xmin + dX, ymin, zmin, xcen + dX, ycen, zcen);
    child1.build(mesh, iTris1);

    var child2 = new Octree(this, nextDepth);
    child2.aabbSplit_.set(xcen, ycen - dY, zcen, xmax, ymax - dY, zmax);
    child2.build(mesh, iTris2);

    var child3 = new Octree(this, nextDepth);
    child3.aabbSplit_.set(xmin, ymin, zmin + dZ, xcen, ycen, zcen + dZ);
    child3.build(mesh, iTris3);

    var child4 = new Octree(this, nextDepth);
    child4.aabbSplit_.set(xmin, ymin + dY, zmin, xcen, ycen + dY, zcen);
    child4.build(mesh, iTris4);

    var child5 = new Octree(this, nextDepth);
    child5.aabbSplit_.set(xcen, ycen, zcen - dZ, xmax, ymax, zmax - dZ);
    child5.build(mesh, iTris5);

    var child6 = new Octree(this, nextDepth);
    child6.aabbSplit_.set(xcen, ycen, zcen, xmax, ymax, zmax);
    child6.build(mesh, iTris6);

    var child7 = new Octree(this, nextDepth);
    child7.aabbSplit_.set(xcen - dX, ycen, zcen, xmax - dX, ymax, zmax);
    child7.build(mesh, iTris7);

    this.children_.length = 0;
    this.children_.push(child0, child1, child2, child3, child4, child5, child6, child7);
    iTris.length = 0;
  },

  /** Return triangles in cells hit by a ray */
  intersectRay: function (vNear, rayInv)
  {
    if (this.aabbLoose_.intersectRay(vNear, rayInv))
    {
      if (this.children_.length === 8)
      {
        var iTriangles = [];
        var children = this.children_;
        for (var i = 0; i < 8; ++i)
        {
          var iTris = children[i].intersectRay(vNear, rayInv);
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
      if (this.children_.length === 8)
      {
        var iTriangles = [];
        var children = this.children_;
        for (var i = 0; i < 8; ++i)
        {
          var iTris = children[i].intersectSphere(vert, radiusSquared, leavesHit);
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
    var inter = this.aabbSplit_.intersectPlane(origin, normal);
    if (inter > 0)
    {
      if (this.children_.length === 8)
      {
        var children = this.children_;
        for (var i = 0; i < 8; ++i)
          children[i].cullPlane(origin, normal, iTrisCulled, iTrisIntersect);
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
  addTriangle: function (tri)
  {
    if (this.aabbSplit_.pointInside(tri.aabb_.center_))
    {
      this.aabbLoose_.expandsWithAabb(tri.aabb_);
      var children = this.children_;
      if (children.length === 8)
      {
        for (var i = 0; i < 8; ++i)
          children[i].addTriangle(tri);
      }
      else
      {
        tri.posInLeaf_ = this.iTris_.length;
        tri.leaf_ = this;
        this.iTris_.push(tri.id_);
      }
    }
  },

  /** Cut leaves if needed */
  checkEmptiness: function ()
  {
    var parent = this.parent_;
    if (parent && parent.children_.length === 8)
    {
      var children = parent.children_;
      for (var i = 0; i < 8; ++i)
      {
        var child = children[i];
        if (child.iTris_.length > 0 || child.children_.length === 8)
          return;
      }
      children.length = 0;
      parent.checkEmptiness();
    }
  }
};