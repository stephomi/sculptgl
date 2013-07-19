'use strict';

function Mesh(gl)
{
  this.vertices_ = []; //logical vertex
  this.triangles_ = []; //logical triangle

  this.vertexArray_ = null; //vertices (Float32Array)
  this.normalArray_ = null; //normals (Float32Array)
  this.indexArray_ = null; //triangles (Uint16Array or Uint32Array)

  this.center_ = [0, 0, 0]; //center of mesh
  this.octree_ = new Octree(); //octree
  this.matTransform_ = mat4.create(); //transformation matrix of the mesh
  this.leavesUpdate_ = []; //leaves of the octree to check
  this.render_ = new Render(gl); //the mesh renderer
  this.scale_ = 1; //use for export in order to keep the same scale as import...
}

Mesh.globalScale_ = 500; //for precision issue...
Mesh.stateMask_ = 1; //for history

Mesh.prototype = {
  /** Return all the triangles linked to a group of vertices */
  getTrianglesFromVertices: function (iVerts)
  {
    var triangleTagMask = ++Triangle.tagMask_;
    var iTris = [];
    var nbVerts = iVerts.length;
    var vertices = this.vertices_;
    var triangles = this.triangles_;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ringTris = vertices[iVerts[i]].tIndices_;
      var nbTris = ringTris.length;
      for (var j = 0; j < nbTris; ++j)
      {
        var iTri = ringTris[j];
        if (triangles[iTri].tagFlag_ !== triangleTagMask)
        {
          iTris.push(iTri);
          triangles[iTri].tagFlag_ = triangleTagMask;
        }
      }
    }
    return iTris;
  },

  /** Return all the triangles linked to a group of vertices */
  getVerticesFromTriangles: function (iTris)
  {
    var vertexTagMask = ++Vertex.tagMask_;
    var iVerts = [];
    var nbTris = iTris.length;
    var vertices = this.vertices_;
    var iAr = this.indexArray_;
    for (var i = 0; i < nbTris; ++i)
    {
      var ind = iTris[i] * 3;
      var iVer1 = iAr[ind];
      var iVer2 = iAr[ind + 1];
      var iVer3 = iAr[ind + 2];
      if (vertices[iVer1].tagFlag_ !== vertexTagMask)
      {
        iVerts.push(iVer1);
        vertices[iVer1].tagFlag_ = vertexTagMask;
      }
      if (vertices[iVer2].tagFlag_ !== vertexTagMask)
      {
        iVerts.push(iVer2);
        vertices[iVer2].tagFlag_ = vertexTagMask;
      }
      if (vertices[iVer3].tagFlag_ !== vertexTagMask)
      {
        iVerts.push(iVer3);
        vertices[iVer3].tagFlag_ = vertexTagMask;
      }
    }
    return iVerts;
  },

  /** Get more triangles (n-ring) */
  expandsTriangles: function (iTris, nRing)
  {
    var triangleTagMask = ++Triangle.tagMask_;
    var nbTris = iTris.length;
    var vertices = this.vertices_;
    var triangles = this.triangles_;
    var iAr = this.indexArray_;
    var i = 0,
      j = 0;
    for (i = 0; i < nbTris; ++i)
      triangles[iTris[i]].tagFlag_ = triangleTagMask;
    var iBegin = 0;
    while (nRing)
    {
      --nRing;
      for (i = iBegin; i < nbTris; ++i)
      {
        var ind = iTris[i] * 3;
        var iTris1 = vertices[iAr[ind]].tIndices_,
          iTris2 = vertices[iAr[ind + 1]].tIndices_,
          iTris3 = vertices[iAr[ind + 2]].tIndices_;
        var nbTris1 = iTris1.length,
          nbTris2 = iTris2.length,
          nbTris3 = iTris3.length;
        for (j = 0; j < nbTris1; ++j)
        {
          var t1 = triangles[iTris1[j]];
          if (t1.tagFlag_ !== triangleTagMask)
          {
            t1.tagFlag_ = triangleTagMask;
            iTris.push(iTris1[j]);
          }
        }
        for (j = 0; j < nbTris2; ++j)
        {
          var t2 = triangles[iTris2[j]];
          if (t2.tagFlag_ !== triangleTagMask)
          {
            t2.tagFlag_ = triangleTagMask;
            iTris.push(iTris2[j]);
          }
        }
        for (j = 0; j < nbTris3; ++j)
        {
          var t3 = triangles[iTris3[j]];
          if (t3.tagFlag_ !== triangleTagMask)
          {
            t3.tagFlag_ = triangleTagMask;
            iTris.push(iTris3[j]);
          }
        }
      }
      iBegin = nbTris;
      nbTris = iTris.length;
    }
  },

  /** Get more vertices (n-ring) */
  expandsVertices: function (iVerts, nRing)
  {
    var vertexTagMask = ++Vertex.tagMask_;
    var nbVerts = iVerts.length;
    var vertices = this.vertices_;
    var i = 0,
      j = 0;
    for (i = 0; i < nbVerts; ++i)
      vertices[iVerts[i]].tagFlag_ = vertexTagMask;
    var iBegin = 0;
    while (nRing)
    {
      --nRing;
      for (i = iBegin; i < nbVerts; ++i)
      {
        var ring = vertices[iVerts[i]].ringVertices_;
        var nbRing = ring.length;
        for (j = 0; j < nbRing; ++j)
        {
          var vRing = vertices[ring[j]];
          if (vRing.tagFlag_ !== vertexTagMask)
          {
            vRing.tagFlag_ = vertexTagMask;
            iVerts.push(ring[j]);
          }
        }
      }
      iBegin = nbVerts;
      nbVerts = iVerts.length;
    }
  },

  /** Compute the vertices around a vertex */
  computeRingVertices: function (iVert)
  {
    var vertexTagMask = ++Vertex.tagMask_;
    var vertices = this.vertices_;
    var iAr = this.indexArray_;
    var vert = vertices[iVert];
    vert.ringVertices_.length = 0;
    var ring = vert.ringVertices_;
    var iTris = vert.tIndices_;
    var nbTris = iTris.length;
    for (var i = 0; i < nbTris; ++i)
    {
      var ind = iTris[i] * 3;
      var iVer1 = iAr[ind],
        iVer2 = iAr[ind + 1],
        iVer3 = iAr[ind + 2];
      if (iVer1 !== iVert && vertices[iVer1].tagFlag_ !== vertexTagMask)
      {
        ring.push(iVer1);
        vertices[iVer1].tagFlag_ = vertexTagMask;
      }
      if (iVer2 !== iVert && vertices[iVer2].tagFlag_ !== vertexTagMask)
      {
        ring.push(iVer2);
        vertices[iVer2].tagFlag_ = vertexTagMask;
      }
      if (iVer3 !== iVert && vertices[iVer3].tagFlag_ !== vertexTagMask)
      {
        ring.push(iVer3);
        vertices[iVer3].tagFlag_ = vertexTagMask;
      }
    }
  },

  /** Move the mesh center to a certain point */
  moveTo: function (destination)
  {
    mat4.translate(this.matTransform_, mat4.create(), vec3.sub(destination, destination, this.center_));
  },

  /** Render the mesh */
  render: function (camera, picking)
  {
    this.render_.render(camera, picking, this.matTransform_, this.triangles_.length * 3, this.center_);
  },

  /** Initialize the mesh information : center, octree */
  initMesh: function (textures, shaders)
  {
    var vertices = this.vertices_;
    var triangles = this.triangles_;
    var vAr = this.vertexArray_;
    var nbVertices = vertices.length;
    var nbTriangles = triangles.length;

    //ring vertices and mesh main aabb
    var aabb = new Aabb();
    aabb.set(vAr[0], vAr[1], vAr[2], vAr[0], vAr[1], vAr[2]);
    var i = 0,
      j = 0;
    for (i = 0; i < nbVertices; ++i)
    {
      this.computeRingVertices(i);
      j = i * 3;
      aabb.expandsWithPoint(vAr[j], vAr[j + 1], vAr[j + 2]);
    }
    this.center_ = aabb.computeCenter();

    //scale
    var diag = vec3.dist(aabb.min_, aabb.max_);
    this.scale_ = Mesh.globalScale_ / diag;
    var scale = this.scale_;
    for (i = 0; i < nbVertices; ++i)
    {
      j = i * 3;
      vAr[j] *= scale;
      vAr[j + 1] *= scale;
      vAr[j + 2] *= scale;
    }
    mat4.scale(this.matTransform_, this.matTransform_, [scale, scale, scale]);
    vec3.scale(aabb.min_, aabb.min_, scale);
    vec3.scale(aabb.max_, aabb.max_, scale);
    vec3.scale(this.center_, this.center_, scale);

    //root octree bigger than minimum aabb...
    var vecShift = [0, 0, 0];
    vec3.sub(vecShift, aabb.max_, aabb.min_);
    vec3.scale(vecShift, vecShift, 0.2);
    vec3.sub(aabb.min_, aabb.min_, vecShift);
    vec3.add(aabb.max_, aabb.max_, vecShift);
    aabb.enlargeIfFlat(vec3.length(vecShift)); //for plane mesh...

    //triangles' aabb and normal
    for (i = 0; i < nbTriangles; ++i)
      this.updateTriangleAabbAndNormal(i);

    //vertex normal
    for (i = 0; i < nbVertices; ++i)
      this.updateVertexNormal(i);

    //octree construction
    var trianglesAll = new Array(nbTriangles);
    for (i = 0; i < nbTriangles; ++i)
      trianglesAll[i] = i;
    ++Triangle.tagMask_;
    this.octree_ = new Octree();
    this.octree_.build(this, trianglesAll, aabb);
    this.render_.initBuffers(this.vertexArray_, this.normalArray_, this.indexArray_);
    this.render_.updateShaders(this.render_.shaderType_, textures, shaders);
  },

  /** Update the rendering buffers */
  updateBuffers: function ()
  {
    this.render_.updateBuffers(this.vertexArray_, this.normalArray_, this.indexArray_);
  },

  /** Update geometry  */
  updateMesh: function (iTris, iVerts)
  {
    var nbVert = iVerts.length;
    var nbTris = iTris.length;
    var i = 0;
    for (i = 0; i < nbTris; ++i)
      this.updateTriangleAabbAndNormal(iTris[i]);
    this.updateOctree(iTris);
    for (i = 0; i < nbVert; ++i)
      this.updateVertexNormal(iVerts[i]);
  },

  /** Update a normal of a vertex */
  updateTriangleAabbAndNormal: function (ind)
  {
    var triangles = this.triangles_;
    var vAr = this.vertexArray_;
    var iAr = this.indexArray_;
    var t = triangles[ind];
    ind *= 3;
    var ind1 = iAr[ind] * 3,
      ind2 = iAr[ind + 1] * 3,
      ind3 = iAr[ind + 2] * 3;
    var v1x = vAr[ind1],
      v1y = vAr[ind1 + 1],
      v1z = vAr[ind1 + 2];
    var v2x = vAr[ind2],
      v2y = vAr[ind2 + 1],
      v2z = vAr[ind2 + 2];
    var v3x = vAr[ind3],
      v3y = vAr[ind3 + 1],
      v3z = vAr[ind3 + 2];
    Geometry.normal(t.normal_, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z);
    Geometry.computeTriangleAabb(t.aabb_, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z);
  },

  /** Update a normal of a vertex */
  updateVertexNormal: function (ind)
  {
    var vertices = this.vertices_;
    var triangles = this.triangles_;
    var nAr = this.normalArray_;
    var vert = vertices[ind];
    var iTris = vert.tIndices_;
    var nbTri = iTris.length;
    var nx = 0,
      ny = 0,
      nz = 0;
    for (var i = 0; i < nbTri; ++i)
    {
      var normTri = triangles[iTris[i]].normal_;
      nx += normTri[0];
      ny += normTri[1];
      nz += normTri[2];
    }
    var len = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    ind *= 3;
    nAr[ind] = nx * len;
    nAr[ind + 1] = ny * len;
    nAr[ind + 2] = nz * len;
  },

  /**
   * Update Octree
   * For each triangle we check if its position inside the octree has changed
   * if so... we mark this triangle and we remove it from its former cells
   * We push back the marked triangles into the octree
   */
  updateOctree: function (iTris)
  {
    var nbTris = iTris.length;
    var trisToMove = [];
    var triangles = this.triangles_;
    var i = 0;
    var leaf, trisLeaf;
    for (i = 0; i < nbTris; ++i) //recompute position inside the octree
    {
      var t = triangles[iTris[i]];
      leaf = t.leaf_;
      if (!leaf.aabbSplit_.pointInside(t.aabb_.computeCenter()))
      {
        trisToMove.push(iTris[i]);
        trisLeaf = leaf.iTris_;
        if (trisLeaf.length > 0)
        {
          var iTriLast = trisLeaf[trisLeaf.length - 1];
          var iPos = t.posInLeaf_;
          trisLeaf[iPos] = iTriLast;
          triangles[iTriLast].posInLeaf_ = iPos;
          trisLeaf.pop();
        }
      }
      else if (!t.aabb_.isInside(leaf.aabbLoose_))
        leaf.aabbLoose_.expandsWithAabb(t.aabb_);
    }
    var nbTrisToMove = trisToMove.length;
    for (i = 0; i < nbTrisToMove; ++i) //add triangle to the octree
    {
      var tri = triangles[trisToMove[i]];
      if (this.octree_.aabbLoose_.isOutside(tri.aabb_)) //we reconstruct the whole octree, slow... but rare
      {
        var aabb = new Aabb();
        aabb.setCopy(this.octree_.aabbSplit_.min_, this.octree_.aabbSplit_.max_);
        var vecShift = [0, 0, 0];
        vec3.scale(vecShift, vec3.sub(vecShift, aabb.max_, aabb.min_), 0.2);
        vec3.sub(aabb.min_, aabb.min_, vecShift);
        vec3.add(aabb.max_, aabb.max_, vecShift);
        var tris = [];
        var nbTriangles = triangles.length;
        for (i = 0; i < nbTriangles; ++i)
          tris.push(i);
        this.octree_ = new Octree();
        ++Triangle.tagMask_;
        this.octree_.build(this, tris, aabb);
        this.leavesUpdate_.length = 0;
        break;
      }
      else
      {
        leaf = tri.leaf_;
        this.octree_.addTriangle(this, tri);
        if (leaf === tri.leaf_)
        {
          trisLeaf = leaf.iTris_;
          tri.posInLeaf_ = trisLeaf.length;
          trisLeaf.push(trisToMove[i]);
        }
      }
    }
  },

  /** End of stroke, update octree (cut empty leaves or go deeper if needed) */
  checkLeavesUpdate: function ()
  {
    Tools.tidy(this.leavesUpdate_);
    var leavesUpdate = this.leavesUpdate_;
    var nbLeaves = leavesUpdate.length;
    var cutLeaves = [];
    var octreeMaxTriangles = Octree.maxTriangles_;
    var octreeMaxDepth = Octree.maxDepth_;
    ++Triangle.tagMask_;
    var i = 0,
      j = 0;
    for (i = 0; i < nbLeaves; ++i)
    {
      var leaf = leavesUpdate[i];
      if (leaf === null)
        break;
      if (!leaf.iTris_.length)
        Octree.checkEmptiness(leaf, cutLeaves);
      else if (leaf.iTris_.length > octreeMaxTriangles && leaf.depth_ < octreeMaxDepth)
        leaf.constructCells(this);
    }
    Tools.tidy(cutLeaves);
    var nbCutLeaves = cutLeaves.length;
    for (i = 0; i < nbCutLeaves; ++i)
    {
      var oc = cutLeaves[i];
      var child = oc.child_;
      for (j = 0; j < 8; ++j)
        child[j] = null;
    }
    this.leavesUpdate_.length = 0;
  }
};