'use strict';

/** Cut the mesh */
Topology.prototype.cut = function (planeOrigin, planeNormal)
{
  var mesh = this.mesh_;
  var vAr = mesh.vertexArray_;
  var nAr = mesh.normalArray_;
  var cAr = mesh.colorArray_;
  var iAr = mesh.indexArray_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  var i = 0;

  var iTrisCulled = [],
    iTrisIntersect = [];
  // the iTrisIntersect are just candidates... there may be some triangles above/below the planes
  mesh.octree_.cullPlane(planeOrigin, planeNormal, iTrisCulled, iTrisIntersect);

  var iVertsCulled = mesh.getVerticesFromTriangles(iTrisCulled);

  // undo-redo
  this.states_.pushState(iTrisCulled, iVertsCulled);
  this.states_.pushState(iTrisIntersect, mesh.getVerticesFromTriangles(iTrisIntersect));

  var nbTrisCulled = iTrisCulled.length;
  for (i = 0; i < nbTrisCulled; ++i)
    triangles[iTrisCulled[i]].tagFlag_ = -1;

  var nx = planeNormal[0],
    ny = planeNormal[1],
    nz = planeNormal[2];

  var tmp = [0, 0, 0];
  var nbTrisIntersect = iTrisIntersect.length;
  var dot1 = 0,
    dot2 = 0,
    dot3 = 0;

  ++Vertex.tagMask_;
  var vertexTagMask = Vertex.tagMask_;

  for (i = 0; i < nbTrisIntersect; ++i)
  {
    var id = iTrisIntersect[i] * 3;
    var id1 = iAr[id],
      id2 = iAr[id + 1],
      id3 = iAr[id + 2];
    var v1 = vertices[id1],
      v2 = vertices[id2],
      v3 = vertices[id3];
    id1 *= 3;
    id2 *= 3;
    id3 *= 3;

    if (v1.tagFlag_ !== vertexTagMask)
      dot1 = vec3.dot(planeNormal, vec3.sub(tmp, [vAr[id1], vAr[id1 + 1], vAr[id1 + 2]], planeOrigin));
    else dot1 = 0;
    if (v2.tagFlag_ !== vertexTagMask)
      dot2 = vec3.dot(planeNormal, vec3.sub(tmp, [vAr[id2], vAr[id2 + 1], vAr[id2 + 2]], planeOrigin));
    else dot2 = 0;
    if (v3.tagFlag_ !== vertexTagMask)
      dot3 = vec3.dot(planeNormal, vec3.sub(tmp, [vAr[id3], vAr[id3 + 1], vAr[id3 + 2]], planeOrigin));
    else dot3 = 0;

    if (dot1 >= 0 && dot2 >= 0 && dot3 >= 0) // triangle above the plane
    {
      iTrisCulled.push(iTrisIntersect[i]);
      triangles[iTrisIntersect[i]].tagFlag_ = -1;
      iVertsCulled.push(v1.id_);
      iVertsCulled.push(v2.id_);
      iVertsCulled.push(v3.id_);
    }
    else if (dot1 <= 0 && dot2 <= 0 && dot3 <= 0) // triangle below the plane
      continue;
    else // triangle intersects the plane
    {
      if (dot1 > 0)
      {
        vAr[id1] -= nx * dot1;
        vAr[id1 + 1] -= ny * dot1;
        vAr[id1 + 2] -= nz * dot1;
        v1.tagFlag_ = vertexTagMask;
      }
      if (dot2 > 0)
      {
        vAr[id2] -= nx * dot2;
        vAr[id2 + 1] -= ny * dot2;
        vAr[id2 + 2] -= nz * dot2;
        v2.tagFlag_ = vertexTagMask;
      }
      if (dot3 > 0)
      {
        vAr[id3] -= nx * dot3;
        vAr[id3 + 1] -= ny * dot3;
        vAr[id3 + 2] -= nz * dot3;
        v3.tagFlag_ = vertexTagMask;
      }
    }
  }

  var verticesOnEdge = this.dirtyTopologicalCleanUpBeforeDeletion(iTrisCulled, iVertsCulled);
  this.applyDeletion();
};

/**
 * Hemm hemm quick topo clean up
 * We don't check anything for the triangles
 * But for the vertices we check the neighborhood triangles and vertices.
 * If every neighborhood triangles needs to be deleted then the vertex is to be deleted too.
 * It returns the vertices that shouldn' be deleted
 */
Topology.prototype.dirtyTopologicalCleanUpBeforeDeletion = function (iTrisCulled, iVertsCulled)
{
  var mesh = this.mesh_;
  var vertices = mesh.vertices_;
  var triangles = mesh.triangles_;

  //no clean up for triangles... they are good
  this.iTrisToDelete_ = iTrisCulled;

  this.iVertsToDelete_ = [];
  var iVertsToDelete = this.iVertsToDelete_;

  var i = 0,
    j = 0;

  var iVertsOnEdge = [];
  // clean up neighborhood triangles
  Utils.tidy(iVertsCulled);
  var nbVertsCulled = iVertsCulled.length;
  for (i = 0; i < nbVertsCulled; ++i)
  {
    var vEdge = vertices[iVertsCulled[i]];
    var indices = vEdge.tIndices_;
    j = 0;
    while (j !== indices.length)
    {
      if (triangles[indices[j]].tagFlag_ < 0)
      {
        indices[j] = indices[indices.length - 1];
        --indices.length;
      }
      else ++j;
    }
    if (indices.length === 0)
    {
      iVertsToDelete.push(iVertsCulled[i]);
      vEdge.tagFlag_ = -1;
      vEdge.ringVertices_ = [];
    }
    else
      iVertsOnEdge.push(iVertsCulled[i]);
  }

  // clean up ring vertices
  var nbVertsOnEdge = iVertsOnEdge.length;
  for (i = 0; i < nbVertsOnEdge; ++i)
  {
    var vert = vertices[iVertsOnEdge[i]];
    var ring = vert.ringVertices_;
    j = 0;
    while (j !== ring.length)
    {
      if (vertices[ring[j]].tagFlag_ < 0)
      {
        ring[j] = ring[ring.length - 1];
        --ring.length;
      }
      else ++j;
    }
  }
};