'use strict';

/** Subdivide until every selected triangles comply with a detail level */
Topology.prototype.subdivision = function (iTris, detailMaxSquared)
{
  var triangles = this.mesh_.triangles_;
  var nbTriangles = 0;
  do {
    nbTriangles = triangles.length;
    iTris = this.subdivide(iTris, detailMaxSquared);
  }
  while (nbTriangles !== triangles.length);
  return iTris;
};

/**
 * Subdivide a set of triangle. Main steps are :
 * 1. Detect the triangles that need to be split, and at which edge the split should occur
 * 2. Subdivide all those triangles (split them in two)
 * 3. Take the 2-ring neighborhood of the triangles that have been split
 * 4. Fill the triangles (just create an edge where it's needed)
 * 5. Smooth newly created vertices (along the plane defined by their own normals)
 * 6. Tag the newly created vertices if they are inside the sculpt brush radius
 */
Topology.prototype.subdivide = function (iTris, detailMaxSquared)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var nbVertsInit = vertices.length;
  var nbTrisInit = triangles.length;
  var iTrisSubd = [];
  var split = [];
  this.verticesMap_ = {};

  this.initSplit(iTris, iTrisSubd, split, detailMaxSquared);
  if (iTrisSubd.length > 20)
    mesh.expandsTriangles(iTrisSubd, 3);

  //undo-redo
  this.states_.pushState(iTrisSubd, mesh.getVerticesFromTriangles(iTrisSubd));

  split.length = iTrisSubd.length;
  this.checkArrayLength(iTrisSubd.length);
  this.subdivideTriangles(iTrisSubd, split, detailMaxSquared);

  var newTriangles = [];
  var nbTriangles = triangles.length;
  var i = 0;
  for (i = nbTrisInit; i < nbTriangles; ++i)
    newTriangles.push(i);
  mesh.expandsTriangles(newTriangles, 1);

  //undo-redo
  iTrisSubd = newTriangles.slice(nbTriangles - nbTrisInit);
  this.states_.pushState(iTrisSubd, mesh.getVerticesFromTriangles(iTrisSubd));

  iTris.push.apply(iTris, newTriangles);

  var iTrisMask = [];
  var nbTrisMask = iTris.length;
  var triangleTagMask = ++Triangle.tagMask_;
  for (i = 0; i < nbTrisMask; ++i)
  {
    var iTri = iTris[i];
    var t = triangles[iTri];
    if (t.tagFlag_ === triangleTagMask)
      continue;
    t.tagFlag_ = triangleTagMask;
    iTrisMask.push(iTri);
  }

  var nbTrianglesOld = triangles.length;
  while (newTriangles.length > 0)
    newTriangles = this.fillTriangles(newTriangles);

  nbTriangles = triangles.length;
  for (i = nbTrianglesOld; i < nbTriangles; ++i)
    iTrisMask.push(i);

  var vNew = [];
  var nbVertices = vertices.length;
  for (i = nbVertsInit; i < nbVertices; ++i)
    vNew.push(i);

  var nbVNew = vNew.length;
  mesh.expandsVertices(vNew, 1);
  var smoother = new Sculpt();
  smoother.mesh_ = mesh;
  smoother.smoothFlat(vNew.slice(nbVNew), 1.0);

  var vAr = this.mesh_.vertexArray_;
  var centerPoint = this.center_;
  var xcen = centerPoint[0],
    ycen = centerPoint[1],
    zcen = centerPoint[2];

  var vertexSculptMask = Vertex.sculptMask_;
  nbVNew = vNew.length;
  var j = 0;
  for (i = 0; i < nbVNew; ++i)
  {
    var ind = vNew[i];
    j = ind * 3;
    var dx = vAr[j] - xcen,
      dy = vAr[j + 1] - ycen,
      dz = vAr[j + 2] - zcen;
    if ((dx * dx + dy * dy + dz * dz) < this.radiusSquared_)
      vertices[ind].sculptFlag_ = vertexSculptMask;
    else
      vertices[ind].sculptFlag_ = vertexSculptMask - 1;
  }
  return iTrisMask;
};

/** Check size of arrays and enlarge them if necessary (exp growth) */
Topology.prototype.checkArrayLength = function (nbTris)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var iAr = mesh.indexArray_;
  var i = 0;
  var temp;
  var nb = 200; // very rough estimation
  var vLen = vertices.length * 3 + nbTris * nb;
  if (vAr.length < vLen)
  {
    temp = new Float32Array(vLen * 2);
    vLen = vAr.length;
    for (i = 0; i < vLen; ++i)
      temp[i] = vAr[i];
    this.mesh_.vertexArray_ = temp;

    temp = new Float32Array(vLen * 2);
    for (i = 0; i < vLen; ++i)
      temp[i] = nAr[i];
    this.mesh_.normalArray_ = temp;
  }
  var iLen = triangles.length * 3 + nbTris * nb;
  if (iAr.length < iLen)
  {
    temp = new SculptGL.indexArrayType(iLen * 2);
    iLen = iAr.length;
    for (i = 0; i < iLen; ++i)
      temp[i] = iAr[i];
    this.mesh_.indexArray_ = temp;
  }
};

/** Detect which triangles to split and the edge that need to be split */
Topology.prototype.initSplit = function (iTris, iTrisSubd, split, detailMaxSquared)
{
  var nbTris = iTris.length;
  for (var i = 0; i < nbTris; ++i)
  {
    var splitNum = this.findSplit(iTris[i], detailMaxSquared, true);
    switch (splitNum)
    {
    case 1:
      split.push(1);
      break;
    case 2:
      split.push(2);
      break;
    case 3:
      split.push(3);
      break;
    default:
      continue;
    }
    iTrisSubd.push(iTris[i]);
  }
};

/** Find the edge to be split (0 otherwise) */
Topology.prototype.findSplit = function (iTri, detailMaxSquared, checkInsideSphere)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var iAr = mesh.indexArray_;

  var id = iTri * 3;
  var ind1 = iAr[id],
    ind2 = iAr[id + 1],
    ind3 = iAr[id + 2];
  id = ind1 * 3;
  var v1 = [vAr[id], vAr[id + 1], vAr[id + 2]];
  id = ind2 * 3;
  var v2 = [vAr[id], vAr[id + 1], vAr[id + 2]];
  id = ind3 * 3;
  var v3 = [vAr[id], vAr[id + 1], vAr[id + 2]];

  if (checkInsideSphere)
  {
    if (!Geometry.sphereIntersectTriangle(this.center_, this.radiusSquared_ * 2, v1, v2, v3))
    {
      if (!Geometry.pointInsideTriangle(this.center_, v1, v2, v3))
      {
        return 0;
      }
    }
  }

  var temp = [0, 0, 0];
  var length1 = vec3.sqrLen(vec3.sub(temp, v1, v2)),
    length2 = vec3.sqrLen(vec3.sub(temp, v2, v3)),
    length3 = vec3.sqrLen(vec3.sub(temp, v1, v3));
  if (length1 > length2 && length1 > length3)
    return length1 > detailMaxSquared ? 1 : 0;
  else if (length2 > length3)
    return length2 > detailMaxSquared ? 2 : 0;
  else
    return length3 > detailMaxSquared ? 3 : 0;
};

/** Subdivide all the triangles that need to be subdivided */
Topology.prototype.subdivideTriangles = function (iTrisSubd, split, detailMaxSquared)
{
  var iAr = this.mesh_.indexArray_;
  var nbTris = iTrisSubd.length;
  for (var i = 0; i < nbTris; ++i)
  {
    var ind = iTrisSubd[i] * 3;
    if (split[i] === 1)
      this.halfEdgeSplit(iTrisSubd[i], iAr[ind], iAr[ind + 1], iAr[ind + 2]);
    else if (split[i] === 2)
      this.halfEdgeSplit(iTrisSubd[i], iAr[ind + 1], iAr[ind + 2], iAr[ind]);
    else if (split[i] === 3)
      this.halfEdgeSplit(iTrisSubd[i], iAr[ind + 2], iAr[ind], iAr[ind + 1]);
    else
    {
      var splitNum = this.findSplit(iTrisSubd[i], detailMaxSquared);
      if (splitNum === 1)
        this.halfEdgeSplit(iTrisSubd[i], iAr[ind], iAr[ind + 1], iAr[ind + 2]);
      else if (splitNum === 2)
        this.halfEdgeSplit(iTrisSubd[i], iAr[ind + 1], iAr[ind + 2], iAr[ind]);
      else if (splitNum === 3)
        this.halfEdgeSplit(iTrisSubd[i], iAr[ind + 2], iAr[ind], iAr[ind + 1]);
    }
  }
};

/**
 * Subdivide one triangle, it simply cut the triangle in two at a given edge.
 * The position of the vertex is computed as follow :
 * 1. Initial position of the new vertex at the middle of the edge
 * 2. Compute normal of the new vertex (average of the two normals of the two vertices defining the edge)
 * 3. Compute angle between those two normals
 * 4. Move the new vertex along its normal with a strengh proportional to the angle computed at step 3.
 */
Topology.prototype.halfEdgeSplit = function (iTri, iv1, iv2, iv3)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var iAr = mesh.indexArray_;

  var leaf = triangles[iTri].leaf_;
  var iTrisLeaf = leaf.iTris_;
  var v1 = vertices[iv1],
    v2 = vertices[iv2],
    v3 = vertices[iv3];

  var vMap = this.verticesMap_;
  var key = [Math.min(iv1, iv2), Math.max(iv1, iv2)];
  var isNewVertex = false;
  var ivMid = vMap[key];
  if (ivMid === undefined)
  {
    ivMid = vertices.length;
    isNewVertex = true;
    vMap[key] = ivMid;
  }

  v3.ringVertices_.push(ivMid);
  var id = iTri * 3;
  iAr[id] = iv1;
  iAr[id + 1] = ivMid;
  iAr[id + 2] = iv3;

  var iNewTri = triangles.length;
  var newTri = new Triangle(iNewTri);
  id = iNewTri * 3;
  iAr[id] = ivMid;
  iAr[id + 1] = iv2;
  iAr[id + 2] = iv3;
  newTri.stateFlag_ = Mesh.stateMask_;

  v3.tIndices_.push(iNewTri);
  v2.replaceTriangle(iTri, iNewTri);
  newTri.leaf_ = leaf;
  newTri.posInLeaf_ = iTrisLeaf.length;
  if (isNewVertex) //new vertex
  {
    var ind = vertices.length;
    var vMidTest = new Vertex(ind);

    id = iv1 * 3;
    var v1x = vAr[id],
      v1y = vAr[id + 1],
      v1z = vAr[id + 2];
    var n1x = nAr[id],
      n1y = nAr[id + 1],
      n1z = nAr[id + 2];

    id = iv2 * 3;
    var v2x = vAr[id],
      v2y = vAr[id + 1],
      v2z = vAr[id + 2];
    var n2x = nAr[id],
      n2y = nAr[id + 1],
      n2z = nAr[id + 2];
    var dot = n1x * n2x + n1y * n2y + n1z * n2z;

    var angle = 0;
    if (dot <= -1) angle = Math.PI;
    else if (dot >= 1) angle = 0;
    else angle = Math.acos(dot);

    var n1n2x = n1x + n2x,
      n1n2y = n1y + n2y,
      n1n2z = n1z + n2z;
    var len = 1 / Math.sqrt(n1n2x * n1n2x + n1n2y * n1n2y + n1n2z * n1n2z);
    id = ind * 3;
    nAr[id] = n1n2x * len;
    nAr[id + 1] = n1n2y * len;
    nAr[id + 2] = n1n2z * len;

    var edgex = v1x - v2x,
      edgey = v1y - v2y,
      edgez = v1z - v2z;
    len = Math.sqrt(edgex * edgex + edgey * edgey + edgez * edgez);

    if ((edgex * (n1x - n2x) + edgey * (n1y - n2y) + edgez * (n1z - n2z)) > 0)
    {
      vAr[id] = (v1x + v2x) * 0.5 + nAr[id] * angle * len * 0.12;
      vAr[id + 1] = (v1y + v2y) * 0.5 + nAr[id + 1] * angle * len * 0.12;
      vAr[id + 2] = (v1z + v2z) * 0.5 + nAr[id + 2] * angle * len * 0.12;
    }
    else
    {
      vAr[id] = (v1x + v2x) * 0.5 - nAr[id] * angle * len * 0.12;
      vAr[id + 1] = (v1y + v2y) * 0.5 - nAr[id + 1] * angle * len * 0.12;
      vAr[id + 2] = (v1z + v2z) * 0.5 - nAr[id + 2] * angle * len * 0.12;
    }

    vMidTest.stateFlag_ = Mesh.stateMask_;
    vMidTest.ringVertices_.push(iv1, iv2, iv3);
    v1.replaceRingVertex(iv2, ivMid);
    v2.replaceRingVertex(iv1, ivMid);
    vMidTest.tIndices_.push(iTri, iNewTri);
    vertices.push(vMidTest);
  }
  else
  {
    var vm = vertices[ivMid];
    vm.ringVertices_.push(iv3);
    vm.tIndices_.push(iTri, iNewTri);
  }
  iTrisLeaf.push(iNewTri);
  triangles.push(newTri);
};

/**
 * Fill the triangles. It checks if a newly vertex has been created at the middle
 * of the edge. If several split are needed, it first chooses the split that minimize
 * the valence of the vertex.
 */
Topology.prototype.fillTriangles = function (iTris)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var iAr = mesh.indexArray_;

  var nbTris = iTris.length;
  var iTrisNext = [];
  for (var i = 0; i < nbTris; ++i)
  {
    var iTri = iTris[i];
    var j = iTri * 3;
    var iv1 = iAr[j],
      iv2 = iAr[j + 1],
      iv3 = iAr[j + 2];

    var vMap = this.verticesMap_;
    var val1 = vMap[[Math.min(iv1, iv2), Math.max(iv1, iv2)]],
      val2 = vMap[[Math.min(iv2, iv3), Math.max(iv2, iv3)]],
      val3 = vMap[[Math.min(iv1, iv3), Math.max(iv1, iv3)]];

    var num1 = vertices[iv1].ringVertices_.length,
      num2 = vertices[iv2].ringVertices_.length,
      num3 = vertices[iv3].ringVertices_.length;
    var split = 0;
    if (val1)
    {
      if (val2)
      {
        if (val3)
        {
          if (num1 < num2 && num1 < num3) split = 2;
          else if (num2 < num3) split = 3;
          else split = 1;
        }
        else if (num1 < num3) split = 2;
        else split = 1;
      }
      else if (val3 && num2 < num3) split = 3;
      else split = 1;
    }
    else if (val2)
    {
      if (val3 && num2 < num1) split = 3;
      else split = 2;
    }
    else if (val3) split = 3;

    if (split === 1)
      this.fillTriangle(iTri, iv1, iv2, iv3, val1);
    else if (split === 2)
      this.fillTriangle(iTri, iv2, iv3, iv1, val2);
    else if (split === 3)
      this.fillTriangle(iTri, iv3, iv1, iv2, val3);
    else continue;
    iTrisNext.push(iTri, triangles.length - 1);
  }
  return iTrisNext;
};

/** Fill crack on one triangle */
Topology.prototype.fillTriangle = function (iTri, iv1, iv2, iv3, ivMid)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;
  var iAr = mesh.indexArray_;

  var j = iTri * 3;
  iAr[j] = iv1;
  iAr[j + 1] = ivMid;
  iAr[j + 2] = iv3;
  var leaf = triangles[iTri].leaf_;
  var iTrisLeaf = leaf.iTris_;

  var v2 = vertices[iv2],
    v3 = vertices[iv3],
    vMid = vertices[ivMid];
  vMid.ringVertices_.push(iv3);
  v3.ringVertices_.push(ivMid);

  var iNewTri = triangles.length;
  vMid.tIndices_.push(iTri, iNewTri);
  var newTri = new Triangle(iNewTri);
  j = iNewTri * 3;
  iAr[j] = ivMid;
  iAr[j + 1] = iv2;
  iAr[j + 2] = iv3;
  newTri.stateFlag_ = Mesh.stateMask_;
  newTri.leaf_ = leaf;
  newTri.posInLeaf_ = iTrisLeaf.length;

  v3.tIndices_.push(iNewTri);
  v2.replaceTriangle(iTri, iNewTri);

  iTrisLeaf.push(iNewTri);
  triangles.push(newTri);
};