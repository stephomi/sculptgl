'use strict';

function Grid()
{
  this.aabb_ = new Aabb(); //aabb
  this.dimX_ = 0; //width
  this.dimY_ = 0; //length
  this.dimZ_ = 0; //height
  this.cellSize_ = 0; //size of cell
  this.size_ = 0; //total size of array
  this.iVerts_ = []; //3D grid as a 1-dimensional array
}

Grid.prototype = {
  /** Constructor */
  setBoundaries: function (aabb)
  {
    var vecShift = [0.0, 0.0, 0.0];
    vec3.sub(vecShift, aabb.max_, aabb.min_);
    vec3.scale(vecShift, vecShift, 0.1);
    vec3.sub(aabb.min_, aabb.min_, vecShift);
    vec3.add(aabb.max_, aabb.max_, vecShift);
    this.aabb_ = aabb;
  },

  /** Initialize grid */
  init: function (cellSize)
  {
    this.cellSize_ = cellSize;
    var aabb = this.aabb_;
    var diff = [0.0, 0.0, 0.0];
    vec3.sub(diff, aabb.max_, aabb.min_);
    var dimX = Math.ceil(diff[0] / cellSize);
    var dimY = Math.ceil(diff[1] / cellSize);
    var dimZ = Math.ceil(diff[2] / cellSize);
    if (dimX <= 0) dimX = 1;
    if (dimY <= 0) dimY = 1;
    if (dimZ <= 0) dimZ = 1;
    this.size_ = 1 + (dimX * dimY * dimZ);
    var nbVerts = this.size_;
    var iVerts = this.iVerts_;
    iVerts.length = nbVerts;
    for (var i = 0; i < nbVerts; ++i)
      iVerts[i] = [];
    this.dimX_ = dimX;
    this.dimY_ = dimY;
    this.dimZ_ = dimZ;
  },

  /** Build the grid */
  build: function (mesh, iVerts)
  {
    var vAr = mesh.vertexArray_;

    var min = this.aabb_.min_;
    var dimX = this.dimX_,
      dimXY = dimX * this.dimY_;
    var dx = 0,
      dy = 0,
      dz = 0;
    var i = 0,
      id = 0;
    var cellSize = this.cellSize_,
      size = this.size_;
    var gridVerts = this.iVerts_;
    var nbVerts = iVerts.length;
    for (i = 0; i < nbVerts; ++i)
    {
      var iVert = iVerts[i];
      id = iVert * 3;
      dx = Math.floor((vAr[id] - min[0]) / cellSize);
      dy = Math.floor((vAr[id + 1] - min[1]) / cellSize);
      dz = Math.floor((vAr[id + 2] - min[2]) / cellSize);
      var index = dx + dy * dimX + dz * dimXY;
      if (index < 0)
        index = 0;
      else if (index >= size)
        index = size - 1;
      gridVerts[index].push(iVert);
    }
  },

  /** Return neighboring vertices */
  getNeighborhood: function (vx, vy, vz)
  {
    var min = this.aabb_.min_;
    var cellSize = this.cellSize_;
    var dimX = this.dimX_,
      dimY = this.dimY_,
      dimZ = this.dimZ_,
      dimXY = dimX * this.dimY_;

    var indX = Math.floor((vx - min[0]) / cellSize),
      indY = Math.floor((vy - min[1]) / cellSize),
      indZ = Math.floor((vz - min[2]) / cellSize);

    if (indX < 0) indX = 0;
    else if (indX >= dimX) indX = dimX - 1;

    if (indY < 0) indY = 0;
    else if (indY >= dimY) indY = dimY - 1;

    if (indZ < 0) indZ = 0;
    else if (indZ >= dimZ) indZ = dimZ - 1;

    var xStart = -1,
      yStart = -1,
      zStart = -1;

    var xEnd = 1,
      yEnd = 1,
      zEnd = 1;

    if (indX <= 0) xStart = 0;
    if (indX >= (dimX - 1)) xEnd = 0;

    if (indY <= 0) yStart = 0;
    if (indY >= (dimY - 1)) yEnd = 0;

    if (indZ <= 0) zStart = 0;
    if (indZ >= (dimZ - 1)) zEnd = 0;

    var iX = 0,
      iY = 0,
      iZ = 0;
    var iVerts = this.iVerts_;
    var iNearVerts = [];
    for (iX = xStart; iX <= xEnd; ++iX)
    {
      for (iY = yStart; iY <= yEnd; ++iY)
      {
        for (iZ = zStart; iZ <= zEnd; ++iZ)
        {
          iNearVerts.push.apply(iNearVerts, iVerts[indX + iX + (indY + iY) * dimX + (indZ + iZ) * dimXY]);
        }
      }
    }
    return iNearVerts;
  }
};