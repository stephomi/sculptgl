'use strict';

/** Cut the mesh */
Topology.prototype.cut = function (planeOrigin, planeNormal, fillHoles)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var i = 0;

  var iTrisCulled = [],
    iTrisIntersect = [];
  // the iTrisIntersect are just candidates... there may be some triangles above/below the planes
  mesh.octree_.cullPlane(planeOrigin, planeNormal, iTrisCulled, iTrisIntersect);

  var iVertsCulled = mesh.getVerticesFromTriangles(iTrisCulled);
  var iVertsIntersect = mesh.getVerticesFromTriangles(iTrisIntersect);

  // undo-redo
  this.states_.pushState(iTrisCulled, iVertsCulled);
  this.states_.pushState(iTrisIntersect, iVertsIntersect);

  var tmp = [0, 0, 0];
  var nbVertsIntersect = iVertsIntersect.length;
  for (i = 0; i < nbVertsIntersect; ++i)
  {
    var iv = iVertsIntersect[i];
    var iv3 = iv * 3;
    if (vec3.dot(planeNormal, vec3.sub(tmp, [vAr[iv3], vAr[iv3 + 1], vAr[iv3 + 2]], planeOrigin)) > 0)
      iVertsCulled.push(iv);
  }

  Utils.tidy(iVertsCulled);
  var nbVertsCulled = iVertsCulled.length;
  for (i = 0; i < nbVertsCulled; ++i)
  {
    var vDel = vertices[iVertsCulled[i]];
    vDel.tagFlag_ = -1;
    vDel.ringVertices_ = [];
    vDel.tIndices_ = [];
  }

  this.checkArrayLength(iTrisIntersect.length / 100);

  var nbVerticesBefore = vertices.length;
  var nbTrianglesBefore = triangles.length;
  this.cleanCutTriangles(iTrisIntersect, iTrisCulled, planeOrigin, planeNormal);
  var nbVerticesAfter = vertices.length;
  var nbTrianglesAfter = triangles.length;

  this.iVertsToDelete_ = iVertsCulled;
  this.iTrisToDelete_ = iTrisCulled;

  //Update triangles on edges
  for (i = nbTrianglesBefore; i < nbTrianglesAfter; ++i)
    mesh.updateTriangleAabbAndNormal(i);

  //Update vertices on edges
  var iVertsOnEdge = [];
  for (i = nbVerticesBefore; i < nbVerticesAfter; ++i)
  {
    iVertsOnEdge.push(i);
    mesh.updateVertexNormal(i);
  }

  var lengthMeanSq = 0.0;
  if (fillHoles)
    lengthMeanSq = this.triangulateVerticesOnPlane(iVertsOnEdge, planeOrigin, planeNormal);

  this.applyDeletion(true);
  this.states_.recomputeOctree(mesh.octree_.aabbSplit_);
  return lengthMeanSq;
};

/** Project vertices above the plane on it */
Topology.prototype.cleanCutTriangles = function (iTrisIntersect, iTrisCulled, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;

  this.verticesMap_ = {};

  var nbTrisIntersect = iTrisIntersect.length;
  for (var i = 0; i < nbTrisIntersect; ++i)
  {
    var iTri = iTrisIntersect[i];
    var iTri3 = iTri * 3;
    var id1 = iAr[iTri3],
      id2 = iAr[iTri3 + 1],
      id3 = iAr[iTri3 + 2];
    var v1 = vertices[id1],
      v2 = vertices[id2],
      v3 = vertices[id3];
    var tag1 = v1.tagFlag_,
      tag2 = v2.tagFlag_,
      tag3 = v3.tagFlag_;

    if (tag1 < 0 && tag2 < 0 && tag3 < 0) // triangle above the plane
      iTrisCulled.push(iTri);
    else if (tag1 > 0 && tag2 > 0 && tag3 > 0) // triangle below the plane
      continue;
    else // triangle intersects the plane
    {
      iTrisCulled.push(iTri);
      if (tag1 > 0)
      {
        if (tag2 > 0)
          this.makeTwoTrianglesSnapOnPlane(iTri, id1, id2, id3, planeOrigin, planeNormal);
        else if (tag3 > 0)
          this.makeTwoTrianglesSnapOnPlane(iTri, id3, id1, id2, planeOrigin, planeNormal);
        else
          this.makeOneTriangleSnapOnPlane(iTri, id1, id2, id3, planeOrigin, planeNormal);
      }
      else if (tag2 > 0)
      {
        if (tag3 > 0)
          this.makeTwoTrianglesSnapOnPlane(iTri, id2, id3, id1, planeOrigin, planeNormal);
        else
          this.makeOneTriangleSnapOnPlane(iTri, id2, id3, id1, planeOrigin, planeNormal);
      }
      else if (tag3 > 0)
        this.makeOneTriangleSnapOnPlane(iTri, id3, id1, id2, planeOrigin, planeNormal);
    }
  }
};

/**
 * Make one triangle snap on the plane
 *   3______2
 *    \    /  CULL SPACE
 * -(5)\--/(4)-------------
 *      \/
 *       1
 */
Topology.prototype.makeOneTriangleSnapOnPlane = function (iTri, iv1, iv2, iv3, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var v1 = vertices[iv1];

  v1.removeTriangle(iTri);
  v1.removeRingVertex(iv2);
  v1.removeRingVertex(iv3);

  var iv4 = this.getProjectedVertex(iv1, iv2, planeOrigin, planeNormal);
  var iv5 = this.getProjectedVertex(iv1, iv3, planeOrigin, planeNormal);
  var v4 = vertices[iv4];
  var v5 = vertices[iv5];

  var iTri145 = triangles.length;
  triangles.push(new Triangle(iTri145));
  var id = iTri145 * 3;
  iAr[id] = iv1;
  iAr[id + 1] = iv4;
  iAr[id + 2] = iv5;

  v1.tIndices_.push(iTri145);
  v4.tIndices_.push(iTri145);
  v5.tIndices_.push(iTri145);

  v4.ringVertices_.push(iv5);
  v5.ringVertices_.push(iv4);
};

/**
 * Make one triangle snap on the plane by dividing it into two triangles
 *       3
 *      /\  CULL SPACE
 * -(5)/--\(4)----------
 *    /____\
 *    1      2
 */
Topology.prototype.makeTwoTrianglesSnapOnPlane = function (iTri, iv1, iv2, iv3, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var v1 = vertices[iv1],
    v2 = vertices[iv2];

  v1.removeTriangle(iTri);
  v1.removeRingVertex(iv3);
  v2.removeTriangle(iTri);
  v2.removeRingVertex(iv3);

  var iv4 = this.getProjectedVertex(iv2, iv3, planeOrigin, planeNormal);
  var iv5 = this.getProjectedVertex(iv1, iv3, planeOrigin, planeNormal);
  var v4 = vertices[iv4];
  var v5 = vertices[iv5];

  var iTri124 = triangles.length;
  triangles.push(new Triangle(iTri124));
  var id = iTri124 * 3;
  iAr[id] = iv1;
  iAr[id + 1] = iv2;
  iAr[id + 2] = iv4;

  var iTri145 = triangles.length;
  triangles.push(new Triangle(iTri145));
  id = iTri145 * 3;
  iAr[id] = iv1;
  iAr[id + 1] = iv4;
  iAr[id + 2] = iv5;

  v1.tIndices_.push(iTri124);
  v2.tIndices_.push(iTri124);
  v4.tIndices_.push(iTri124);

  v1.tIndices_.push(iTri145);
  v4.tIndices_.push(iTri145);
  v5.tIndices_.push(iTri145);

  v4.ringVertices_.push(iv5);
  v5.ringVertices_.push(iv4);

  v4.ringVertices_.push(iv1);
  v1.ringVertices_.push(iv4);
};

/** Return id of projected vertex on plane along the segment */
Topology.prototype.getProjectedVertex = function (iv1, iv2, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var cAr = mesh.colorArray_;
  var nAr = mesh.normalArray_;
  var vertices = mesh.vertices_;

  var key = [Math.min(iv1, iv2), Math.max(iv1, iv2)];
  var ivMid = this.verticesMap_[key];
  if (ivMid === undefined)
  {
    ivMid = vertices.length;
    this.verticesMap_[key] = ivMid;
    vertices.push(new Vertex(ivMid));
    var i = iv1 * 3;
    var j = iv2 * 3;
    var coordInter = [0, 0, 0]
    Geometry.intersectLinePlane([vAr[i], vAr[i + 1], vAr[i + 2]], [vAr[j], vAr[j + 1], vAr[j + 2]], planeOrigin, planeNormal, coordInter);
    i = ivMid * 3;
    vAr[i] = coordInter[0];
    vAr[i + 1] = coordInter[1];
    vAr[i + 2] = coordInter[2];

    nAr[i] = nAr[j];
    nAr[i + 1] = nAr[j + 1];
    nAr[i + 2] = nAr[j + 2];

    cAr[i] = cAr[j];
    cAr[i + 1] = cAr[j + 1];
    cAr[i + 2] = cAr[j + 2];
    vertices[iv1].ringVertices_.push(ivMid);
    vertices[ivMid].ringVertices_.push(iv1);
  }
  return ivMid;
};

/** Delaunay triangulation to make triangles on the plane */
Topology.prototype.triangulateVerticesOnPlane = function (iVertsOnEdge, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;

  var edges = [];
  var i = 0,
    j = 0;

  var nbVertsOnEdge = iVertsOnEdge.length;
  for (i = 0; i < nbVertsOnEdge; ++i)
  {
    var id = iVertsOnEdge[i];

    var trisRing = vertices[id].tIndices_;
    var nbTrisRing = trisRing.length;
    for (j = 0; j < nbTrisRing; ++j)
    {
      var it = trisRing[j] * 3;
      var iv1 = iAr[it],
        iv2 = iAr[it + 1],
        iv3 = iAr[it + 2];
      var vTest;
      if (iv1 === id)
      {
        vTest = vertices[iv3];
        if (vTest.tIndices_.length !== vTest.ringVertices_.length)
          edges.push([id, iv3]);
      }
      else if (iv2 === id)
      {
        vTest = vertices[iv1];
        if (vTest.tIndices_.length !== vTest.ringVertices_.length)
          edges.push([id, iv1]);
      }
      else
      {
        vTest = vertices[iv2];
        if (vTest.tIndices_.length !== vTest.ringVertices_.length)
          edges.push([id, iv2]);
      }
    }
  }

  var holes = [];
  this.detectHoles(edges, holes);

  var lengthMeanSq = 1.0;
  var totalPoint = 0;
  var nbHoles = holes.length;
  for (i = 0; i < nbHoles; ++i)
  {
    var hole = holes[i];
    var nbPoints = hole.length;
    for (j = 1; j < nbPoints; ++j)
    {
      var iv1 = hole[j - 1] * 3;
      var iv2 = hole[j] * 3;
      lengthMeanSq += vec3.sqrDist([vAr[iv1], vAr[iv1 + 1], vAr[iv1 + 2]], [vAr[iv2], vAr[iv2 + 1], vAr[iv2 + 2]]);
    }
    totalPoint += nbPoints - 1;
  }

  this.fillHoles(holes, planeOrigin, planeNormal);
  return lengthMeanSq / totalPoint;
};

/** Triangulate holes with delaunay triangulation */
Topology.prototype.fillHoles = function (holes, planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var i = 0,
    j = 0;

  var orx = planeOrigin[0],
    ory = planeOrigin[1],
    orz = planeOrigin[2];

  var perp = Geometry.getPerpendicularVector(planeNormal);
  var perp2 = [0, 0, 0];
  vec3.cross(perp2, perp, planeNormal);

  var nbHoles = holes.length;
  for (i = 0; i < nbHoles; ++i)
  {
    var hole = holes[i];
    var nbPoints = hole.length;
    var contour = [];
    contour.length = nbPoints;
    for (j = 0; j < nbPoints; ++j)
    {
      var id = hole[j];
      var vecPoint = [vAr[id * 3] - orx, vAr[id * 3 + 1] - ory, vAr[id * 3 + 2] - orz];
      var pt = new poly2tri.Point(vec3.dot(perp, vecPoint), vec3.dot(perp2, vecPoint));
      pt.id_ = id;
      contour[j] = pt;
    }

    var swctx = new poly2tri.SweepContext(contour);
    //   cloneArrays: true
    swctx.triangulate();
    var trisPlane = swctx.getTriangles();
    var nbTris = trisPlane.length;
    this.checkArrayLength(nbTris / 100);
    vAr = mesh.vertexArray_;
    iAr = mesh.indexArray_;
    for (j = 0; j < nbTris; ++j)
    {
      var ptTris = trisPlane[j].points_;
      var idTri = triangles.length;
      var t = new Triangle(idTri);
      t.normal_ = planeNormal.slice();
      triangles.push(t);
      var iv1 = ptTris[0].id_,
        iv2 = ptTris[1].id_,
        iv3 = ptTris[2].id_;
      vertices[iv1].tIndices_.push(idTri);
      vertices[iv2].tIndices_.push(idTri);
      vertices[iv3].tIndices_.push(idTri);
      idTri *= 3;
      iAr[idTri] = iv1;
      iAr[idTri + 1] = iv3;
      iAr[idTri + 2] = iv2;
    }

    for (j = 0; j < nbPoints; ++j)
      mesh.computeRingVertices(hole[j]);
  }
};

/** Make holes from a soup of edges, it sorts all the edges until every holes are created */
Topology.prototype.detectHoles = function (edges, holes)
{
  if (edges.length <= 2)
    return;
  var nbEdges = edges.length;
  var iEnd = edges[0][0];
  var iLast = edges[0][1];
  var hole = [iEnd, iLast];

  --nbEdges;
  edges[0] = edges[nbEdges];
  --edges.length;
  var i = 0;
  while (i < nbEdges)
  {
    var iTest = edges[i][0];
    if (iTest === iLast)
    {
      iLast = edges[i][1];
      --nbEdges;
      edges[i] = edges[nbEdges];
      --edges.length;
      if (iLast === iEnd)
        break;
      hole.push(iLast);
      i = 0;
    }
    else
      i++;
  }
  if (iLast === iEnd)
    holes.push(hole);

  if (nbEdges > 0)
    this.detectHoles(edges, holes);
};