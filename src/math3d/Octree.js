define(function (require, exports, module) {

  'use strict';

  var Utils = require('misc/Utils');
  var OctreeCell = require('math3d/OctreeCell');

  var Octree = function (mesh) {
    this._mesh = mesh; // the mesh
    this._root = null; // root octree cell

    this._facePosInLeaf = null; // position index in the leaf (Uint32Array)
    this._faceLeaf = []; // octree leaf
    this._leavesUpdate = []; // leaves of the octree to check
  };

  Octree.prototype = {
    getFacePosInLeaf: function () {
      return this._facePosInLeaf;
    },
    getFaceLeaf: function () {
      return this._faceLeaf;
    },
    getLeavesUpdate: function () {
      return this._leavesUpdate;
    },
    getLocalBound: function () {
      return this._root._aabbSplit;
    },
    allocateArrays: function () {
      var nbFaces = this._mesh.getNbFaces();
      this._facePosInLeaf = new Uint32Array(nbFaces);
      var faceLeaf = this._faceLeaf;
      faceLeaf.length = nbFaces;
      for (var i = 0; i < nbFaces; ++i)
        faceLeaf[i] = null;
    },
    /** ONLY FOR DYNAMIC MESH */
    reAllocateArrays: function (nbAddElements) {
      var mesh = this._mesh;
      var nbDyna = this._facePosInLeaf.length;
      var nbTriangles = mesh.getNbTriangles();
      var len = nbTriangles + nbAddElements;
      if (nbDyna < len || nbDyna > len * 4) {
        this._facePosInLeaf = mesh.resizeArray(this._facePosInLeaf, len);
      }
    },
    /** Return faces intersected by a ray */
    intersectRay: function (vNear, eyeDir, hint) {
      var collectFaces = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this._root.collectIntersectRay(vNear, eyeDir, collectFaces);
    },
    /** Return faces inside a sphere */
    intersectSphere: function (vert, radiusSquared, leavesHit, hint) {
      var collectFaces = new Uint32Array(Utils.getMemory(hint * 4), 0, hint);
      return this._root.collectIntersectSphere(vert, radiusSquared, leavesHit, collectFaces);
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
        this.computeOctree(0.3);
    },
    computeAabb: function () {
      var mesh = this._mesh;
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
    computeOctree: function (factor) {
      var mesh = this._mesh;
      var abRoot = this.computeAabb();
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
      if (factor) {
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
      this._root = new OctreeCell();
      this._root.setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax);
      this._root.build(mesh, facesAll);
    },
    updateOctreeRemove: function (iFaces) {
      var mesh = this._mesh;
      var faceCenters = mesh.getFaceCenters();
      var fboxes = mesh.getFaceBoxes();
      var facePosInLeaf = this._facePosInLeaf;
      var faceLeaf = this._faceLeaf;
      var nbFaces = iFaces.length;
      var acc = 0;
      var facesToMove = new Uint32Array(Utils.getMemory(4 * nbFaces), 0, nbFaces);
      // recompute position inside the octree
      for (var i = 0; i < nbFaces; ++i) {
        var idFace = iFaces[i];
        var idb = idFace * 6;
        var idCen = idFace * 3;
        var leaf = faceLeaf[idFace];
        var ab = leaf._aabbSplit;

        var vx = faceCenters[idCen];
        var vy = faceCenters[idCen + 1];
        var vz = faceCenters[idCen + 2];

        if (vx <= ab[0] || vy <= ab[1] || vz <= ab[2] || vx > ab[3] || vy > ab[4] || vz > ab[5]) {
          // a face center has moved from its cell
          facesToMove[acc++] = iFaces[i];
          var facesInLeaf = leaf._iFaces;
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
      var mesh = this._mesh;
      var fc = mesh.getFaceCenters();
      var fb = mesh.getFaceBoxes();
      var facePosInLeaf = this._facePosInLeaf;
      var faceLeaf = this._faceLeaf;
      var nbFacesToMove = facesToMove.length;

      var root = this._root;
      var rootLoose = root._aabbLoose;
      var xmin = rootLoose[0];
      var ymin = rootLoose[1];
      var zmin = rootLoose[2];
      var xmax = rootLoose[3];
      var ymax = rootLoose[4];
      var zmax = rootLoose[5];
      for (var i = 0; i < nbFacesToMove; ++i) { // add face to the octree
        var idFace = facesToMove[i];
        var idb = idFace * 6;
        var ibux = fb[idb];
        var ibuy = fb[idb + 1];
        var ibuz = fb[idb + 2];
        var iblx = fb[idb + 3];
        var ibly = fb[idb + 4];
        var iblz = fb[idb + 5];
        if (ibux > xmax || iblx < xmin || ibuy > ymax || ibly < ymin || ibuz > zmax || iblz < zmin) {
          // a face is outside the root node
          // we reconstruct the whole octree, slow... but rare
          this.computeOctree(0.3);
          this._leavesUpdate.length = 0;
          break;
        } else {
          var idc = idFace * 3;
          var leaf = faceLeaf[idFace];
          var newleaf = root.addFace(idFace, ibux, ibuy, ibuz, iblx, ibly, iblz, fc[idc], fc[idc + 1], fc[idc + 2]);
          if (newleaf) {
            facePosInLeaf[idFace] = newleaf._iFaces.length - 1;
            faceLeaf[idFace] = newleaf;
          } else { // failed to insert face in octree, re-insert it back
            var facesInLeaf = leaf._iFaces;
            facePosInLeaf[idFace] = facesInLeaf.length;
            facesInLeaf.push(facesToMove[i]);
          }
        }
      }
    },
    /** End of stroke, update octree (cut empty leaves or go deeper if needed) */
    checkLeavesUpdate: function () {
      Utils.tidy(this._leavesUpdate);
      var leavesUpdate = this._leavesUpdate;
      var nbLeaves = leavesUpdate.length;
      var cutLeaves = [];
      var maxFaces = OctreeCell.MAX_FACES;
      var maxDepth = OctreeCell.MAX_DEPTH;
      for (var i = 0; i < nbLeaves; ++i) {
        var leaf = leavesUpdate[i];
        if (!leaf)
          break;
        if (!leaf._iFaces.length)
          leaf.checkEmptiness(cutLeaves);
        else if (leaf._iFaces.length > maxFaces && leaf._depth < maxDepth)
          leaf.build(this._mesh, leaf._iFaces);
      }
      this._leavesUpdate.length = 0;
    }
  };

  module.exports = Octree;
});