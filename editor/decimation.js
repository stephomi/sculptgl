'use strict';

/** Decimation */
Topology.prototype.decimation = function (iTris, detailMinSquared)
{
  var id = 0;
  var radiusSquared = this.radiusSquared_;
  var radius = Math.sqrt(radiusSquared);
  var mesh = this.mesh_;
  var triangles = mesh.triangles_;
  var vAr = mesh.vertexArray_;
  var iAr = mesh.indexArray_;

  this.iVertsDecimated_ = [];
  this.iTrisToDelete_ = [];
  this.iVertsToDelete_ = [];

  var center = this.center_;
  var cenx = center[0],
    ceny = center[1],
    cenz = center[2];
  var tmp = [0, 0, 0];

  for (var i = 0; i < iTris.length; ++i)
  {
    var iTri = iTris[i];
    if (triangles[iTri].tagFlag_ < 0)
      continue;

    id = iTri * 3;
    var iv1 = iAr[id],
      iv2 = iAr[id + 1],
      iv3 = iAr[id + 2];

    id = iv1 * 3;
    var v1x = vAr[id],
      v1y = vAr[id + 1],
      v1z = vAr[id + 2];

    id = iv2 * 3;
    var v2x = vAr[id],
      v2y = vAr[id + 1],
      v2z = vAr[id + 2];

    id = iv3 * 3;
    var v3x = vAr[id],
      v3y = vAr[id + 1],
      v3z = vAr[id + 2];

    var dx = (v1x + v2x + v3x) / 3 - cenx,
      dy = (v1y + v2y + v3y) / 3 - ceny,
      dz = (v1z + v2z + v3z) / 3 - cenz;
    var fallOff = dx * dx + dy * dy + dz * dz;
    if (this.checkPlane_)
    {
      var po = this.planeOrigin_;
      var pn = this.planeNormal_;
      if (vec3.dot(pn, vec3.sub(tmp, [v1x, v1y, v1z], po)) < 0 &&
        vec3.dot(pn, vec3.sub(tmp, [v2x, v2y, v2z], po)) < 0 &&
        vec3.dot(pn, vec3.sub(tmp, [v3x, v3y, v3z], po)) < 0)
        continue;
      fallOff = 1;
    }
    else if (fallOff < radiusSquared)
      fallOff = 1;
    else if (fallOff < radiusSquared * 2)
    {
      fallOff = (Math.sqrt(fallOff) - radius) / (radius * Math.SQRT2 - radius);
      fallOff = 3 * fallOff * fallOff * fallOff * fallOff - 4 * fallOff * fallOff * fallOff + 1;
    }
    else
      continue;

    dx = v2x - v1x;
    dy = v2y - v1y;
    dz = v2z - v1z;
    var len1 = dx * dx + dy * dy + dz * dz;

    dx = v2x - v3x;
    dy = v2y - v3y;
    dz = v2z - v3z;
    var len2 = dx * dx + dy * dy + dz * dz;

    dx = v1x - v3x;
    dy = v1y - v3y;
    dz = v1z - v3z;
    var len3 = dx * dx + dy * dy + dz * dz;

    if (len1 < len2 && len1 < len3)
    {
      if (len1 < detailMinSquared * fallOff)
        this.decimateTriangles(iTri, this.findOppositeTriangle(iTri, iv1, iv2), iTris);
    }
    else if (len2 < len3)
    {
      if (len2 < detailMinSquared * fallOff)
        this.decimateTriangles(iTri, this.findOppositeTriangle(iTri, iv2, iv3), iTris);
    }
    else
    {
      if (len3 < detailMinSquared * fallOff)
        this.decimateTriangles(iTri, this.findOppositeTriangle(iTri, iv1, iv3), iTris);
    }
  }
  this.applyDeletion();
  return this.getValidModifiedTriangles(this.getValidModifiedVertices(), iTris);
};

/** Apply deletion on vertices and triangles */
Topology.prototype.applyDeletion = function (ignoreOctree)
{
  var iTrisToDelete = this.iTrisToDelete_;
  Utils.tidy(iTrisToDelete);
  var nbTrisDelete = iTrisToDelete.length;
  var i = 0;
  for (i = nbTrisDelete - 1; i >= 0; --i)
    this.deleteTriangle(iTrisToDelete[i], ignoreOctree);

  var iVertsToDelete = this.iVertsToDelete_;
  Utils.tidy(iVertsToDelete);
  var nbVertsToDelete = iVertsToDelete.length;
  for (i = nbVertsToDelete - 1; i >= 0; --i)
    this.deleteVertex(iVertsToDelete[i]);
};

/** Return the valid modified vertices (no duplicates) */
Topology.prototype.getValidModifiedVertices = function ()
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;

  var iVertsDecimated = this.iVertsDecimated_;
  var nbVertsDecimated = iVertsDecimated.length;
  var nbVertices = vertices.length;
  var vertexTagMask = ++Vertex.tagMask_;
  var validVertices = [];
  for (var i = 0; i < nbVertsDecimated; ++i)
  {
    var iVert = iVertsDecimated[i];
    if (iVert >= nbVertices)
      continue;
    var v = vertices[iVert];
    if (v.tagFlag_ === vertexTagMask)
      continue;
    v.tagFlag_ = vertexTagMask;
    validVertices.push(iVert);
  }
  return validVertices;
};

/** Return the valid modified triangles (no duplicates) */
Topology.prototype.getValidModifiedTriangles = function (iVerts, iTris)
{
  var mesh = this.mesh_;
  var triangles = mesh.triangles_;

  var newTris = mesh.getTrianglesFromVertices(iVerts);
  iTris.push.apply(iTris, newTris);

  var validTriangles = [];
  var nbTris = iTris.length;
  var nbTriangles = triangles.length;
  var triangleTagMask = ++Triangle.tagMask_;
  for (var i = 0; i < nbTris; ++i)
  {
    var iTri = iTris[i];
    if (iTri >= nbTriangles)
      continue;
    var t = triangles[iTri];
    if (t.tagFlag_ === triangleTagMask)
      continue;
    t.tagFlag_ = triangleTagMask;
    validTriangles.push(iTri);
  }
  return validTriangles;
};

/** Find opposite triangle */
Topology.prototype.findOppositeTriangle = function (iTri, iv1, iv2)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var iTris1 = vertices[iv1].tIndices_,
    iTris2 = vertices[iv2].tIndices_;
  iTris1.sort(function (a, b)
  {
    return a - b;
  });
  iTris2.sort(function (a, b)
  {
    return a - b;
  });
  var res = Utils.intersectionArrays(iTris1, iTris2);
  if (res.length !== 2)
    return -1;
  return res[0] === iTri ? res[1] : res[0];
};

/** Decimate triangles (find orientation of the 2 triangles) */
Topology.prototype.decimateTriangles = function (iTri1, iTri2, iTris)
{
  if (iTri2 === -1)
    return;
  var mesh = this.mesh_;
  var iAr = mesh.indexArray_;

  var id = iTri1 * 3;
  var iv11 = iAr[id],
    iv21 = iAr[id + 1],
    iv31 = iAr[id + 2];

  id = iTri2 * 3;
  var iv12 = iAr[id],
    iv22 = iAr[id + 1],
    iv32 = iAr[id + 2];
  if (iv11 === iv12)
  {
    if (iv21 === iv32)
      this.edgeCollapse(iTri1, iTri2, iv11, iv21, iv31, iv22, iTris);
    else
      this.edgeCollapse(iTri1, iTri2, iv11, iv31, iv21, iv32, iTris);
  }
  else if (iv11 === iv22)
  {
    if (iv21 === iv12)
      this.edgeCollapse(iTri1, iTri2, iv11, iv21, iv31, iv32, iTris);
    else
      this.edgeCollapse(iTri1, iTri2, iv11, iv31, iv21, iv12, iTris);
  }
  else if (iv11 === iv32)
  {
    if (iv21 === iv22)
      this.edgeCollapse(iTri1, iTri2, iv11, iv21, iv31, iv12, iTris);
    else
      this.edgeCollapse(iTri1, iTri2, iv11, iv31, iv21, iv22, iTris);
  }
  else if (iv21 === iv12)
    this.edgeCollapse(iTri1, iTri2, iv31, iv21, iv11, iv22, iTris);
  else if (iv21 === iv22)
    this.edgeCollapse(iTri1, iTri2, iv31, iv21, iv11, iv32, iTris);
  else
    this.edgeCollapse(iTri1, iTri2, iv31, iv21, iv11, iv12, iTris);
};

/** Decimate 2 triangles (collapse 1 edge) */
Topology.prototype.edgeCollapse = function (iTri1, iTri2, iv1, iv2, ivOpp1, ivOpp2, iTris)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var cAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;

  var v1 = vertices[iv1],
    v2 = vertices[iv2];
  var ring1 = v1.ringVertices_,
    ring2 = v2.ringVertices_;
  var tris1 = v1.tIndices_,
    tris2 = v2.tIndices_;
  var vOpp1 = vertices[ivOpp1],
    vOpp2 = vertices[ivOpp2];

  // vertices on the edge... we don't do anything
  if (ring1.length !== tris1.length)
    return;
  if (ring2.length !== tris2.length)
    return;
  if (vOpp1.ringVertices_.length !== vOpp1.tIndices_.length)
    return;
  if (vOpp2.ringVertices_.length !== vOpp2.tIndices_.length)
    return;

  this.iVertsDecimated_.push(iv1, iv2);

  //undo-redo
  this.states_.pushState(tris1, ring1);
  this.states_.pushState(tris2, ring2);

  ring1.sort(function (a, b)
  {
    return a - b;
  });
  ring2.sort(function (a, b)
  {
    return a - b;
  });
  var res = Utils.intersectionArrays(ring1, ring2);

  var id = 0;
  if (res.length >= 3) //edge flip
  {
    v1.removeTriangle(iTri2);
    v2.removeTriangle(iTri1);
    vOpp1.tIndices_.push(iTri2);
    vOpp2.tIndices_.push(iTri1);
    id = iTri1 * 3;
    if (iAr[id] === iv2) iAr[id] = ivOpp2;
    else if (iAr[id + 1] === iv2) iAr[id + 1] = ivOpp2;
    else iAr[id + 2] = ivOpp2;

    id = iTri2 * 3;
    if (iAr[id] === iv1) iAr[id] = ivOpp1;
    else if (iAr[id + 1] === iv1) iAr[id + 1] = ivOpp1;
    else iAr[id + 2] = ivOpp1;
    mesh.computeRingVertices(iv1);
    mesh.computeRingVertices(iv2);
    mesh.computeRingVertices(ivOpp1);
    mesh.computeRingVertices(ivOpp2);
    this.cleanUpSingularVertex(iv1);
    this.cleanUpSingularVertex(iv2);
    this.cleanUpSingularVertex(ivOpp1);
    this.cleanUpSingularVertex(ivOpp2);
    return;
  }

  id = iv1 * 3;
  var id2 = iv2 * 3;
  var nx = nAr[id] + nAr[id2],
    ny = nAr[id + 1] + nAr[id2 + 1],
    nz = nAr[id + 2] + nAr[id2 + 2];
  cAr[id] = (cAr[id] + cAr[id2]) * 0.5,
  cAr[id + 1] = (cAr[id + 1] + cAr[id2 + 1]) * 0.5,
  cAr[id + 2] = (cAr[id + 2] + cAr[id2 + 2]) * 0.5;
  var len = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx *= len;
  ny *= len;
  nz *= len;
  nAr[id] = nx;
  nAr[id + 1] = ny;
  nAr[id + 2] = nz;
  ring1.push.apply(ring1, ring2);

  v1.removeTriangle(iTri1);
  v1.removeTriangle(iTri2);
  v2.removeTriangle(iTri1);
  v2.removeTriangle(iTri2);
  vOpp1.removeTriangle(iTri1);
  vOpp2.removeTriangle(iTri2);
  tris1.push.apply(tris1, tris2);

  var nbTris2 = tris2.length;
  var i = 0;
  for (i = 0; i < nbTris2; ++i)
  {
    var iTri = tris2[i] * 3;
    if (iAr[iTri] === iv2) iAr[iTri] = iv1;
    else if (iAr[iTri + 1] === iv2) iAr[iTri + 1] = iv1;
    else iAr[iTri + 2] = iv1;
  }

  mesh.computeRingVertices(iv1);

  //flat smooth the vertex...
  var meanX = 0,
    meanY = 0,
    meanZ = 0;
  var nbRing1 = ring1.length;
  for (i = 0; i < nbRing1; ++i)
  {
    var ivRing = ring1[i];
    mesh.computeRingVertices(ivRing);
    ivRing *= 3;
    meanX += vAr[ivRing];
    meanY += vAr[ivRing + 1];
    meanZ += vAr[ivRing + 2];
  }
  meanX /= nbRing1;
  meanY /= nbRing1;
  meanZ /= nbRing1;
  var dot = nx * (meanX - vAr[id]) + ny * (meanY - vAr[id + 1]) + nz * (meanZ - vAr[id + 2]);
  vAr[id] = meanX - nx * dot;
  vAr[id + 1] = meanY - ny * dot;
  vAr[id + 2] = meanZ - nz * dot;

  v2.tagFlag_ = -1;
  triangles[iTri1].tagFlag_ = -1;
  triangles[iTri2].tagFlag_ = -1;
  this.iVertsToDelete_.push(iv2);
  this.iTrisToDelete_.push(iTri1, iTri2);

  iTris.push.apply(iTris, tris1);

  this.cleanUpSingularVertex(iv1);
};

/** Update last triangle of array and move its position */
Topology.prototype.deleteTriangle = function (iTri, ignoreOctree)
{
  var id = 0;
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var iAr = mesh.indexArray_;

  if (!ignoreOctree)
  {
    var t = triangles[iTri];
    var oldPos = t.posInLeaf_;
    var iTrisLeaf = t.leaf_.iTris_;
    var lastTri = iTrisLeaf[iTrisLeaf.length - 1];
    if (iTri !== lastTri)
    {
      iTrisLeaf[oldPos] = lastTri;
      triangles[lastTri].posInLeaf_ = oldPos;
    }
    iTrisLeaf.pop();
  }

  var lastPos = triangles.length - 1;
  if (lastPos === iTri)
  {
    triangles.pop();
    return;
  }
  var last = triangles[lastPos];
  id = lastPos * 3;
  var iv1 = iAr[id],
    iv2 = iAr[id + 1],
    iv3 = iAr[id + 2];

  //undo-redo
  this.states_.pushState([lastPos], [iv1, iv2, iv3]);

  last.id_ = iTri;
  if (!ignoreOctree)
  {
    var iTrisLeafLast = last.leaf_.iTris_;
    iTrisLeafLast[last.posInLeaf_] = iTri;
  }

  var v1 = vertices[iv1],
    v2 = vertices[iv2],
    v3 = vertices[iv3];

  v1.replaceTriangle(lastPos, iTri);
  v2.replaceTriangle(lastPos, iTri);
  v3.replaceTriangle(lastPos, iTri);
  this.iVertsDecimated_.push(iv1, iv2, iv3);

  triangles[iTri] = last;
  iTri *= 3;
  iAr[iTri] = iv1;
  iAr[iTri + 1] = iv2;
  iAr[iTri + 2] = iv3;

  triangles.pop();
};

/** Update last vertex of array and move its position */
Topology.prototype.deleteVertex = function (iVert)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var cAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;

  var lastPos = vertices.length - 1;
  if (iVert === lastPos)
  {
    vertices.pop();
    return;
  }
  var id = 0;
  var last = vertices[lastPos];
  id = lastPos * 3;
  var lastVx = vAr[id],
    lastVy = vAr[id + 1],
    lastVz = vAr[id + 2];
  var lastNx = nAr[id],
    lastNy = nAr[id + 1],
    lastNz = nAr[id + 2];
  var lastCr = cAr[id],
    lastCg = cAr[id + 1],
    lastCb = cAr[id + 2];

  //undo-redo
  var states = this.states_;
  states.pushState(null, [lastPos]);

  last.id_ = iVert;
  var iTris = last.tIndices_;
  var ring = last.ringVertices_;
  var nbTris = iTris.length;
  var nbRing = ring.length;
  var i = 0;
  for (i = 0; i < nbTris; ++i)
  {
    id = iTris[i];

    //undo-redo
    states.pushState([id], null);

    id *= 3;
    if (iAr[id] === lastPos) iAr[id] = iVert;
    else if (iAr[id + 1] === lastPos) iAr[id + 1] = iVert;
    else iAr[id + 2] = iVert;
  }

  for (i = 0; i < nbRing; ++i)
  {
    id = ring[i];
    var v = vertices[id];

    //undo-redo
    states.pushState(null, [id]);

    v.replaceRingVertex(lastPos, iVert);
  }
  vertices[iVert] = last;
  id = iVert * 3;
  vAr[id] = lastVx;
  vAr[id + 1] = lastVy;
  vAr[id + 2] = lastVz;
  nAr[id] = lastNx;
  nAr[id + 1] = lastNy;
  nAr[id + 2] = lastNz;
  cAr[id] = lastCr;
  cAr[id + 1] = lastCg;
  cAr[id + 2] = lastCb;

  vertices.pop();
};