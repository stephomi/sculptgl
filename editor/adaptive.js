'use strict';

/** Adapt topology */
Topology.prototype.adaptTopology = function (iTris, d2Thickness)
{
  var mesh = this.mesh_;
  var triangles = mesh.triangles_;
  var vAr = mesh.vertexArray_;

  var radiusSquared = this.radiusSquared_;

  var iVerts = mesh.getVerticesFromTriangles(iTris);
  var nbVerts = iVerts.length;
  var vec = [];
  var nbVertices = mesh.vertices_.length;
  var i = 0,
    id = 0;
  var center = this.center_;
  var cx = center[0],
    cy = center[1],
    cz = center[2];
  var dx = 0.0,
    dy = 0.0,
    dz = 0.0;
  for (i = 0; i < nbVerts; ++i)
  {
    var iVert = iVerts[i];
    if (iVert >= nbVertices)
      continue;
    id = iVert * 3;
    dx = vAr[id] - cx;
    dy = vAr[id + 1] - cy;
    dz = vAr[id + 2] - cz;
    if ((dx * dx + dy * dy + dz * dz) < radiusSquared)
      vec.push(iVert);
  }
  this.checkCollisions(vec, d2Thickness);
  var newTris = mesh.getTrianglesFromVertices(this.iVertsDecimated_);
  iTris.push.apply(iTris, newTris);

  var iTrisTemp = [];
  var nbTrisTemp = iTris.length;
  var nbTriangles = triangles.length;
  ++Triangle.tagMask_;
  var triangleTagMask = Triangle.tagMask_;
  for (i = 0; i < nbTrisTemp; ++i)
  {
    var iTri = iTris[i];
    if (iTri >= nbTriangles)
      continue;
    var t = triangles[iTri];
    if (t.tagFlag_ === triangleTagMask)
      continue;
    t.tagFlag_ = triangleTagMask;
    iTrisTemp.push(iTri);
  }
  return iTrisTemp;
};

/** Check incoming collisions */
Topology.prototype.checkCollisions = function (iVerts, d2Thickness)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var vAr = mesh.vertexArray_;

  var id = 0;
  this.iVertsDecimated_ = [];
  this.iTrisToDelete_ = [];
  this.iVertsToDelete_ = [];
  var r2Thickness = d2Thickness * 0.25; //squared diameter to radius squared

  var aabb = new Aabb();
  var nbVerts = iVerts.length;
  if (nbVerts > 0)
  {
    id = iVerts[0] * 3;
    aabb.min_ = [vAr[id], vAr[id + 1], vAr[id + 2]];
    aabb.max_ = [vAr[id], vAr[id + 1], vAr[id + 2]];
  }
  var i = 0,
    j = 0;
  for (i = 0; i < nbVerts; ++i)
  {
    id = iVerts[i] * 3;
    aabb.expandsWithPoint(vAr[id], vAr[id + 1], vAr[id + 2]);
  }

  var grid = new Grid();
  grid.setBoundaries(aabb);
  grid.init(Math.sqrt(r2Thickness));
  grid.build(mesh, iVerts);

  for (i = 0; i < nbVerts; ++i)
  {
    var iVert = iVerts[i];
    var v = vertices[iVert];
    if (v.tagFlag_ < 0)
      continue;
    var ring = v.ringVertices_;
    var nbRing = ring.length;
    ++Vertex.tagMask_;
    for (j = 0; j < nbRing; ++j)
      vertices[ring[j]].tagFlag_ = Vertex.tagMask_;

    id = iVert * 3;
    var vx = vAr[id],
      vy = vAr[id + 1],
      vz = vAr[id + 2];
    var iNearVerts = grid.getNeighborhood(vx, vy, vz);
    var nbNearVerts = iNearVerts.length;
    for (j = 0; j < nbNearVerts; ++j)
    {
      var jVert = iNearVerts[j];
      if (iVert === jVert)
        continue;
      var vTest = vertices[jVert];
      if (vTest.tagFlag_ < 0 || vTest.tagFlag_ === Vertex.tagMask_)
        continue;
      id = jVert * 3;
      var dx = vx - vAr[id],
        dy = vy - vAr[id + 1],
        dz = vz - vAr[id + 2];
      if ((dx * dx + dy * dy + dz * dz) < r2Thickness)
      {
        if (nbRing > vTest.ringVertices_.length)
          this.vertexJoin(iVert, jVert);
        else
          this.vertexJoin(jVert, iVert);
        break;
      }
    }
  }

  this.applyDeletion();
  this.iVertsDecimated_ = this.getValidModifiedVertices();

  var iVertsDecimated = this.iVertsDecimated_;
  var nbVertsDecimated = iVertsDecimated.length;
  var vSmooth = [];
  var vertexSculptMask = Vertex.sculptMask_;
  for (i = 0; i < nbVertsDecimated; ++i)
  {
    id = iVertsDecimated[i];
    if (vertices[id].sculptFlag_ === vertexSculptMask)
      vSmooth.push(id);
  }
  var sc = new Sculpt();
  sc.mesh_ = mesh;
  mesh.expandsVertices(vSmooth, 1);
  sc.smooth(vSmooth, 1.0);
};

/** Vertex joint */
Topology.prototype.vertexJoin = function (iv1, iv2)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;

  var v1 = vertices[iv1],
    v2 = vertices[iv2];

  var iTris1 = v1.tIndices_,
    iTris2 = v2.tIndices_;
  var ring1 = v1.ringVertices_.slice(0),
    ring2 = v2.ringVertices_.slice(0);
  var nbRing1 = ring1.length,
    nbRing2 = ring2.length;

  //undo-redo
  this.states_.pushState(iTris1, ring1);
  this.states_.pushState(iTris2, ring2);
  this.states_.pushState(null, [iv1, iv2]);

  var edges1 = [],
    edges2 = [];

  this.trianglesRotate(v1.tIndices_, iv1, edges1);
  if (!this.adjustEdgeOrientation(edges1))
    return;

  this.trianglesRotate(v2.tIndices_, iv2, edges2);
  if (!this.adjustEdgeOrientation(edges2))
    return;

  ring1.sort(function (a, b)
  {
    return a - b;
  });
  ring2.sort(function (a, b)
  {
    return a - b;
  });
  var common = Utils.intersectionArrays(ring1, ring2);

  if (common.length === 0)
    this.connect1Ring(edges1, edges2);
  else
    this.connect1RingCommonVertices(edges1, edges2, common);

  var i = 0;
  for (i = 0; i < nbRing1; ++i) mesh.computeRingVertices(ring1[i]);
  for (i = 0; i < nbRing2; ++i) mesh.computeRingVertices(ring2[i]);

  this.iVertsDecimated_.push(iv1, iv2);
  this.iVertsToDelete_.push(iv1, iv2);
  v1.tagFlag_ = -1;
  v2.tagFlag_ = -1;

  this.cleanUpNeighborhood(ring1, ring2);
};

/** Connect two 1-ring with vertices in common */
Topology.prototype.connect1RingCommonVertices = function (edges1, edges2, common)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var nbEdges1 = edges1.length,
    nbEdges2 = edges2.length,
    nbCommon = common.length;
  var i = 0;
  ++Vertex.tagMask_;
  var vertexTagMask = Vertex.tagMask_;
  for (i = 0; i < nbCommon; ++i)
    vertices[common[i]].tagFlag_ = vertexTagMask;

  //delete triangles
  var iTrisToDelete = this.iTrisToDelete_;
  var v1 = null,
    v2 = null;
  var iTri = 0;
  for (i = 0; i < nbEdges1; ++i)
  {
    v1 = vertices[edges1[i].v1];
    v2 = vertices[edges1[i].v2];
    if (v1.tagFlag_ === vertexTagMask && v2.tagFlag_ === vertexTagMask)
    {
      iTri = edges1[i].t;
      v1.removeTriangle(iTri);
      v2.removeTriangle(iTri);
      triangles[iTri].tagFlag_ = -1;
      iTrisToDelete.push(iTri);
    }
  }
  for (i = 0; i < nbEdges2; ++i)
  {
    v1 = vertices[edges2[i].v1];
    v2 = vertices[edges2[i].v2];
    if (v1.tagFlag_ === vertexTagMask && v2.tagFlag_ === vertexTagMask)
    {
      iTri = edges2[i].t;
      v1.removeTriangle(iTri);
      v2.removeTriangle(iTri);
      triangles[iTri].tagFlag_ = -1;
      iTrisToDelete.push(iTri);
    }
  }

  var subEdges1 = [],
    subEdges2 = [];
  subEdges1.push([]);
  subEdges2.push([]);

  this.matchEdgesCommonVertices(edges1, edges2, common[0]);

  for (i = 0; i < nbEdges1; ++i)
  {
    v1 = vertices[edges1[i].v1];
    v2 = vertices[edges1[i].v2];
    if (v1.tagFlag_ !== vertexTagMask || v2.tagFlag_ !== vertexTagMask)
      subEdges1[subEdges1.length - 1].push(edges1[i]);
    if (v2.tagFlag_ === vertexTagMask && subEdges1[subEdges1.length - 1].length !== 0)
      subEdges1.push([]);
  }
  for (i = 0; i < nbEdges2; ++i)
  {
    v1 = vertices[edges2[i].v1];
    v2 = vertices[edges2[i].v2];
    if (v1.tagFlag_ !== vertexTagMask || v2.tagFlag_ !== vertexTagMask)
      subEdges2[subEdges2.length - 1].push(edges2[i]);
    if (v2.tagFlag_ === vertexTagMask && subEdges2[subEdges2.length - 1].length !== 0)
      subEdges2.push([]);
  }

  if (subEdges1[subEdges1.length - 1].length === 0)
    subEdges1.pop();
  if (subEdges2[subEdges2.length - 1].length === 0)
    subEdges2.pop();

  var nbSubEdges1 = subEdges1.length,
    nbSubEdges2 = subEdges2.length;

  //connect linked edges (loops)
  var i2 = nbSubEdges2 - 1,
    i1 = 0;
  var iv1 = 0,
    iv2 = 0;
  while (i1 < nbSubEdges1 || i2 >= 0)
  {
    iv1 = -1;
    iv2 = -1;
    if (i1 < nbSubEdges1)
      iv1 = subEdges1[i1][0].v1;
    if (i2 >= 0)
      iv2 = subEdges2[i2][subEdges2[i2].length - 1].v2;
    if (iv1 === iv2)
    {
      if (subEdges1[i1].length > subEdges2[i2].length)
        this.connectLinkedEdges(subEdges1[i1], subEdges2[i2]);
      else
        this.connectLinkedEdges(subEdges2[i2], subEdges1[i1]);
      ++i1;
      --i2;
    }
    else
    {
      for (i = 0; i < nbEdges1; ++i)
      {
        var ivTest = edges1[i].v1;
        if (ivTest === iv1)
        {
          this.connectLoop(subEdges1[i1]);
          ++i1;
          break;
        }
        else if (ivTest === iv2)
        {
          this.connectLoop(subEdges2[i2]);
          --i2;
          break;
        }
      }
    }
  }
};

/** Connect disconnected 1-ring */
Topology.prototype.connect1Ring = function (edges1, edges2)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var iAr = mesh.indexArray_;

  this.matchEdgesNearest(edges1, edges2);
  var nbEdges1 = edges1.length,
    nbEdges2 = edges2.length;
  var step = nbEdges2 / nbEdges1;
  var temp = 0;
  if (nbEdges1 === nbEdges2)
    temp = -1;
  var i = 0,
    j = 0;
  for (i = 0; i < nbEdges1; ++i)
  {
    j = 0;
    if (i !== 0)
      j = Math.floor(nbEdges2 - step * i);
    iAr[edges1[i].t * 3 + 2] = edges2[j].v1;
    vertices[edges2[j].v1].tIndices_.push(edges1[i].t);
    if (j !== temp)
    {
      iAr[edges2[j].t * 3 + 2] = edges1[i].v1;
      vertices[edges1[i].v1].tIndices_.push(edges2[j].t);
    }
    temp = j;
  }
};

/** Connect two edges that are linked together at their ends, delete two triangles and connect the edges */
Topology.prototype.connectLinkedEdges = function (edges1, edges2)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var iAr = mesh.indexArray_;

  var nbEdges1 = edges1.length,
    nbEdges2 = edges2.length;

  var edgeTemp = edges2[0];
  var iTri1 = edgeTemp.t;
  vertices[edgeTemp.v1].removeTriangle(iTri1);
  vertices[edgeTemp.v2].removeTriangle(iTri1);

  edgeTemp = edges2[nbEdges2 - 1];
  var iTri2 = edgeTemp.t;
  vertices[edgeTemp.v1].removeTriangle(iTri2);
  vertices[edgeTemp.v2].removeTriangle(iTri2);

  var step = nbEdges2 / nbEdges1;
  var temp = 0;
  var i = 0,
    j = 0;
  for (i = 0; i < nbEdges1; ++i)
  {
    j = Math.floor(nbEdges2 - step * (i + 1));
    if (j < 1)
      j = 1;
    iAr[edges1[i].t * 3 + 2] = edges2[j].v1;
    vertices[edges2[j].v1].tIndices_.push(edges1[i].t);
    if (j !== temp && j !== (nbEdges2 - 1))
    {
      iAr[edges2[j].t * 3 + 2] = edges1[i].v1;
      vertices[edges1[i].v1].tIndices_.push(edges2[j].t);
    }
    temp = j;
  }
  triangles[iTri1].tagFlag_ = -1;
  triangles[iTri2].tagFlag_ = -1;
  this.iTrisToDelete_.push(iTri1, iTri2);
};

/** Connect a single loop, delete one triangle and fill the loop */
Topology.prototype.connectLoop = function (edges)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var iAr = mesh.indexArray_;

  var nbEdges = edges.length;
  var firstEdge = edges[0];
  var iTri = firstEdge.t;
  var iv = firstEdge.v1;
  vertices[iv].removeTriangle(iTri);
  vertices[firstEdge.v2].removeTriangle(iTri);
  var v = vertices[iv];
  for (var i = 1; i < nbEdges; ++i)
  {
    var iTriEdge = edges[i].t;
    iAr[iTriEdge * 3 + 2] = iv;
    v.tIndices_.push(iTriEdge);
  }
  mesh.triangles_[iTri].tagFlag_ = -1;
  this.iTrisToDelete_.push(iTri);
};

/** Change indices order */
Topology.prototype.trianglesRotate = function (iTris, iv, edges)
{
  var mesh = this.mesh_;
  var iAr = mesh.indexArray_;

  var nbTris = iTris.length;
  var id = 0,
    iv1 = 0,
    iv2 = 0,
    iv3 = 0;
  for (var i = 0; i < nbTris; ++i)
  {
    id = iTris[i] * 3;
    iv1 = iAr[id];
    iv2 = iAr[id + 1];
    iv3 = iAr[id + 2];
    if (iv3 !== iv)
    {
      if (iv1 === iv)
      {
        iAr[id] = iv2;
        iAr[id + 1] = iv3;
        iAr[id + 2] = iv;
      }
      else
      {
        iAr[id + 1] = iv1;
        iAr[id] = iv3;
        iAr[id + 2] = iv;
      }
    }
    edges.push(
    {
      v1: iAr[id],
      v2: iAr[id + 1],
      t: iTris[i]
    });
  }
};

/** Adjust edges orientation, it makes a loop. For singular edge and singular vertex, it makes consecutive loops */
Topology.prototype.adjustEdgeOrientation = function (edges)
{
  var nbEdges = edges.length;
  var swapTemp = 0,
    temp = -1;
  var vFirst = edges[0].v1;
  var i = 0,
    j = 0;
  for (i = 0; i < (nbEdges - 1); i++)
  {
    var e = edges[i];
    var vNext = e.v2;
    temp = -1;
    for (j = i + 1; j < nbEdges; ++j)
    {
      if (edges[j].v1 === vNext)
      {
        if (edges[j].v2 !== vFirst)
          temp = j;
        else
        {
          swapTemp = edges[i + 1];
          edges[i + 1] = edges[j];
          edges[j] = swapTemp;
          ++i;
          if ((i + 1) < nbEdges)
            vFirst = edges[i + 1].v1;
          break;
        }
      }
    }
    if (j === nbEdges) //non singular vertex
    {
      if (temp === -1)
        return false;
      swapTemp = edges[i + 1];
      edges[i + 1] = edges[temp];
      edges[temp] = swapTemp;
    }
  }
  return true;
};

/** Adjust edges orientation starting from a vertex in common */
Topology.prototype.matchEdgesCommonVertices = function (edges1, edges2, ivCommon)
{
  var nbEdges1 = edges1.length;
  var match = -1;
  var i = 0;
  for (i = 0; i < nbEdges1; ++i)
  {
    if (edges1[i].v1 === ivCommon)
    {
      match = i;
      break;
    }
  }
  Utils.rotateArray(edges1, match);

  var nbEdges2 = edges2.length;
  match = -1;
  for (i = 0; i < nbEdges2; ++i)
  {
    if (edges2[i].v1 === ivCommon)
    {
      match = i;
      break;
    }
  }
  Utils.rotateArray(edges2, match);
};

/** Adjust edges orientation taking the closest vertex as a starting point */
Topology.prototype.matchEdgesNearest = function (edges1, edges2)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;

  var nearest = 0;
  var iv = edges1[0].v1 * 3;
  var vx = vAr[iv],
    vy = vAr[iv + 1],
    vz = vAr[iv + 2];
  iv = edges2[0].v1 * 3;
  var dx = vx - vAr[iv],
    dy = vy - vAr[iv + 1],
    dz = vz - vAr[iv + 2];
  var minDist = dx * dx + dy * dy + dz * dz;
  var nbEdges2 = edges2.length;
  for (var i = 1; i < nbEdges2; ++i)
  {
    iv = edges2[i].v1 * 3;
    dx = vx - vAr[iv];
    dy = vy - vAr[iv + 1];
    dz = vz - vAr[iv + 2];
    var distTest = dx * dx + dy * dy + dz * dz;
    if (distTest < minDist)
    {
      minDist = distTest;
      nearest = i;
    }
  }
  Utils.rotateArray(edges2, nearest);
};

/** Clean up neighborhood */
Topology.prototype.cleanUpNeighborhood = function (ring1, ring2)
{
  var nbRing1 = ring1.length;
  var i = 0;
  for (i = 0; i < nbRing1; ++i)
    this.cleanUpSingularVertex(ring1[i]);
  var nbRing2 = ring2.length;
  for (i = 0; i < nbRing2; ++i)
    this.cleanUpSingularVertex(ring2[i]);
};

/** Split a degenerate vertex in two */
Topology.prototype.cleanUpSingularVertex = function (iv)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var cAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;

  var v = vertices[iv];

  if (v.tagFlag_ < 0) //vertex to be deleted
    return;

  var id = 0;
  id = iv * 3;
  var vx = vAr[id],
    vy = vAr[id + 1],
    vz = vAr[id + 2];
  var nx = nAr[id],
    ny = nAr[id + 1],
    nz = nAr[id + 2];
  var cr = cAr[id],
    cg = cAr[id + 1],
    cb = cAr[id + 2];

  //undo-redo
  this.states_.pushState(v.tIndices_, v.ringVertices_);
  this.states_.pushState(null, [iv]);

  if (this.deleteVertexIfDegenerate(iv))
    return;

  var edges = [];
  this.trianglesRotate(v.tIndices_, iv, edges);
  if (!this.adjustEdgeOrientation(edges))
    return;

  var nbEdges = edges.length;
  var vFirst = edges[0].v1;
  var endLoop = -1;
  var i = 0;
  for (i = 1; i < (nbEdges - 1); ++i)
  {
    var vEdge = edges[i].v2;
    if (vEdge === vFirst)
    {
      endLoop = i;
      break;
    }
  }
  if (endLoop === -1)
    return;

  this.checkArrayLength(1); //XXX
  vAr = mesh.vertexArray_;
  nAr = mesh.normalArray_;
  cAr = mesh.colorArray_;
  iAr = mesh.indexArray_;

  var ivNew = vertices.length;
  var vNew = new Vertex(ivNew);
  vNew.stateFlag_ = Mesh.stateMask_;
  id = ivNew * 3;
  vAr[id] = vx;
  vAr[id + 1] = vy;
  vAr[id + 2] = vz;
  nAr[id] = -nx;
  nAr[id + 1] = -ny;
  nAr[id + 2] = -nz;
  cAr[id] = cr;
  cAr[id + 1] = cg;
  cAr[id + 2] = cb;

  for (i = 0; i <= endLoop; ++i)
  {
    var iTri = edges[i].t;
    vNew.tIndices_.push(iTri);
    v.removeTriangle(iTri);
    iAr[iTri * 3 + 2] = ivNew;
  }

  vertices.push(vNew);
  mesh.computeRingVertices(iv);
  mesh.computeRingVertices(ivNew);

  var ring1 = vNew.ringVertices_;
  var nbRing1 = ring1.length;
  for (i = 0; i < nbRing1; ++i)
    mesh.computeRingVertices(ring1[i]);

  var ring2 = v.ringVertices_;
  var nbRing2 = ring2.length;
  for (i = 0; i < nbRing2; ++i)
    mesh.computeRingVertices(ring2[i]);

  this.iVertsDecimated_.push(iv, ivNew);

  var vSmooth = [];
  vSmooth.push(iv, ivNew);
  var smo = new Sculpt();
  smo.mesh_ = mesh;
  smo.smooth(vSmooth, 1.0);

  this.cleanUpSingularVertex(iv);
  this.cleanUpSingularVertex(ivNew);
};

/** Delete vertex if it is degenerate */
Topology.prototype.deleteVertexIfDegenerate = function (iv)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var iAr = mesh.indexArray_;

  var v = vertices[iv];
  if (v.tagFlag_ < 0)
    return true;

  Utils.tidy(v.tIndices_);
  var nbTris = v.tIndices_.length;
  var i = 0,
    id = 0,
    iVert = 0;
  if (nbTris === 0)
  {
    v.tagFlag_ = -1;
    this.iVertsToDelete_.push(iv);
    this.iVertsDecimated_.push(iv);
    return true;
  }
  else if (nbTris === 1)
  {
    var iTri = v.tIndices_[0];
    id = iTri * 3;
    var verts = [];
    verts.push(iAr[id], iAr[id + 1], iAr[id + 2]);
    Utils.tidy(verts);
    var nbVerts = verts.length;
    for (i = 0; i < nbVerts; ++i)
    {
      iVert = verts[i];
      if (iVert !== iv)
      {
        vertices[iVert].removeTriangle(iTri);
        mesh.computeRingVertices(iVert);
      }
    }
    v.tagFlag_ = -1;
    triangles[iTri].tagFlag_ = -1;
    this.iTrisToDelete_.push(iTri);
    this.iVertsToDelete_.push(iv);
    this.iVertsDecimated_.push(iv);
    for (i = 0; i < nbVerts; ++i)
    {
      iVert = verts[i];
      if (iVert !== iv)
      {
        if (vertices[iVert].tIndices_.length < 3)
          this.deleteVertexIfDegenerate(iVert);
      }
    }
    return true;
  }
  else if (nbTris === 2)
  {
    var iTri1 = v.tIndices_[0];
    id = iTri1 * 3;
    var verts1 = [];
    verts1.push(iAr[id], iAr[id + 1], iAr[id + 2]);
    Utils.tidy(verts1);
    var nbVerts1 = verts1.length;
    for (i = 0; i < nbVerts1; ++i)
    {
      iVert = verts1[i];
      if (iVert !== iv)
      {
        vertices[iVert].removeTriangle(iTri1);
        mesh.computeRingVertices(iVert);
      }
    }

    var iTri2 = v.tIndices_[1];
    id = iTri2 * 3;
    var verts2 = [];
    verts2.push(iAr[id], iAr[id + 1], iAr[id + 2]);

    Utils.tidy(verts2);
    var nbVerts2 = verts2.length;
    for (i = 0; i < nbVerts2; ++i)
    {
      iVert = verts2[i];
      if (iVert !== iv)
      {
        vertices[iVert].removeTriangle(iTri2);
        mesh.computeRingVertices(iVert);
      }
    }

    v.tagFlag_ = -1;
    triangles[iTri1].tagFlag_ = -1;
    triangles[iTri2].tagFlag_ = -1;
    this.iTrisToDelete_.push(iTri1, iTri2);
    this.iVertsToDelete_.push(iv);
    this.iVertsDecimated_.push(iv);
    for (i = 0; i < nbVerts1; ++i)
    {
      iVert = verts1[i];
      if (iVert !== iv)
      {
        if (vertices[iVert].tIndices_.length < 3)
          this.deleteVertexIfDegenerate(iVert);
      }
    }
    for (i = 0; i < nbVerts2; ++i)
    {
      iVert = verts2[i];
      if (iVert !== iv)
      {
        if (vertices[iVert].tIndices_.length < 3)
          this.deleteVertexIfDegenerate(iVert);
      }
    }
    return true;
  }
  return false;
};