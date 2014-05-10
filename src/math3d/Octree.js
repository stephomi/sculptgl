define([
  'misc/Utils',
  'math3d/OctreeCell'
], function (Utils, OctreeCell) {

  'use strict';

  function Octree(mesh) {
    this.mesh_ = mesh; // the mesh
    this.root_ = null; // root octree cell

    this.triPosInLeaf_ = null; // position index in the leaf (Uint32Array)
    this.triLeaf_ = []; // octree leaf
    this.leavesUpdate_ = []; // leaves of the octree to check
  }

  Octree.prototype = {
    getTriPosInLeaf: function () {
      return this.triPosInLeaf_;
    },
    getTriLeaf: function () {
      return this.triLeaf_;
    },
    getLeavesUpdate: function () {
      return this.leavesUpdate_;
    },
    getBound: function () {
      return this.root_.aabbSplit_;
    },
    allocateArrays: function () {
      var nbTriangles = this.mesh_.getNbTriangles();
      this.triPosInLeaf_ = new Uint32Array(nbTriangles);
      var triLeaf = this.triLeaf_;
      triLeaf.length = nbTriangles;
      for (var i = 0; i < nbTriangles; ++i)
        triLeaf[i] = null;
    },
    /** Return triangles intersected by a ray */
    intersectRay: function (vNear, eyeDir, hint) {
      var collectTris = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this.root_.collectIntersectRay(vNear, eyeDir, collectTris);
    },
    /** Return triangles inside a sphere */
    intersectSphere: function (vert, radiusSquared, leavesHit, hint) {
      var collectTris = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this.root_.collectIntersectSphere(vert, radiusSquared, leavesHit, collectTris);
    },
    /**
     * Update Octree
     * For each triangle we check if its position inside the octree has changed
     * if so... we mark this triangle and we remove it from its former cells
     * We push back the marked triangles into the octree
     */
    updateOctree: function (iTris) {
      if (iTris)
        this.updateOctreeAdd(this.updateOctreeRemove(iTris));
      else
        this.computeOctree(undefined, 0.3);
      this.mesh_.computeCenter();
    },
    /** Compute Aabb */
    computeAabb: function () {
      var mesh = this.mesh_;
      var nbVertices = mesh.getNbVertices();
      var vAr = mesh.getVertices();
      var xmin = Infinity;
      var ymin = Infinity;
      var zmin = Infinity;
      var xmax = -Infinity;
      var ymax = -Infinity;
      var zmax = -Infinity;
      for (var i = 0; i < nbVertices; ++i) {
        var j = i * 3;
        var vx = vAr[j];
        var vy = vAr[j + 1];
        var vz = vAr[j + 2];
        if (vx < xmin) xmin = vx;
        if (vx > xmax) xmax = vx;
        if (vy < ymin) ymin = vy;
        if (vy > ymax) ymax = vy;
        if (vz < zmin) zmin = vz;
        if (vz > zmax) zmax = vz;
      }
      return [xmin, ymin, zmin, xmax, ymax, zmax];
    },
    /** Compute the mesh octree */
    computeOctree: function (abRoot, factor) {
      var mesh = this.mesh_;
      if (abRoot === undefined)
        abRoot = this.computeAabb();
      var xmin = abRoot[0];
      var ymin = abRoot[1];
      var zmin = abRoot[2];
      var xmax = abRoot[3];
      var ymax = abRoot[4];
      var zmax = abRoot[5];
      var dx = xmax - xmin;
      var dy = ymax - ymin;
      var dz = zmax - zmin;
      // root octree bigger than minimum aabb...
      if (factor !== undefined && factor !== 0.0) {
        var dfx = dx * factor;
        var dfy = dy * factor;
        var dfz = dz * factor;
        xmin -= dfx;
        xmax += dfx;
        ymin -= dfy;
        ymax += dfy;
        zmin -= dfz;
        zmax += dfz;
      }
      var offset = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.2;
      if (xmin === xmax) {
        xmin -= offset;
        xmax += offset;
      }
      if (ymin === ymax) {
        ymin -= offset;
        ymax += offset;
      }
      if (zmin === zmax) {
        zmin -= offset;
        zmax += offset;
      }

      // octree construction
      var nbTriangles = mesh.getNbTriangles();
      var trianglesAll = [];
      trianglesAll.length = nbTriangles;
      for (var i = 0; i < nbTriangles; ++i)
        trianglesAll[i] = i;
      this.root_ = new OctreeCell();
      this.root_.setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax);
      this.root_.build(mesh, trianglesAll);
    },
    updateOctreeRemove: function (iTris) {
      var mesh = this.mesh_;
      var triCenters = mesh.getTriCenters();
      var tboxes = mesh.getTriBoxes();
      var triPosInLeaf = this.triPosInLeaf_;
      var triLeaf = this.triLeaf_;
      var nbTris = iTris.length;
      var acc = 0;
      var trisToMove = new Uint32Array(Utils.getMemory(4 * nbTris), 0, nbTris);
      // recompute position inside the octree
      for (var i = 0; i < nbTris; ++i) {
        var idTri = iTris[i];
        var idb = idTri * 6;
        var idCen = idTri * 3;
        var leaf = triLeaf[idTri];
        var ab = leaf.aabbSplit_;

        var vx = triCenters[idCen];
        var vy = triCenters[idCen + 1];
        var vz = triCenters[idCen + 2];

        if (vx <= ab[0] || vy <= ab[1] || vz <= ab[2] || vx > ab[3] || vy > ab[4] || vz > ab[5]) {
          // a triangle center has moved from its cell
          trisToMove[acc++] = iTris[i];
          var trisInLeaf = leaf.iTris_;
          if (trisInLeaf.length > 0) { // remove tris from octree cell
            var iTriLast = trisInLeaf[trisInLeaf.length - 1];
            var iPos = triPosInLeaf[idTri];
            trisInLeaf[iPos] = iTriLast;
            triPosInLeaf[iTriLast] = iPos;
            trisInLeaf.pop();
          }
        } else { // expands cell aabb loose if necessary
          leaf.expandsAabbLoose(tboxes[idb], tboxes[idb + 1], tboxes[idb + 2], tboxes[idb + 3], tboxes[idb + 4], tboxes[idb + 5]);
        }
      }
      return new Uint32Array(trisToMove.subarray(0, acc));
    },
    updateOctreeAdd: function (trisToMove) {
      var mesh = this.mesh_;
      var triCenters = mesh.getTriCenters();
      var triBoxes = mesh.getTriBoxes();
      var triPosInLeaf = this.triPosInLeaf_;
      var triLeaf = this.triLeaf_;
      var nbTrisToMove = trisToMove.length;

      var root = this.root_;
      var rootLoose = root.aabbLoose_;
      var xmin = rootLoose[0];
      var ymin = rootLoose[1];
      var zmin = rootLoose[2];
      var xmax = rootLoose[3];
      var ymax = rootLoose[4];
      var zmax = rootLoose[5];
      for (var i = 0; i < nbTrisToMove; ++i) { // add triangle to the octree
        var idTri = trisToMove[i];
        var idCen = idTri * 3;
        var idBox = idTri * 6;
        var tc = triCenters.subarray(idCen, idCen + 3);
        var tb = triBoxes.subarray(idBox, idBox + 6);
        if (tb[0] > xmax || tb[3] < xmin || tb[1] > ymax || tb[4] < ymin || tb[2] > zmax || tb[5] < zmin) {
          // a triangle is outside the root node
          // we reconstruct the whole octree, slow... but rare
          this.computeOctree(undefined, 0.3);
          this.leavesUpdate_.length = 0;
          break;
        } else {
          var leaf = triLeaf[idTri];
          var newleaf = root.addTriangle(idTri, tb, tc);
          if (newleaf) {
            triPosInLeaf[idTri] = newleaf.iTris_.length - 1;
            triLeaf[idTri] = newleaf;
          } else { // failed to insert tri in octree, re-insert it back
            var trisLeaf = leaf.iTris_;
            triPosInLeaf[idTri] = trisLeaf.length;
            trisLeaf.push(trisToMove[i]);
          }
        }
      }
    },
    /** End of stroke, update octree (cut empty leaves or go deeper if needed) */
    checkLeavesUpdate: function () {
      Utils.tidy(this.leavesUpdate_);
      var leavesUpdate = this.leavesUpdate_;
      var nbLeaves = leavesUpdate.length;
      var cutLeaves = [];
      var maxTriangles = OctreeCell.MAX_TRIANGLES;
      var maxDepth = OctreeCell.MAX_DEPTH;
      for (var i = 0; i < nbLeaves; ++i) {
        var leaf = leavesUpdate[i];
        if (leaf === null)
          break;
        if (!leaf.iTris_.length)
          leaf.checkEmptiness(cutLeaves);
        else if (leaf.iTris_.length > maxTriangles && leaf.depth_ < maxDepth)
          leaf.build(this.mesh_, leaf.iTris_);
      }
      this.leavesUpdate_.length = 0;
    }
  };

  return Octree;
});