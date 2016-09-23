class OctreeCell {

  constructor(parent) {
    this._parent = parent ? parent : null; // parent
    this._depth = parent ? parent._depth + 1 : 0; // depth of current node
    this._children = []; // children

    // extended boundary for intersect test
    this._aabbLoose = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];

    // boundary in order to store exactly the face according to their center
    this._aabbSplit = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    this._iFaces = []; // faces (if cell is a leaf)

    this._flag = 0; // to track deleted cell
  }

  resetNbFaces(nbFaces) {
    var facesAll = this._iFaces;
    facesAll.length = nbFaces;
    for (var i = 0; i < nbFaces; ++i)
      facesAll[i] = i;
  }

  /** Subdivide octree, aabbSplit must be already set, and aabbLoose will be expanded if it's a leaf  */
  build(mesh) {
    var i = 0;

    var stack = OctreeCell.STACK;
    stack[0] = this;
    var curStack = 1;
    var leaves = [];
    while (curStack > 0) {
      var cell = stack[--curStack];
      var nbFaces = cell._iFaces.length;
      if (nbFaces > OctreeCell.MAX_FACES && cell._depth < OctreeCell.MAX_DEPTH) {
        cell.constructChildren(mesh);
        var children = cell._children;
        for (i = 0; i < 8; ++i)
          stack[curStack + i] = children[i];
        curStack += 8;
      } else if (nbFaces > 0) {
        leaves.push(cell);
      }
    }

    var nbLeaves = leaves.length;
    for (i = 0; i < nbLeaves; ++i)
      leaves[i].constructLeaf(mesh);
  }

  /** Construct the leaf  */
  constructLeaf(mesh) {
    var iFaces = this._iFaces;
    var nbFaces = iFaces.length;
    var bxmin = Infinity;
    var bymin = Infinity;
    var bzmin = Infinity;
    var bxmax = -Infinity;
    var bymax = -Infinity;
    var bzmax = -Infinity;
    var faceBoxes = mesh.getFaceBoxes();
    var facePosInLeaf = mesh.getFacePosInLeaf();
    var faceLeaf = mesh.getFaceLeaf();
    for (var i = 0; i < nbFaces; ++i) {
      var id = iFaces[i];
      faceLeaf[id] = this;
      facePosInLeaf[id] = i;
      id *= 6;
      var xmin = faceBoxes[id];
      var ymin = faceBoxes[id + 1];
      var zmin = faceBoxes[id + 2];
      var xmax = faceBoxes[id + 3];
      var ymax = faceBoxes[id + 4];
      var zmax = faceBoxes[id + 5];
      if (xmin < bxmin) bxmin = xmin;
      if (xmax > bxmax) bxmax = xmax;
      if (ymin < bymin) bymin = ymin;
      if (ymax > bymax) bymax = ymax;
      if (zmin < bzmin) bzmin = zmin;
      if (zmax > bzmax) bzmax = zmax;
    }
    this.expandsAabbLoose(bxmin, bymin, bzmin, bxmax, bymax, bzmax);
  }

  /** Construct sub cells of the octree */
  constructChildren(mesh) {
    var split = this._aabbSplit;
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

    var child0 = new OctreeCell(this);
    var child1 = new OctreeCell(this);
    var child2 = new OctreeCell(this);
    var child3 = new OctreeCell(this);
    var child4 = new OctreeCell(this);
    var child5 = new OctreeCell(this);
    var child6 = new OctreeCell(this);
    var child7 = new OctreeCell(this);

    var iFaces0 = child0._iFaces;
    var iFaces1 = child1._iFaces;
    var iFaces2 = child2._iFaces;
    var iFaces3 = child3._iFaces;
    var iFaces4 = child4._iFaces;
    var iFaces5 = child5._iFaces;
    var iFaces6 = child6._iFaces;
    var iFaces7 = child7._iFaces;
    var faceCenters = mesh.getFaceCenters();
    var iFaces = this._iFaces;
    var nbFaces = iFaces.length;
    for (var i = 0; i < nbFaces; ++i) {
      var iFace = iFaces[i];
      var id = iFace * 3;
      var cx = faceCenters[id];
      var cy = faceCenters[id + 1];
      var cz = faceCenters[id + 2];

      if (cx > xcen) {
        if (cy > ycen) {
          if (cz > zcen) iFaces6.push(iFace);
          else iFaces5.push(iFace);
        } else {
          if (cz > zcen) iFaces2.push(iFace);
          else iFaces1.push(iFace);
        }
      } else {
        if (cy > ycen) {
          if (cz > zcen) iFaces7.push(iFace);
          else iFaces4.push(iFace);
        } else {
          if (cz > zcen) iFaces3.push(iFace);
          else iFaces0.push(iFace);
        }
      }
    }

    child0.setAabbSplit(xmin, ymin, zmin, xcen, ycen, zcen);
    child1.setAabbSplit(xmin + dX, ymin, zmin, xcen + dX, ycen, zcen);
    child2.setAabbSplit(xcen, ycen - dY, zcen, xmax, ymax - dY, zmax);
    child3.setAabbSplit(xmin, ymin, zmin + dZ, xcen, ycen, zcen + dZ);
    child4.setAabbSplit(xmin, ymin + dY, zmin, xcen, ycen + dY, zcen);
    child5.setAabbSplit(xcen, ycen, zcen - dZ, xmax, ymax, zmax - dZ);
    child6.setAabbSplit(xcen, ycen, zcen, xmax, ymax, zmax);
    child7.setAabbSplit(xcen - dX, ycen, zcen, xmax - dX, ymax, zmax);

    this._children.length = 0;
    this._children.push(child0, child1, child2, child3, child4, child5, child6, child7);
    iFaces.length = 0;
  }

  setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax) {
    var aabb = this._aabbSplit;
    aabb[0] = xmin;
    aabb[1] = ymin;
    aabb[2] = zmin;
    aabb[3] = xmax;
    aabb[4] = ymax;
    aabb[5] = zmax;
  }

  setAabbLoose(xmin, ymin, zmin, xmax, ymax, zmax) {
    var aabb = this._aabbLoose;
    aabb[0] = xmin;
    aabb[1] = ymin;
    aabb[2] = zmin;
    aabb[3] = xmax;
    aabb[4] = ymax;
    aabb[5] = zmax;
  }

  /** Collect faces in cells hit by a ray */
  collectIntersectRay(vNear, eyeDir, collectFaces, leavesHit) {
    var vx = vNear[0];
    var vy = vNear[1];
    var vz = vNear[2];
    var irx = 1.0 / eyeDir[0];
    var iry = 1.0 / eyeDir[1];
    var irz = 1.0 / eyeDir[2];
    var acc = 0;

    var stack = OctreeCell.STACK;
    stack[0] = this;
    var curStack = 1;
    while (curStack > 0) {
      var cell = stack[--curStack];
      var loose = cell._aabbLoose;
      var t1 = (loose[0] - vx) * irx;
      var t2 = (loose[3] - vx) * irx;
      var t3 = (loose[1] - vy) * iry;
      var t4 = (loose[4] - vy) * iry;
      var t5 = (loose[2] - vz) * irz;
      var t6 = (loose[5] - vz) * irz;
      var tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
      var tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));
      if (tmax < 0 || tmin > tmax) // no intersection
        continue;

      var children = cell._children;
      if (children.length === 8) {
        for (var i = 0; i < 8; ++i)
          stack[curStack + i] = children[i];
        curStack += 8;
      } else {
        if (leavesHit) leavesHit.push(cell);
        var iFaces = cell._iFaces;
        collectFaces.set(iFaces, acc);
        acc += iFaces.length;
      }
    }
    return new Uint32Array(collectFaces.subarray(0, acc));
  }

  /** Collect faces inside a sphere */
  collectIntersectSphere(vert, radiusSquared, collectFaces, leavesHit) {
    var vx = vert[0];
    var vy = vert[1];
    var vz = vert[2];
    var acc = 0;

    var stack = OctreeCell.STACK;
    stack[0] = this;
    var curStack = 1;
    while (curStack > 0) {
      var cell = stack[--curStack];
      var loose = cell._aabbLoose;
      var dx = 0.0;
      var dy = 0.0;
      var dz = 0.0;

      if (loose[0] > vx) dx = loose[0] - vx;
      else if (loose[3] < vx) dx = loose[3] - vx;
      else dx = 0.0;

      if (loose[1] > vy) dy = loose[1] - vy;
      else if (loose[4] < vy) dy = loose[4] - vy;
      else dy = 0.0;

      if (loose[2] > vz) dz = loose[2] - vz;
      else if (loose[5] < vz) dz = loose[5] - vz;
      else dz = 0.0;

      if ((dx * dx + dy * dy + dz * dz) > radiusSquared) // no intersection
        continue;

      var children = cell._children;
      if (children.length === 8) {
        for (var i = 0; i < 8; ++i)
          stack[curStack + i] = children[i];
        curStack += 8;
      } else {
        if (leavesHit) leavesHit.push(cell);
        var iFaces = cell._iFaces;
        collectFaces.set(iFaces, acc);
        acc += iFaces.length;
      }
    }
    return new Uint32Array(collectFaces.subarray(0, acc));
  }

  /** Add a face in the octree, subdivide the cell if necessary */
  addFace(faceId, bxmin, bymin, bzmin, bxmax, bymax, bzmax, cx, cy, cz) {
    var stack = OctreeCell.STACK;
    stack[0] = this;
    var curStack = 1;
    while (curStack > 0) {
      var cell = stack[--curStack];
      var split = cell._aabbSplit;
      if (cx <= split[0]) continue;
      if (cy <= split[1]) continue;
      if (cz <= split[2]) continue;
      if (cx > split[3]) continue;
      if (cy > split[4]) continue;
      if (cz > split[5]) continue;

      var loose = cell._aabbLoose;
      // expands cell aabb loose with aabb face
      if (bxmin < loose[0]) loose[0] = bxmin;
      if (bymin < loose[1]) loose[1] = bymin;
      if (bzmin < loose[2]) loose[2] = bzmin;
      if (bxmax > loose[3]) loose[3] = bxmax;
      if (bymax > loose[4]) loose[4] = bymax;
      if (bzmax > loose[5]) loose[5] = bzmax;
      var children = cell._children;

      if (children.length === 8) {
        for (var i = 0; i < 8; ++i)
          stack[curStack + i] = children[i];
        curStack += 8;
      } else {
        cell._iFaces.push(faceId);
        return cell;
      }
    }
  }

  /** Cut leaves if needed */
  pruneIfPossible() {
    var cell = this;
    while (cell._parent) {
      var parent = cell._parent;

      var children = parent._children;
      // means that the current cell has already pruned
      if (children.length === 0)
        return;

      // check if we can prune
      for (var i = 0; i < 8; ++i) {
        var child = children[i];
        if (child._iFaces.length > 0 || child._children.length === 8) {
          return;
        }
      }

      children.length = 0;
      cell = parent;
    }
  }

  /** Expand aabb loose */
  expandsAabbLoose(bxmin, bymin, bzmin, bxmax, bymax, bzmax) {
    var parent = this;
    while (parent) {
      var pLoose = parent._aabbLoose;
      var proceed = false;
      if (bxmin < pLoose[0]) {
        pLoose[0] = bxmin;
        proceed = true;
      }
      if (bymin < pLoose[1]) {
        pLoose[1] = bymin;
        proceed = true;
      }
      if (bzmin < pLoose[2]) {
        pLoose[2] = bzmin;
        proceed = true;
      }
      if (bxmax > pLoose[3]) {
        pLoose[3] = bxmax;
        proceed = true;
      }
      if (bymax > pLoose[4]) {
        pLoose[4] = bymax;
        proceed = true;
      }
      if (bzmax > pLoose[5]) {
        pLoose[5] = bzmax;
        proceed = true;
      }
      parent = proceed ? parent._parent : null;
    }
  }
}

OctreeCell.FLAG = 0;

OctreeCell.MAX_DEPTH = 8;
OctreeCell.MAX_FACES = 100; // maximum faces per cell
(function () {
  var nb = 1 + 7 * OctreeCell.MAX_DEPTH;
  var stack = OctreeCell.STACK = new Array(nb);
  for (var i = 0; i < nb; ++i)
    stack[i] = null;
})();

export default OctreeCell;
