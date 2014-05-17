define([
  'misc/Utils',
  'math3d/OctreeCell'
], function (Utils, OctreeCell) {

  'use strict';

  function Octree(mesh) {
    this.mesh_ = mesh; // the mesh
    this.root_ = null; // root octree cell

    this.facePosInLeaf_ = null; // position index in the leaf (Uint32Array)
    this.faceLeaf_ = []; // octree leaf
    this.leavesUpdate_ = []; // leaves of the octree to check
  }

  Octree.prototype = {
    getFacePosInLeaf: function () {
      return this.facePosInLeaf_;
    },
    getFaceLeaf: function () {
      return this.faceLeaf_;
    },
    getLeavesUpdate: function () {
      return this.leavesUpdate_;
    },
    getBound: function () {
      return this.root_.aabbSplit_;
    },
    allocateArrays: function () {
      var nbFaces = this.mesh_.getNbFaces();
      this.facePosInLeaf_ = new Uint32Array(nbFaces);
      var faceLeaf = this.faceLeaf_;
      faceLeaf.length = nbFaces;
      for (var i = 0; i < nbFaces; ++i)
        faceLeaf[i] = null;
    },
    /** Return faces intersected by a ray */
    intersectRay: function (vNear, eyeDir, hint) {
      var collectFaces = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this.root_.collectIntersectRay(vNear, eyeDir, collectFaces);
    },
    /** Return faces inside a sphere */
    intersectSphere: function (vert, radiusSquared, leavesHit, hint) {
      var collectFaces = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this.root_.collectIntersectSphere(vert, radiusSquared, leavesHit, collectFaces);
    },
    /**
     * Update Octree
     * For each faces we check if its position inside the octree has changed
     * if so... we mark this face and we remove it from its former cells
     * We push back the marked faces into the octree
     */
    updateOctree: function (iFaces) {
      if (iFaces)
        this.updateOctreeAdd(this.updateOctreeRemove(iFaces));
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
      var nbFaces = mesh.getNbFaces();
      var facesAll = [];
      facesAll.length = nbFaces;
      for (var i = 0; i < nbFaces; ++i)
        facesAll[i] = i;
      this.root_ = new OctreeCell();
      this.root_.setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax);
      this.root_.build(mesh, facesAll);
    },
    updateOctreeRemove: function (iFaces) {
      var mesh = this.mesh_;
      var faceCenters = mesh.getFaceCenters();
      var fboxes = mesh.getFaceBoxes();
      var facePosInLeaf = this.facePosInLeaf_;
      var faceLeaf = this.faceLeaf_;
      var nbFaces = iFaces.length;
      var acc = 0;
      var facesToMove = new Uint32Array(Utils.getMemory(4 * nbFaces), 0, nbFaces);
      // recompute position inside the octree
      for (var i = 0; i < nbFaces; ++i) {
        var idFace = iFaces[i];
        var idb = idFace * 6;
        var idCen = idFace * 3;
        var leaf = faceLeaf[idFace];
        var ab = leaf.aabbSplit_;

        var vx = faceCenters[idCen];
        var vy = faceCenters[idCen + 1];
        var vz = faceCenters[idCen + 2];

        if (vx <= ab[0] || vy <= ab[1] || vz <= ab[2] || vx > ab[3] || vy > ab[4] || vz > ab[5]) {
          // a face center has moved from its cell
          facesToMove[acc++] = iFaces[i];
          var facesInLeaf = leaf.iFaces_;
          if (facesInLeaf.length > 0) { // remove faces from octree cell
            var iFaceLast = facesInLeaf[facesInLeaf.length - 1];
            var iPos = facePosInLeaf[idFace];
            facesInLeaf[iPos] = iFaceLast;
            facePosInLeaf[iFaceLast] = iPos;
            facesInLeaf.pop();
          }
        } else { // expands cell aabb loose if necessary
          leaf.expandsAabbLoose(fboxes[idb], fboxes[idb + 1], fboxes[idb + 2], fboxes[idb + 3], fboxes[idb + 4], fboxes[idb + 5]);
        }
      }
      return new Uint32Array(facesToMove.subarray(0, acc));
    },
    updateOctreeAdd: function (facesToMove) {
      var mesh = this.mesh_;
      var faceCenters = mesh.getFaceCenters();
      var faceBoxes = mesh.getFaceBoxes();
      var facePosInLeaf = this.facePosInLeaf_;
      var faceLeaf = this.faceLeaf_;
      var nbFacesToMove = facesToMove.length;

      var root = this.root_;
      var rootLoose = root.aabbLoose_;
      var xmin = rootLoose[0];
      var ymin = rootLoose[1];
      var zmin = rootLoose[2];
      var xmax = rootLoose[3];
      var ymax = rootLoose[4];
      var zmax = rootLoose[5];
      for (var i = 0; i < nbFacesToMove; ++i) { // add face to the octree
        var idFace = facesToMove[i];
        var idCen = idFace * 3;
        var idBox = idFace * 6;
        var fc = faceCenters.subarray(idCen, idCen + 3);
        var fb = faceBoxes.subarray(idBox, idBox + 6);
        if (fb[0] > xmax || fb[3] < xmin || fb[1] > ymax || fb[4] < ymin || fb[2] > zmax || fb[5] < zmin) {
          // a face is outside the root node
          // we reconstruct the whole octree, slow... but rare
          this.computeOctree(undefined, 0.3);
          this.leavesUpdate_.length = 0;
          break;
        } else {
          var leaf = faceLeaf[idFace];
          var newleaf = root.addFace(idFace, fb, fc);
          if (newleaf) {
            facePosInLeaf[idFace] = newleaf.iFaces_.length - 1;
            faceLeaf[idFace] = newleaf;
          } else { // failed to insert face in octree, re-insert it back
            var facesInLeaf = leaf.iFaces_;
            facePosInLeaf[idFace] = facesInLeaf.length;
            facesInLeaf.push(facesToMove[i]);
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
      var maxFaces = OctreeCell.MAX_FACES;
      var maxDepth = OctreeCell.MAX_DEPTH;
      for (var i = 0; i < nbLeaves; ++i) {
        var leaf = leavesUpdate[i];
        if (leaf === null)
          break;
        if (!leaf.iFaces_.length)
          leaf.checkEmptiness(cutLeaves);
        else if (leaf.iFaces_.length > maxFaces && leaf.depth_ < maxDepth)
          leaf.build(this.mesh_, leaf.iFaces_);
      }
      this.leavesUpdate_.length = 0;
    }
  };

  return Octree;
});