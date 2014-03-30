/*global
Octree:false,
SculptGL:false,
Utils:false
*/
'use strict';

function Mesh() {
  // edges
  this.edges_ = null; //edges (Uint8Array) (1 => outer edge, 0 or 2 => inner edge)

  // triangles stuffs
  this.triEdges_ = null; //triangles to edges (Uint32Array)
  this.triNormalsXYZ_ = null; //triangle normals (Float32Array)
  this.triBoxes_ = null; //triangle bbox (Float32Array)
  this.triCentersXYZ_ = null; //triangle center (Float32Array)
  this.triPosInLeaf_ = null; //position index in the leaf (Uint32Array)
  this.triLeaf_ = []; // octree leaf
  this.indicesABC_ = null; //triangles (Uint16Array or Uint32Array)

  // vertices stuffs
  this.vertOnEdge_ = null; //vertices on edge (Uint8Array) (1 => on edge)
  this.vertRingTri_ = []; //array of array (neighborhood triangles)
  this.vertRingVert_ = []; //array of array (ring vertices)
  this.verticesXYZ_ = null; //vertices (Float32Array)
  this.colorsRGB_ = null; //color vertices (Float32Array)
  this.normalsXYZ_ = null; //normals (Float32Array)

  // flag for general purposes
  this.vertTagFlags_ = null; //tag flags (Uint32Array)
  this.triTagFlags_ = null; //triangles tag (Uint32Array)

  // flag for sculpting
  this.vertSculptFlags_ = null; //state flags (Uint32Array)

  // flag for history
  this.triStateFlags_ = null; //state flags (Uint32Array)
  this.vertStateFlags_ = null; //state flags (Uint32Array)

  // for multiresolution sculpting
  this.detailsXYZ_ = null; //details vectors (Float32Array)

  // for multiresolution sculpting
  this.detailsXYZ_ = null; //details vectors (Float32Array)

  // for extra rendering stuffs
  this.cacheDrawArraysV_ = null; //cache array for vertices
  this.cacheDrawArraysN_ = null; //cache array for normals
  this.cacheDrawArraysC_ = null; //cache array for colors
  this.cacheDrawArraysWireframe_ = null; //cache array for the wireframe (lines)
  this.cacheDrawElementsWireframe_ = null; //cache array for the wireframe (lines)

  this.octree_ = new Octree(); //octree
  this.leavesUpdate_ = []; //leaves of the octree to check
}

Mesh.TAG_FLAG = 1; //flag value for comparison (always >= tags values)
Mesh.SCULPT_FLAG = 1; //flag value for sculpt (always >= tags values)
Mesh.STATE_FLAG = 1; //flag value for sculpt (always >= tags values)

Mesh.prototype = {
  getNbTriangles: function () {
    return this.indicesABC_.length / 3;
  },
  getNbVertices: function () {
    return this.verticesXYZ_.length / 3;
  },
  getNbEdges: function () {
    return this.edges_.length;
  },
  /** Initialize stuffs for the mesh */
  init: function () {
    this.allocateArrays();
    this.initTopology();
    this.updateGeometry();
  },
  /** Init topoloy information */
  initTopology: function () {
    this.initRings();
    this.initEdges();
  },
  /** Updates the mesh Geometry */
  updateGeometry: function (iTris, iVerts) {
    this.updateTrianglesAabbAndNormal(iTris);
    this.updateVerticesNormal(iVerts);
    this.updateOctree(iTris);
  },
  /** Return all the triangles linked to a group of vertices */
  getTrianglesFromVertices: function (iVerts) {
    var tagFlag = ++Mesh.TAG_FLAG;
    var iTris = [];
    var nbVerts = iVerts.length;
    var vertRingTri = this.vertRingTri_;
    var triTagFlags = this.triTagFlags_;
    for (var i = 0; i < nbVerts; ++i) {
      var ringTris = vertRingTri[iVerts[i]];
      var nbTris = ringTris.length;
      for (var j = 0; j < nbTris; ++j) {
        var iTri = ringTris[j];
        if (triTagFlags[iTri] !== tagFlag) {
          iTris.push(iTri);
          triTagFlags[iTri] = tagFlag;
        }
      }
    }
    return iTris;
  },
  /** Return all the triangles linked to a group of vertices */
  getVerticesFromTriangles: function (iTris) {
    var tagFlag = ++Mesh.TAG_FLAG;
    var iVerts = [];
    var nbTris = iTris.length;
    var vertTagFlags = this.vertTagFlags_;
    var iAr = this.indicesABC_;
    for (var i = 0; i < nbTris; ++i) {
      var ind = iTris[i] * 3;
      var iVer1 = iAr[ind];
      var iVer2 = iAr[ind + 1];
      var iVer3 = iAr[ind + 2];
      if (vertTagFlags[iVer1] !== tagFlag) {
        iVerts.push(iVer1);
        vertTagFlags[iVer1] = tagFlag;
      }
      if (vertTagFlags[iVer2] !== tagFlag) {
        iVerts.push(iVer2);
        vertTagFlags[iVer2] = tagFlag;
      }
      if (vertTagFlags[iVer3] !== tagFlag) {
        iVerts.push(iVer3);
        vertTagFlags[iVer3] = tagFlag;
      }
    }
    return iVerts;
  },
  /** Get more triangles (n-ring) */
  expandsTriangles: function (iTris, nRing) {
    var tagFlag = ++Mesh.TAG_FLAG;
    var nbTris = iTris.length;
    var vertRingTri = this.vertRingTri_;
    var triTagFlags = this.triTagFlags_;
    var iAr = this.indicesABC_;
    var i = 0,
      id = 0,
      j = 0;
    for (i = 0; i < nbTris; ++i)
      triTagFlags[iTris[i]] = tagFlag;
    var iBegin = 0;
    while (nRing) {
      --nRing;
      for (i = iBegin; i < nbTris; ++i) {
        var ind = iTris[i] * 3;
        var iTris1 = vertRingTri[iAr[ind]],
          iTris2 = vertRingTri[iAr[ind + 1]],
          iTris3 = vertRingTri[iAr[ind + 2]];
        var nbTris1 = iTris1.length,
          nbTris2 = iTris2.length,
          nbTris3 = iTris3.length;
        for (j = 0; j < nbTris1; ++j) {
          id = iTris1[j];
          if (triTagFlags[id] !== tagFlag) {
            iTris.push(id);
            triTagFlags[id] = tagFlag;
          }
        }
        for (j = 0; j < nbTris2; ++j) {
          id = iTris2[j];
          if (triTagFlags[id] !== tagFlag) {
            iTris.push(id);
            triTagFlags[id] = tagFlag;
          }
        }
        for (j = 0; j < nbTris3; ++j) {
          id = iTris3[j];
          if (triTagFlags[id] !== tagFlag) {
            iTris.push(id);
            triTagFlags[id] = tagFlag;
          }
        }
      }
      iBegin = nbTris;
      nbTris = iTris.length;
    }
  },
  /** Get more vertices (n-ring) */
  expandsVertices: function (iVerts, nRing) {
    var tagFlag = ++Mesh.TAG_FLAG;
    var nbVerts = iVerts.length;
    var vertRingVert = this.vertRingVert_;
    var vertTagFlags = this.vertTagFlags_;
    var i = 0,
      j = 0;
    for (i = 0; i < nbVerts; ++i)
      vertTagFlags[iVerts[i]] = tagFlag;
    var iBegin = 0;
    while (nRing) {
      --nRing;
      for (i = iBegin; i < nbVerts; ++i) {
        var ring = vertRingVert[iVerts[i]];
        var nbRing = ring.length;
        for (j = 0; j < nbRing; ++j) {
          var id = ring[j];
          if (vertTagFlags[id] !== tagFlag) {
            iVerts.push(id);
            vertTagFlags[id] = tagFlag;
          }
        }
      }
      iBegin = nbVerts;
      nbVerts = iVerts.length;
    }
  },
  /** Compute Aabb */
  computeAabb: function () {
    var nbVertices = this.getNbVertices();
    var vAr = this.verticesXYZ_;
    var xmin = Infinity,
      ymin = Infinity,
      zmin = Infinity;
    var xmax = -Infinity,
      ymax = -Infinity,
      zmax = -Infinity;
    var i = 0,
      j = 0;
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      var vx = vAr[j],
        vy = vAr[j + 1],
        vz = vAr[j + 2];
      if (vx < xmin) xmin = vx;
      if (vx > xmax) xmax = vx;
      if (vy < ymin) ymin = vy;
      if (vy > ymax) ymax = vy;
      if (vz < zmin) zmin = vz;
      if (vz > zmax) zmax = vz;
    }
    return [xmin, ymin, zmin, xmax, ymax, zmax];
  },
  /** Allocate arrays, except for :
   *    - vertices coords (verticesXYZ_)
   *    - indices of primitives (indicesABC_)
   *    - edges (edges_)
   */
  allocateArrays: function () {
    var nbTriangles = this.getNbTriangles();
    var nbVertices = this.getNbVertices();

    // init triangles stuffs
    this.triEdges_ = new Uint32Array(nbTriangles * 3);
    this.triBoxes_ = new Float32Array(nbTriangles * 6);
    this.triNormalsXYZ_ = new Float32Array(nbTriangles * 3);
    this.triCentersXYZ_ = new Float32Array(nbTriangles * 3);
    this.triPosInLeaf_ = new Uint32Array(nbTriangles);
    this.triLeaf_.length = nbTriangles;

    // init tags stuffs
    this.triTagFlags_ = new Uint32Array(nbTriangles);
    this.triStateFlags_ = new Uint32Array(nbTriangles);
    this.vertTagFlags_ = new Uint32Array(nbVertices);
    this.vertSculptFlags_ = new Uint32Array(nbVertices);
    this.vertStateFlags_ = new Uint32Array(nbVertices);

    // init vertices stuffs
    this.vertOnEdge_ = new Uint8Array(nbVertices);
    // might already be filled on import
    if (this.colorsRGB_ === null || this.colorsRGB_.length !== nbVertices * 3)
      this.colorsRGB_ = new Float32Array(nbVertices * 3);
    this.normalsXYZ_ = new Float32Array(nbVertices * 3);
    var vertRingVert = this.vertRingVert_;
    var i = 0;
    if (vertRingVert.length !== nbVertices) {
      vertRingVert.length = nbVertices;
      for (i = 0; i < nbVertices; ++i) vertRingVert[i] = [];
    }
    var vertRingTri = this.vertRingTri_;
    if (vertRingTri.length !== nbVertices) {
      vertRingTri.length = nbVertices;
      for (i = 0; i < nbVertices; ++i) vertRingTri[i] = [];
    }
  },
  /** Computes the edges */
  initEdges: function () {
    var edgesMap = {};
    var iAr = this.indicesABC_;
    var teAr = this.triEdges_;
    var id1 = 0,
      id2 = 0,
      id3 = 0,
      iv1 = 0,
      iv2 = 0,
      iv3 = 0,
      nbEdges = 0,
      key = 0,
      idEdge = 0;
    for (var i = 0, nbTris = this.getNbTriangles(); i < nbTris; ++i) {
      id1 = i * 3;
      id2 = id1 + 1;
      id3 = id1 + 2;
      iv1 = iAr[id1];
      iv2 = iAr[id2];
      iv3 = iAr[id3];

      key = iv1 < iv2 ? iv1 + '.' + iv2 : iv2 + '.' + iv1;
      idEdge = edgesMap[key];
      if (idEdge === undefined)
        edgesMap[key] = idEdge = nbEdges++;
      teAr[id1] = idEdge;

      key = iv3 < iv2 ? iv3 + '.' + iv2 : iv2 + '.' + iv3;
      idEdge = edgesMap[key];
      if (idEdge === undefined)
        edgesMap[key] = idEdge = nbEdges++;
      teAr[id2] = idEdge;

      key = iv1 < iv3 ? iv1 + '.' + iv3 : iv3 + '.' + iv1;
      idEdge = edgesMap[key];
      if (idEdge === undefined)
        edgesMap[key] = idEdge = nbEdges++;
      teAr[id3] = idEdge;
    }
    var eAr = this.edges_ = new Uint8Array(nbEdges);
    for (var j = 0, nbTrisEdges = teAr.length; j < nbTrisEdges; ++j) {
      eAr[teAr[j]]++;
    }
  },
  /** Initialize the mesh topology (computes ring vertices) */
  initRings: function () {
    var vertRingTri = this.vertRingTri_;
    var vertRingVert = this.vertRingVert_;
    var vertTagFlags = this.vertTagFlags_;
    var iAr = this.indicesABC_;
    var vertOnEdge = this.vertOnEdge_;
    for (var i = 0, l = this.getNbVertices(); i < l; ++i) {
      var tagFlag = ++Mesh.TAG_FLAG;
      var ring = vertRingVert[i];
      ring.length = 0;
      var iTris = vertRingTri[i];
      var nbTris = iTris.length;
      for (var j = 0; j < nbTris; ++j) {
        var ind = iTris[j] * 3;
        var iVer1 = iAr[ind],
          iVer2 = iAr[ind + 1],
          iVer3 = iAr[ind + 2];
        if (iVer1 !== i && vertTagFlags[iVer1] !== tagFlag) {
          ring.push(iVer1);
          vertTagFlags[iVer1] = tagFlag;
        }
        if (iVer2 !== i && vertTagFlags[iVer2] !== tagFlag) {
          ring.push(iVer2);
          vertTagFlags[iVer2] = tagFlag;
        }
        if (iVer3 !== i && vertTagFlags[iVer3] !== tagFlag) {
          ring.push(iVer3);
          vertTagFlags[iVer3] = tagFlag;
        }
      }
      if (nbTris !== ring.length)
        vertOnEdge[i] = 1;
    }
  },
  /** Compute the mesh octree */
  computeOctree: function (abRoot, factor) {
    if (abRoot === undefined)
      abRoot = this.computeAabb();
    var xmin = abRoot[0],
      ymin = abRoot[1],
      zmin = abRoot[2];
    var xmax = abRoot[3],
      ymax = abRoot[4],
      zmax = abRoot[5];
    var dx = xmax - xmin;
    var dy = ymax - ymin;
    var dz = zmax - zmin;
    //root octree bigger than minimum aabb...
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
    xmin = xmin === xmax ? xmin - offset : xmin;
    xmax = xmin === xmax ? xmax + offset : xmax;
    ymin = ymin === ymax ? ymin - offset : ymin;
    ymax = ymin === ymax ? ymin + offset : ymax;
    zmin = zmin === zmax ? zmin - offset : zmin;
    zmax = zmin === zmax ? zmin + offset : zmax;

    //octree construction
    var nbTriangles = this.getNbTriangles();
    var trianglesAll = [];
    for (var i = 0; i < nbTriangles; ++i)
      trianglesAll.push(i);
    this.octree_ = new Octree();
    this.octree_.setAabbSplit(xmin, ymin, zmin, xmax, ymax, zmax);
    this.octree_.build(this, trianglesAll);
  },
  /** Update a group of triangles' normal and aabb */
  updateTrianglesAabbAndNormal: function (iTris) {
    var i = 0;
    var triNormals = this.triNormalsXYZ_;
    var triBoxes = this.triBoxes_;
    var triCenters = this.triCentersXYZ_;
    var vAr = this.verticesXYZ_;
    var iAr = this.indicesABC_;

    var full = iTris === undefined;
    var nbTris = full ? this.getNbTriangles() : iTris.length;
    var ind1 = 0,
      ind2 = 0,
      ind3 = 0;
    var ind = 0,
      idTri = 0,
      idBox = 0;
    var v1x = 0.0,
      v1y = 0.0,
      v1z = 0.0;
    var v2x = 0.0,
      v2y = 0.0,
      v2z = 0.0;
    var v3x = 0.0,
      v3y = 0.0,
      v3z = 0.0;
    var xmin = 0.0,
      ymin = 0.0,
      zmin = 0.0;
    var xmax = 0.0,
      ymax = 0.0,
      zmax = 0.0;
    var ax = 0.0,
      ay = 0.0,
      az = 0.0;
    var bx = 0.0,
      by = 0.0,
      bz = 0.0;
    var nx = 0.0,
      ny = 0.0,
      nz = 0.0;
    var len = 0.0;
    for (i = 0; i < nbTris; ++i) {
      ind = full ? i : iTris[i];
      idTri = ind * 3;
      idBox = ind * 6;
      ind1 = iAr[idTri] * 3;
      ind2 = iAr[idTri + 1] * 3;
      ind3 = iAr[idTri + 2] * 3;
      v1x = vAr[ind1];
      v1y = vAr[ind1 + 1];
      v1z = vAr[ind1 + 2];
      v2x = vAr[ind2];
      v2y = vAr[ind2 + 1];
      v2z = vAr[ind2 + 2];
      v3x = vAr[ind3];
      v3y = vAr[ind3 + 1];
      v3z = vAr[ind3 + 2];
      // compute normals
      ax = v2x - v1x;
      ay = v2y - v1y;
      az = v2z - v1z;
      bx = v3x - v1x;
      by = v3y - v1y;
      bz = v3z - v1z;
      nx = ay * bz - az * by;
      ny = az * bx - ax * bz;
      nz = ax * by - ay * bx;
      len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      triNormals[idTri] = nx * len;
      triNormals[idTri + 1] = ny * len;
      triNormals[idTri + 2] = nz * len;
      // compute boxes
      // for code readability of course
      xmin = v1x < v2x ? v1x < v3x ? v1x : v3x : v2x < v3x ? v2x : v3x;
      xmax = v1x > v2x ? v1x > v3x ? v1x : v3x : v2x > v3x ? v2x : v3x;
      ymin = v1y < v2y ? v1y < v3y ? v1y : v3y : v2y < v3y ? v2y : v3y;
      ymax = v1y > v2y ? v1y > v3y ? v1y : v3y : v2z > v3y ? v2y : v3y;
      zmin = v1z < v2z ? v1z < v3z ? v1z : v3z : v2z < v3z ? v2z : v3z;
      zmax = v1z > v2z ? v1z > v3z ? v1z : v3z : v2y > v3z ? v2z : v3z;
      triBoxes[idBox] = xmin;
      triBoxes[idBox + 1] = ymin;
      triBoxes[idBox + 2] = zmin;
      triBoxes[idBox + 3] = xmax;
      triBoxes[idBox + 4] = ymax;
      triBoxes[idBox + 5] = zmax;
      // compute centers
      triCenters[idTri] = (xmin + xmax) * 0.5;
      triCenters[idTri + 1] = (ymin + ymax) * 0.5;
      triCenters[idTri + 2] = (zmin + zmax) * 0.5;
    }
  },
  /** Update a group of vertices' normal */
  updateVerticesNormal: function (iVerts) {
    var vertRingTri = this.vertRingTri_;
    var nAr = this.normalsXYZ_;
    var triNormals = this.triNormalsXYZ_;

    var full = iVerts === undefined;
    var nbTris = full ? this.getNbVertices() : iVerts.length;
    for (var i = 0; i < nbTris; ++i) {
      var ind = full ? i : iVerts[i];
      var iTris = vertRingTri[ind];
      var nbTri = iTris.length;
      var nx = 0.0,
        ny = 0.0,
        nz = 0.0;
      for (var j = 0; j < nbTri; ++j) {
        var id = iTris[j] * 3;
        nx += triNormals[id];
        ny += triNormals[id + 1];
        nz += triNormals[id + 2];
      }
      var len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      ind *= 3;
      nAr[ind] = nx * len;
      nAr[ind + 1] = ny * len;
      nAr[ind + 2] = nz * len;
    }
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
  },
  updateOctreeRemove: function (iTris) {
    var triCenters = this.triCentersXYZ_;
    var triBoxes = this.triBoxes_;
    var triPosInLeaf = this.triPosInLeaf_;
    var triLeaf = this.triLeaf_;
    var trisToMove = [];
    var nbTris = iTris.length;
    //recompute position inside the octree
    for (var i = 0; i < nbTris; ++i) {
      var idTri = iTris[i];
      var idBox = idTri * 6;
      var idCen = idTri * 3;
      var leaf = triLeaf[idTri];
      var split = leaf.aabbSplit_;

      var vx = triCenters[idCen],
        vy = triCenters[idCen + 1],
        vz = triCenters[idCen + 2];
      var hasMoved = false;
      if (vx <= split[0]) hasMoved = true;
      else if (vy <= split[1]) hasMoved = true;
      else if (vz <= split[2]) hasMoved = true;
      else if (vx > split[3]) hasMoved = true;
      else if (vy > split[4]) hasMoved = true;
      else if (vz > split[5]) hasMoved = true;

      if (hasMoved === true) {
        trisToMove.push(iTris[i]);
        var trisInLeaf = leaf.iTris_;
        if (trisInLeaf.length > 0) { // remove tris from octree cell
          var iTriLast = trisInLeaf[trisInLeaf.length - 1];
          var iPos = triPosInLeaf[idTri];
          trisInLeaf[iPos] = iTriLast;
          triPosInLeaf[iTriLast] = iPos;
          trisInLeaf.pop();
        }
      } else { // expands cell aabb loose if necessary
        var loose = leaf.aabbLoose_;
        var bxmin = triBoxes[idBox];
        var bymin = triBoxes[idBox + 1];
        var bzmin = triBoxes[idBox + 2];
        var bxmax = triBoxes[idBox + 3];
        var bymax = triBoxes[idBox + 4];
        var bzmax = triBoxes[idBox + 5];
        if (bxmin < loose[0]) loose[0] = bxmin;
        if (bymin < loose[1]) loose[1] = bymin;
        if (bzmin < loose[2]) loose[2] = bzmin;
        if (bxmax > loose[3]) loose[3] = bxmax;
        if (bymax > loose[4]) loose[4] = bymax;
        if (bzmax > loose[5]) loose[5] = bzmax;
      }
    }
    return trisToMove;
  },
  updateOctreeAdd: function (trisToMove) {
    var triCenters = this.triCentersXYZ_;
    var triBoxes = this.triBoxes_;
    var triPosInLeaf = this.triPosInLeaf_;
    var triLeaf = this.triLeaf_;
    var nbTrisToMove = trisToMove.length;

    var octree = this.octree_;
    var rootLoose = octree.aabbLoose_;
    var xmin = rootLoose[0],
      ymin = rootLoose[1],
      zmin = rootLoose[2];
    var xmax = rootLoose[3],
      ymax = rootLoose[4],
      zmax = rootLoose[5];
    for (var i = 0; i < nbTrisToMove; ++i) { //add triangle to the octree
      var idTri = trisToMove[i];
      var idBox = idTri * 6;
      var idCen = idTri * 3;

      var isOutsideRoot = false;
      if (triBoxes[idBox] > xmax || triBoxes[idBox + 3] < xmin) isOutsideRoot = true;
      else if (triBoxes[idBox + 1] > ymax || triBoxes[idBox + 4] < ymin) isOutsideRoot = true;
      else if (triBoxes[idBox + 2] > zmax || triBoxes[idBox + 5] < zmin) isOutsideRoot = true;

      if (isOutsideRoot === true) { //we reconstruct the whole octree, slow... but rare
        this.computeOctree(undefined, 0.3);
        this.leavesUpdate_.length = 0;
        break;
      } else {
        var leaf = triLeaf[idTri];
        var triBox = triBoxes.subarray(idBox, idBox + 6);
        var triCenter = triCenters.subarray(idCen, idCen + 3);
        var newleaf = octree.addTriangle(idTri, triBox, triCenter);
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
    var octreeMaxTriangles = Octree.maxTriangles_;
    var octreeMaxDepth = Octree.maxDepth_;
    for (var i = 0; i < nbLeaves; ++i) {
      var leaf = leavesUpdate[i];
      if (leaf === null)
        break;
      if (!leaf.iTris_.length)
        leaf.checkEmptiness(cutLeaves);
      else if (leaf.iTris_.length > octreeMaxTriangles && leaf.depth_ < octreeMaxDepth)
        leaf.constructCells(this);
    }
    this.leavesUpdate_.length = 0;
  },
  /** Updates the arrays that are going to be used for webgl */
  updateCacheDrawArrays: function (iTris) {
    var vAr = this.verticesXYZ_;
    var cAr = this.colorsRGB_;
    var iAr = this.indicesABC_;
    var triNormals = this.triNormalsXYZ_;
    var nbTriangles = this.getNbTriangles();

    var full = iTris === undefined;
    var cdv = this.cacheDrawArraysV_;
    var cdn = this.cacheDrawArraysN_;
    var cdc = this.cacheDrawArraysC_;

    if (full) {
      this.cacheDrawArraysV_ = new Float32Array(nbTriangles * 9);
      cdv = this.cacheDrawArraysV_;

      this.cacheDrawArraysN_ = new Float32Array(nbTriangles * 9);
      cdn = this.cacheDrawArraysN_;

      this.cacheDrawArraysC_ = new Float32Array(nbTriangles * 9);
      cdc = this.cacheDrawArraysC_;
    }

    var i = 0,
      j = 0,
      vId = 0;
    var id1 = 0,
      id2 = 0,
      id3 = 0;
    var nbTris = full ? nbTriangles : iTris.length;
    for (i = 0; i < nbTris; ++i) {
      j = full ? i * 3 : iTris[i] * 3;
      vId = j * 3;

      id1 = iAr[j] * 3;
      id2 = iAr[j + 1] * 3;
      id3 = iAr[j + 2] * 3;

      cdv[vId] = vAr[id1];
      cdv[vId + 1] = vAr[id1 + 1];
      cdv[vId + 2] = vAr[id1 + 2];
      cdv[vId + 3] = vAr[id2];
      cdv[vId + 4] = vAr[id2 + 1];
      cdv[vId + 5] = vAr[id2 + 2];
      cdv[vId + 6] = vAr[id3];
      cdv[vId + 7] = vAr[id3 + 1];
      cdv[vId + 8] = vAr[id3 + 2];

      cdc[vId] = cAr[id1];
      cdc[vId + 1] = cAr[id1 + 1];
      cdc[vId + 2] = cAr[id1 + 2];
      cdc[vId + 3] = cAr[id2];
      cdc[vId + 4] = cAr[id2 + 1];
      cdc[vId + 5] = cAr[id2 + 2];
      cdc[vId + 6] = cAr[id3];
      cdc[vId + 7] = cAr[id3 + 1];
      cdc[vId + 8] = cAr[id3 + 2];

      cdn[vId] = cdn[vId + 3] = cdn[vId + 6] = triNormals[j];
      cdn[vId + 1] = cdn[vId + 4] = cdn[vId + 7] = triNormals[j + 1];
      cdn[vId + 2] = cdn[vId + 5] = cdn[vId + 8] = triNormals[j + 2];
    }
  },
  /** Updates the arrays that are going to be used for webgl */
  updateCacheWireframe: function (flatShading) {
    var nbEdges = this.getNbEdges();
    var cdw;
    if (flatShading) {
      if (this.cacheDrawArraysWireframe_ && this.cacheDrawArraysWireframe_.length === nbEdges * 2) {
        return;
      }
      cdw = this.cacheDrawArraysWireframe_ = new SculptGL.indexArrayType(nbEdges * 2);
    } else {
      if (this.cacheDrawElementsWireframe_ && this.cacheDrawElementsWireframe_.length === nbEdges * 2) {
        return;
      }
      cdw = this.cacheDrawElementsWireframe_ = new SculptGL.indexArrayType(nbEdges * 2);
    }

    var iAr = this.indicesABC_;
    var teAr = this.triEdges_;
    var nbTriangles = this.getNbTriangles();

    var i = 0,
      id = 0,
      nbLines = 0;
    var iv1 = 0,
      iv2 = 0,
      iv3 = 0;
    var ide1 = 0,
      ide2 = 0,
      ide3 = 0;

    var tagEdges = new Int32Array(nbEdges);

    for (i = 0; i < nbTriangles; ++i) {
      id = i * 3;

      iv1 = flatShading ? id : iAr[id];
      iv2 = flatShading ? id + 1 : iAr[id + 1];
      iv3 = flatShading ? id + 2 : iAr[id + 2];

      ide1 = teAr[id];
      ide2 = teAr[id + 1];
      ide3 = teAr[id + 2];

      if (tagEdges[ide1] === 0) {
        tagEdges[ide1] = 1;
        cdw[nbLines * 2] = iv1;
        cdw[nbLines * 2 + 1] = iv2;
        nbLines++;
      }
      if (tagEdges[ide2] === 0) {
        tagEdges[ide2] = 1;
        cdw[nbLines * 2] = iv2;
        cdw[nbLines * 2 + 1] = iv3;
        nbLines++;
      }
      if (tagEdges[ide3] === 0) {
        tagEdges[ide3] = 1;
        cdw[nbLines * 2] = iv3;
        cdw[nbLines * 2 + 1] = iv1;
        nbLines++;
      }
    }
  }
};