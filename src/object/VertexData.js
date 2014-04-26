// define([
//   'object/Octree',
//   'misc/Utils'
// ], function (Octree, Utils) {

//   'use strict';

//   function Mesh() {
//     // edges
//     this.edges_ = null; //edges (Uint8Array) (1 => outer edge, 0 or 2 => inner edge)

//     // triangles stuffs
//     this.triEdges_ = null; //triangles to edges (Uint32Array)
//     this.triNormalsXYZ_ = null; //triangle normals (Float32Array)
//     this.triBoxes_ = null; //triangle bbox (Float32Array)
//     this.triCentersXYZ_ = null; //triangle center (Float32Array)
//     this.triPosInLeaf_ = null; //position index in the leaf (Uint32Array)
//     this.triLeaf_ = []; // octree leaf
//     this.indicesABC_ = null; //triangles (Uint16Array or Uint32Array)

//     // vertices stuffs
//     this.vertOnEdge_ = null; //vertices on edge (Uint8Array) (1 => on edge)
//     this.vrtStartCount_ = null; //array of neighborhood triangles (start/count) (Uint32Array)
//     this.vertRingTri_ = null; //array of neighborhood triangles (Uint32Array)
//     this.vrrStartCount_ = null; //array of neighborhood vertices (start/count) (Uint32Array)
//     this.vertRingVert_ = null; //array neighborhood vertices (Uint32Array)
//     this.verticesXYZ_ = null; //vertices (Float32Array)
//     this.colorsRGB_ = null; //color vertices (Float32Array)
//     this.normalsXYZ_ = null; //normals (Float32Array)

//     // flag for general purposes
//     this.vertTagFlags_ = null; //tag flags (<= Mesh.TAG_FLAG) (Uint32Array)
//     this.triTagFlags_ = null; //triangles tag (<= Mesh.TAG_FLAG) (Uint32Array)
//     // flag for editing
//     this.vertSculptFlags_ = null; //sculpt flags (<= Mesh.SCULPT_FLAG) (Uint32Array)
//     // flag for history
//     this.vertStateFlags_ = null; //state flags (<= Mesh.STATE_FLAG) (Uint32Array)

//     // for multiresolution sculpting
//     this.detailsXYZ_ = null; //details vectors (Float32Array)
//     this.detailsRGB_ = null; //details vectors (Float32Array)

//     // for extra rendering stuffs
//     this.cacheDrawArraysV_ = null; //cache array for vertices
//     this.cacheDrawArraysN_ = null; //cache array for normals
//     this.cacheDrawArraysC_ = null; //cache array for colors
//     this.cacheDrawArraysWireframe_ = null; //cache array for the wireframe (lines)
//     this.cacheDrawElementsWireframe_ = null; //cache array for the wireframe (lines)

//     this.octree_ = new Octree(); //octree
//     this.leavesUpdate_ = []; //leaves of the octree to check
//   }

//   Mesh.prototype = {
//   };

//   return Mesh;
// });