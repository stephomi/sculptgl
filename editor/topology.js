'use strict';

function Topology(states)
{
  this.states_ = states; //for undo-redo
  this.mesh_ = null; //mesh
  this.center_ = [0, 0, 0]; //center point
  this.verticesMap_ = {}; //to detect new vertices at the middle of edge (for subdivision)
  this.radiusSquared_ = 0; //radius squared
  this.iTrisToDelete_ = []; //triangles to be deleted
  this.iVertsToDelete_ = []; //vertices to be deleted
  this.iVertsDecimated_ = []; //vertices to be updated (mainly for the VBO's, used in decimation and adaptive topo)

  this.linearSubdivision_ = false; //linear subdivision
  this.checkPlane_ = false; //terminal critera for subdivision/decimation process (false = spherical selection)
  this.planeOrigin_ = [0, 0, 0]; //plane origin
  this.planeNormal_ = [0, 0, 0]; //plane normal
}