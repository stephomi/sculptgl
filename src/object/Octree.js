define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function Octree(parent, depth) {
    this.parent_ = parent !== undefined ? parent : null; //parent
    this.depth_ = depth !== undefined ? depth : 0; //depth of current node
    this.children_ = []; //children
    //extended boundary for intersect test
    this.aabbLoose_ = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    //boundary in order to store exactly the triangle according to their center
    this.aabbSplit_ = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    this.iTris_ = []; //triangles (if cell is a leaf)
  }

  Octree.maxDepth_ = 8; //maximum depth
  Octree.maxTriangles_ = 100; //maximum triangles per cell

  Octree.prototype = {
    /** Subdivide octree, aabbSplit must be already set, and aabbLoose will be expanded if it's a leaf  */
    build: function (mesh, iTris) {
      var i = 0;
      var aabbLoose = this.aabbLoose_;
      var aabbSplit = this.aabbSplit_;
      for (i = 0; i < 6; ++i)
        aabbLoose[i] = aabbSplit[i];
      this.iTris_ = iTris;
      var nbTriangles = iTris.length;
      if (nbTriangles > Octree.maxTriangles_ && this.depth_ < Octree.maxDepth_)
        this.constructCells(mesh);
      else if (nbTriangles > 0) {
        var bxmin = Infinity;
        var bymin = Infinity;
        var bzmin = Infinity;
        var bxmax = -Infinity;
        var bymax = -Infinity;
        var bzmax = -Infinity;
        var triBoxes = mesh.triBoxes_;
        var triPosInLeaf = mesh.triPosInLeaf_;
        var triLeaf = mesh.triLeaf_;
        for (i = 0; i < nbTriangles; ++i) {
          var id = iTris[i];
          triLeaf[id] = this;
          triPosInLeaf[id] = i;
          id *= 6;
          var xmin = triBoxes[id];
          var ymin = triBoxes[id + 1];
          var zmin = triBoxes[id + 2];
          var xmax = triBoxes[id + 3];
          var ymax = triBoxes[id + 4];
          var zmax = triBoxes[id + 5];
          if (xmin < bxmin) bxmin = xmin;
          if (xmax > bxmax) bxmax = xmax;
          if (ymin < bymin) bymin = ymin;
          if (ymax > bymax) bymax = ymax;
          if (zmin < bzmin) bzmin = zmin;
          if (zmax > bzmax) bzmax = zmax;
        }
        aabbLoose[0] = bxmin;
        aabbLoose[1] = bymin;
        aabbLoose[2] = bzmin;
        aabbLoose[3] = bxmax;
        aabbLoose[4] = bymax;
        aabbLoose[5] = bzmax;
        var parent = this.parent_;
        // expands parent loose aabb cells
        while (parent !== null) {
          var pLoose = parent.aabbLoose_;
          if (bxmin < pLoose[0]) pLoose[0] = bxmin;
          if (bymin < pLoose[1]) pLoose[1] = bymin;
          if (bzmin < pLoose[2]) pLoose[2] = bzmin;
          if (bxmax > pLoose[3]) pLoose[3] = bxmax;
          if (bymax > pLoose[4]) pLoose[4] = bymax;
          if (bzmax > pLoose[5]) pLoose[5] = bzmax;
          parent = parent.parent_;
        }
      }
    },
    /** Construct sub cells of the octree */
    constructCells: function (mesh) {
      var split = this.aabbSplit_;
      var xmin = split[0];
      var ymin = split[1];
      var zmin = split[2];
      var xmax = split[3];
      var ymax = split[4];
      var zmax = split[5];
      var dX = (xmax - xmin) * 0.5;
      var dY = (ymax - ymin) * 0.5;
      var dZ = (zmax - zmin) * 0.5;
      var xcen = (xmax + xmin) * 0.5;
      var ycen = (ymax + ymin) * 0.5;
      var zcen = (zmax + zmin) * 0.5;

      var iTris0 = [];
      var iTris1 = [];
      var iTris2 = [];
      var iTris3 = [];
      var iTris4 = [];
      var iTris5 = [];
      var iTris6 = [];
      var iTris7 = [];
      var triCenters = mesh.triCentersXYZ_;
      var iTris = this.iTris_;
      var nbTriangles = iTris.length;
      for (var i = 0; i < nbTriangles; ++i) {
        var iTri = iTris[i];
        var id = iTri * 3;
        var cx = triCenters[id];
        var cy = triCenters[id + 1];
        var cz = triCenters[id + 2];

        if (cx > xcen) {
          if (cy > ycen) {
            if (cz > zcen)
              iTris6.push(iTri);
            else
              iTris5.push(iTri);
          } else {
            if (cz > zcen)
              iTris2.push(iTri);
            else
              iTris1.push(iTri);
          }
        } else {
          if (cy > ycen) {
            if (cz > zcen)
              iTris7.push(iTri);
            else
              iTris4.push(iTri);
          } else {
            if (cz > zcen)
              iTris3.push(iTri);
            else
              iTris0.push(iTri);
          }
        }
      }
      var nextDepth = this.depth_ + 1;

      var child0 = new Octree(this, nextDepth);
      child0.setAabbSplit(xmin, ymin, zmin, xcen, ycen, zcen);
      child0.build(mesh, iTris0);

      var child1 = new Octree(this, nextDepth);
      child1.setAabbSplit(xmin + dX, ymin, zmin, xcen + dX, ycen, zcen);
      child1.build(mesh, iTris1);

      var child2 = new Octree(this, nextDepth);
      child2.setAabbSplit(xcen, ycen - dY, zcen, xmax, ymax - dY, zmax);
      child2.build(mesh, iTris2);

      var child3 = new Octree(this, nextDepth);
      child3.setAabbSplit(xmin, ymin, zmin + dZ, xcen, ycen, zcen + dZ);
      child3.build(mesh, iTris3);

      var child4 = new Octree(this, nextDepth);
      child4.setAabbSplit(xmin, ymin + dY, zmin, xcen, ycen + dY, zcen);
      child4.build(mesh, iTris4);

      var child5 = new Octree(this, nextDepth);
      child5.setAabbSplit(xcen, ycen, zcen - dZ, xmax, ymax, zmax - dZ);
      child5.build(mesh, iTris5);

      var child6 = new Octree(this, nextDepth);
      child6.setAabbSplit(xcen, ycen, zcen, xmax, ymax, zmax);
      child6.build(mesh, iTris6);

      var child7 = new Octree(this, nextDepth);
      child7.setAabbSplit(xcen - dX, ycen, zcen, xmax - dX, ymax, zmax);
      child7.build(mesh, iTris7);

      this.children_.length = 0;
      this.children_.push(child0, child1, child2, child3, child4, child5, child6, child7);
      iTris.length = 0;
    },
    setAabbSplit: function (xmin, ymin, zmin, xmax, ymax, zmax) {
      var aabb = this.aabbSplit_;
      aabb[0] = xmin;
      aabb[1] = ymin;
      aabb[2] = zmin;
      aabb[3] = xmax;
      aabb[4] = ymax;
      aabb[5] = zmax;
    },
    /** Return triangles intersected by a ray */
    intersectRay: function (vNear, rayInv, hint) {
      var collectTris = new Uint32Array(Utils.getMemory(hint * 4));
      var acc = [0];
      this.collectIntersectRay(vNear, rayInv, collectTris, acc);
      return new Uint32Array(collectTris.subarray(0, acc[0]));
    },
    /** Collect triangles in cells hit by a ray */
    collectIntersectRay: function (vNear, rayInv, collectTris, acc) {
      var loose = this.aabbLoose_;
      var irx = rayInv[0];
      var iry = rayInv[1];
      var irz = rayInv[2];
      var vx = vNear[0];
      var vy = vNear[1];
      var vz = vNear[2];
      var t1 = (loose[0] - vx) * irx;
      var t3 = (loose[1] - vy) * iry;
      var t5 = (loose[2] - vz) * irz;
      var t2 = (loose[3] - vx) * irx;
      var t4 = (loose[4] - vy) * iry;
      var t6 = (loose[5] - vz) * irz;
      var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
      var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
      if (tmax < 0 || tmin >= tmax) // no intersection
        return;
      if (this.children_.length === 8) {
        var children = this.children_;
        for (var i = 0; i < 8; ++i) {
          children[i].collectIntersectRay(vNear, rayInv, collectTris, acc);
        }
      } else {
        collectTris.set(this.iTris_, acc[0]);
        acc[0] += this.iTris_.length;
      }
    },
    /** Return triangles inside a sphere */
    intersectSphere: function (vert, radiusSquared, leavesHit, hint) {
      var collectTris = new Uint32Array(Utils.getMemory(hint * 4));
      var acc = [0];
      this.collectIntersectSphere(vert, radiusSquared, leavesHit, collectTris, acc);
      return new Uint32Array(collectTris.subarray(0, acc[0]));
    },
    /** Collect triangles inside a sphere */
    collectIntersectSphere: function (vert, radiusSquared, leavesHit, collectTris, acc) {
      var split = this.aabbLoose_;
      var vx = vert[0];
      var vy = vert[1];
      var vz = vert[2];
      var dx = 0.0;
      var dy = 0.0;
      var dz = 0.0;
      if (split[0] > vx) dx = split[0] - vx;
      else if (split[3] < vx) dx = split[3] - vx;
      else dx = 0.0;

      if (split[1] > vy) dy = split[1] - vy;
      else if (split[4] < vy) dy = split[4] - vy;
      else dy = 0.0;

      if (split[2] > vz) dz = split[2] - vz;
      else if (split[5] < vz) dz = split[5] - vz;
      else dz = 0.0;

      if ((dx * dx + dy * dy + dz * dz) > radiusSquared) // no intersection
        return;
      if (this.children_.length === 8) {
        var children = this.children_;
        for (var i = 0; i < 8; ++i) {
          children[i].collectIntersectSphere(vert, radiusSquared, leavesHit, collectTris, acc);
        }
      } else {
        leavesHit.push(this);
        collectTris.set(this.iTris_, acc[0]);
        acc[0] += this.iTris_.length;
      }
    },
    /** Add triangle in the octree, subdivide the cell if necessary */
    addTriangle: function (triId, aabb, center) {
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var split = this.aabbSplit_;
      if (cx <= split[0]) return;
      if (cy <= split[1]) return;
      if (cz <= split[2]) return;
      if (cx > split[3]) return;
      if (cy > split[4]) return;
      if (cz > split[5]) return;
      var loose = this.aabbLoose_;
      // expands cell aabb loose with aabb tri
      var bxmin = aabb[0];
      var bymin = aabb[1];
      var bzmin = aabb[2];
      var bxmax = aabb[3];
      var bymax = aabb[4];
      var bzmax = aabb[5];
      if (bxmin < loose[0]) loose[0] = bxmin;
      if (bymin < loose[1]) loose[1] = bymin;
      if (bzmin < loose[2]) loose[2] = bzmin;
      if (bxmax > loose[3]) loose[3] = bxmax;
      if (bymax > loose[4]) loose[4] = bymax;
      if (bzmax > loose[5]) loose[5] = bzmax;
      var children = this.children_;
      if (children.length === 8) {
        for (var i = 0; i < 8; ++i) {
          var cell = children[i].addTriangle(triId, aabb, center);
          if (cell)
            return cell;
        }
        return;
      } else {
        this.iTris_.push(triId);
        return this;
      }
    },
    /** Cut leaves if needed */
    checkEmptiness: function () {
      var parent = this.parent_;
      if (parent && parent.children_.length === 8) {
        var children = parent.children_;
        for (var i = 0; i < 8; ++i) {
          var child = children[i];
          if (child.iTris_.length > 0 || child.children_.length === 8)
            return;
        }
        children.length = 0;
        parent.checkEmptiness();
      }
    }
  };

  return Octree;
});