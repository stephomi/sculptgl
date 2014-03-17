'use strict';

function Subdivision()
{
  this.baseMesh_ = null;
  this.newMesh_ = null;
}

Subdivision.prototype = {
  subdivide: function (baseMesh, newMesh)
  {
    this.baseMesh_ = baseMesh;
    this.newMesh_ = newMesh;
    var i = 0;

    var newNbVertices = baseMesh.vertices_.length + baseMesh.nbEdges_;

    // init topo vertices
    var newVerts = newMesh.vertices_;
    newVerts.length = newNbVertices;
    for (i = 0; i < newNbVertices; ++i)
      newVerts[i] = new Vertex(i);

    // init topo indices
    var baseTris = baseMesh.triangles_;
    var newTris = newMesh.triangles_;
    var nbTris = baseTris.length;
    var l = newTris.length = nbTris * 4; // we exactly know the size of tris
    for (i = 0; i < nbTris; ++i)
      newTris[i] = baseTris[i].clone();
    for (i = nbTris; i < l; ++i)
      newTris[i] = new Triangle(i);

    // init vertex coords (no need to copy the old one because applyEvenSmooth will do it)
    newMesh.vertexArray_ = new Float32Array(newNbVertices * 3);

    // init normals
    var baseNormals = baseMesh.normalArray_;
    newMesh.normalArray_ = new Float32Array(baseNormals.length * 4);
    newMesh.normalArray_.set(baseNormals);

    // init colors
    var baseColors = baseMesh.colorArray_;
    newMesh.colorArray_ = new Float32Array(baseColors.length * 4);
    newMesh.colorArray_.set(baseColors);

    // init indices
    var baseIndices = baseMesh.indexArray_;
    newMesh.indexArray_ = new SculptGL.indexArrayType(baseIndices.length * 4);
    newMesh.indexArray_.set(baseIndices);

    // init triangles edges
    newMesh.triEdgesArray_ = new Uint32Array(newMesh.indexArray_.length);
    // init flag on edges
    newMesh.verticesOnEdge_ = new Uint8Array(newNbVertices);

    //       v3
    //       /\
    //      /3T\ 
    //   m3/____\m2
    //    /\ 0T /\
    //   /1T\  /2T\
    //  /____\/____\ 
    // v1    m1    v2

    this.applyEvenSmooth();
    console.time('t')
    this.subdivision();
    console.timeEnd('t')
    newMesh.updateTopoGeom();
    this.testComputeInvertSmooth();
  },
  subdivision: function ()
  {
    var i = 0;
    var baseMesh = this.baseMesh_;
    var vArOld = baseMesh.vertexArray_;
    var triEdgesOld = baseMesh.triEdgesArray_;
    var verticesOnEdgeOld = baseMesh.verticesOnEdge_;

    var newMesh = this.newMesh_;
    var vertices = newMesh.vertices_;
    var iAr = newMesh.indexArray_;
    var cAr = newMesh.colorArray_;
    var vAr = newMesh.vertexArray_;
    var triEdges = newMesh.triEdgesArray_;
    var verticesOnEdge = newMesh.verticesOnEdge_;

    var nbTagEdges = newMesh.nbEdges_ = baseMesh.nbEdges_ * 2 + baseMesh.indexArray_.length;
    var tagEdges = new Int32Array(nbTagEdges);
    for (i = 0; i < nbTagEdges; ++i)
      tagEdges[i] = -1;

    var id = 0,
      id1 = 0,
      id2 = 0,
      id3 = 0;
    var iv1 = 0,
      iv2 = 0,
      iv3 = 0;
    var ide1 = 0,
      ide2 = 0,
      ide3 = 0;
    var e1 = 0,
      e2 = 0,
      e3 = 0;
    var tri1 = 0,
      tri2 = 0,
      tri3 = 0;
    var ivMid1 = 0,
      ivMid2 = 0,
      ivMid3 = 0;
    var idMid = 0,
      idOpp = 0;
    var e1center = 0,
      e2center = 0,
      e3center = 0;
    var nbVertices = baseMesh.vertices_.length;

    var triEdgesOffset = baseMesh.triEdgesArray_.length;
    var nbTriEdges = newMesh.triEdgesArray_.length;
    var nbTris = baseMesh.triangles_.length;
    for (i = 0; i < nbTris; ++i)
    {
      id = i * 3;
      iv1 = iAr[id];
      iv2 = iAr[id + 1];
      iv3 = iAr[id + 2];

      ide1 = triEdgesOld[id];
      ide2 = triEdgesOld[id + 1];
      ide3 = triEdgesOld[id + 2];

      e1 = verticesOnEdgeOld[iv1];
      e2 = verticesOnEdgeOld[iv2];
      e3 = verticesOnEdgeOld[iv3];

      //  edge V1-v2
      if (e1 && e2)
      {
        ivMid1 = nbVertices++;
        verticesOnEdge[ivMid1] = 1;

        idMid = ivMid1 * 3;
        id1 = iv1 * 3;
        id2 = iv2 * 3;

        vAr[idMid] = 0.5 * (vArOld[id1] + vArOld[id2]);
        vAr[idMid + 1] = 0.5 * (vArOld[id1 + 1] + vArOld[id2 + 1]);
        vAr[idMid + 2] = 0.5 * (vArOld[id1 + 2] + vArOld[id2 + 2]);

        cAr[idMid] = 0.5 * (cAr[id1] + cAr[id2]);
        cAr[idMid + 1] = 0.5 * (cAr[id1 + 1] + cAr[id2 + 1]);
        cAr[idMid + 2] = 0.5 * (cAr[id1 + 2] + cAr[id2 + 2]);
      }
      else
      {
        ivMid1 = tagEdges[ide1];
        idOpp = iv3 * 3;
        if (ivMid1 === -1)
        {
          ivMid1 = nbVertices++;
          tagEdges[ide1] = ivMid1;
          idMid = ivMid1 * 3;
          id1 = iv1 * 3;
          id2 = iv2 * 3;
          vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id1] + vArOld[id2]);
          vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id1 + 1] + vArOld[id2 + 1]);
          vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id1 + 2] + vArOld[id2 + 2]);

          cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id1] + cAr[id2]);
          cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id1 + 1] + cAr[id2 + 1]);
          cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id1 + 2] + cAr[id2 + 2]);
        }
        else
        {
          idMid = ivMid1 * 3;
          vAr[idMid] += 0.125 * vArOld[idOpp];
          vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
          vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

          cAr[idMid] += 0.125 * cAr[idOpp];
          cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
          cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
        }
      }

      //  edge V2-v3
      if (e2 && e3)
      {
        ivMid2 = nbVertices++;
        verticesOnEdge[ivMid2] = 1;

        idMid = ivMid2 * 3;
        id2 = iv2 * 3;
        id3 = iv3 * 3;

        vAr[idMid] = 0.5 * (vArOld[id2] + vArOld[id3]);
        vAr[idMid + 1] = 0.5 * (vArOld[id2 + 1] + vArOld[id3 + 1]);
        vAr[idMid + 2] = 0.5 * (vArOld[id2 + 2] + vArOld[id3 + 2]);

        cAr[idMid] = 0.5 * (cAr[id2] + cAr[id3]);
        cAr[idMid + 1] = 0.5 * (cAr[id2 + 1] + cAr[id3 + 1]);
        cAr[idMid + 2] = 0.5 * (cAr[id2 + 2] + cAr[id3 + 2]);
      }
      else
      {
        ivMid2 = tagEdges[ide2];
        idOpp = iv1 * 3;
        if (ivMid2 === -1)
        {
          ivMid2 = nbVertices++;
          tagEdges[ide2] = ivMid2;
          idMid = ivMid2 * 3;
          id2 = iv2 * 3;
          id3 = iv3 * 3;
          vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id2] + vArOld[id3]);
          vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id2 + 1] + vArOld[id3 + 1]);
          vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id2 + 2] + vArOld[id3 + 2]);

          cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id2] + cAr[id3]);
          cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id2 + 1] + cAr[id3 + 1]);
          cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id2 + 2] + cAr[id3 + 2]);
        }
        else
        {
          idMid = ivMid2 * 3;
          vAr[idMid] += 0.125 * vArOld[idOpp];
          vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
          vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

          cAr[idMid] += 0.125 * cAr[idOpp];
          cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
          cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
        }
      }

      //  edge V1-v3
      if (e1 && e3)
      {
        ivMid3 = nbVertices++;
        verticesOnEdge[ivMid3] = 1;

        idMid = ivMid3 * 3;
        id1 = iv1 * 3;
        id3 = iv3 * 3;

        vAr[idMid] = 0.5 * (vArOld[id1] + vArOld[id3]);
        vAr[idMid + 1] = 0.5 * (vArOld[id1 + 1] + vArOld[id3 + 1]);
        vAr[idMid + 2] = 0.5 * (vArOld[id1 + 2] + vArOld[id3 + 2]);

        cAr[idMid] = 0.5 * (cAr[id1] + cAr[id3]);
        cAr[idMid + 1] = 0.5 * (cAr[id1 + 1] + cAr[id3 + 1]);
        cAr[idMid + 2] = 0.5 * (cAr[id1 + 2] + cAr[id3 + 2]);
      }
      else
      {
        ivMid3 = tagEdges[ide3];
        idOpp = iv2 * 3;
        if (ivMid3 === -1)
        {
          ivMid3 = nbVertices++;
          tagEdges[ide3] = ivMid3;
          idMid = ivMid3 * 3;
          id1 = iv1 * 3;
          id3 = iv3 * 3;
          vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id1] + vArOld[id3]);
          vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id1 + 1] + vArOld[id3 + 1]);
          vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id1 + 2] + vArOld[id3 + 2]);

          cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id1] + cAr[id3]);
          cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id1 + 1] + cAr[id3 + 1]);
          cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id1 + 2] + cAr[id3 + 2]);
        }
        else
        {
          idMid = ivMid3 * 3;
          vAr[idMid] += 0.125 * vArOld[idOpp];
          vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
          vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

          cAr[idMid] += 0.125 * cAr[idOpp];
          cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
          cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
        }
      }

      e1center = id;
      e2center = id + 1;
      e3center = id + 2;

      iAr[id] = ivMid1;
      iAr[id + 1] = ivMid2;
      iAr[id + 2] = ivMid3;
      triEdges[id] = e1center;
      triEdges[id + 1] = e2center;
      triEdges[id + 2] = e3center;

      id += nbTris;
      tri1 = id;
      tri2 = id + 1;
      tri3 = id + 2;

      id = tri1 * 3;
      iAr[id] = iv1;
      iAr[id + 1] = ivMid1;
      iAr[id + 2] = ivMid3;
      triEdges[id] = iv1 < iv2 ? triEdgesOffset + ide1 : nbTriEdges - ide1 - 1;
      triEdges[id + 1] = e3center;
      triEdges[id + 2] = iv3 > iv1 ? triEdgesOffset + ide3 : nbTriEdges - ide3 - 1;

      id = tri2 * 3;
      iAr[id] = ivMid1;
      iAr[id + 1] = iv2;
      iAr[id + 2] = ivMid2;
      triEdges[id] = iv1 > iv2 ? triEdgesOffset + ide1 : nbTriEdges - ide1 - 1;
      triEdges[id + 1] = iv2 < iv3 ? triEdgesOffset + ide2 : nbTriEdges - ide2 - 1;
      triEdges[id + 2] = e1center;

      id = tri3 * 3;
      iAr[id] = ivMid2;
      iAr[id + 1] = iv3;
      iAr[id + 2] = ivMid3;
      triEdges[id] = iv2 > iv3 ? triEdgesOffset + ide2 : nbTriEdges - ide2 - 1;
      triEdges[id + 1] = iv3 < iv1 ? triEdgesOffset + ide3 : nbTriEdges - ide3 - 1;
      triEdges[id + 2] = e2center;

      vertices[iv1].tIndices_.push(tri1);
      vertices[iv2].tIndices_.push(tri2);
      vertices[iv3].tIndices_.push(tri3);
      vertices[ivMid1].tIndices_.push(i, tri1, tri2);
      vertices[ivMid2].tIndices_.push(i, tri2, tri3);
      vertices[ivMid3].tIndices_.push(i, tri1, tri3);
    }
  },
  /** Even vertices smoothing. */
  applyEvenSmooth: function ()
  {
    var vertices = this.baseMesh_.vertices_;
    var vArOld = this.baseMesh_.vertexArray_;
    var verticesOnEdgeOld = this.baseMesh_.verticesOnEdge_;
    var nbVerts = vertices.length;

    var vAr = this.newMesh_.vertexArray_;
    for (var i = 0; i < nbVerts; ++i)
    {
      var j = i * 3;
      var ring = vertices[i].ringVertices_;
      var nbVRing = ring.length;
      var avx = 0.0,
        avy = 0.0,
        avz = 0.0;
      var beta = 0.0,
        betaComp = 0.0;
      var k = 0;
      if (verticesOnEdgeOld[i]) //edge vertex
      {
        var comp = 0;
        for (k = 0; k < nbVRing; ++k)
        {
          var ind = ring[k];
          if (vertices[ind].onEdge_)
          {
            ind *= 3;
            avx += vArOld[ind];
            avy += vArOld[ind + 1];
            avz += vArOld[ind + 2];
            comp++;
          }
        }
        comp = 0.25 / comp;
        vAr[j] = vArOld[j] * 0.75 + avx * comp;
        vAr[j + 1] = vArOld[j + 1] * 0.75 + avy * comp;
        vAr[j + 2] = vArOld[j + 2] * 0.75 + avz * comp;
      }
      else
      {
        for (k = 0; k < nbVRing; ++k)
        {
          var id = ring[k] * 3;
          avx += vArOld[id];
          avy += vArOld[id + 1];
          avz += vArOld[id + 2];
        }
        if (nbVRing === 6)
        {
          beta = 0.0625;
          betaComp = 0.625;
        }
        else if (nbVRing === 3) //warren weights
        {
          beta = 0.1875;
          betaComp = 0.4375;
        }
        else
        {
          beta = 0.375 / nbVRing;
          betaComp = 0.625;
        }
        vAr[j] = vArOld[j] * betaComp + avx * beta;
        vAr[j + 1] = vArOld[j + 1] * betaComp + avy * beta;
        vAr[j + 2] = vArOld[j + 2] * betaComp + avz * beta;
      }
    }
  },
  testComputeInvertSmooth: function ()
  {
    var vertices = this.baseMesh_.vertices_;
    var vArOld = this.baseMesh_.vertexArray_;
    var nbVerts = vertices.length;

    var vAr = this.newMesh_.vertexArray_;
    var nAr = this.newMesh_.normalArray_;

    this.newMesh_.smoothArray_ = new Float32Array(vArOld.length);
    var smoAr = this.newMesh_.smoothArray_;

    var j = 0;
    var k = 0;
    var len = 0.0;

    var vx = 0.0,
      vy = 0.0,
      vz = 0.0;
    var v2x = 0.0,
      v2y = 0.0,
      v2z = 0.0;
    var dx = 0.0,
      dy = 0.0,
      dz = 0.0;
    var nx = 0.0,
      ny = 0.0,
      nz = 0.0;
    var tx = 0.0,
      ty = 0.0,
      tz = 0.0;
    var bix = 0.0,
      biy = 0.0,
      biz = 0.0;

    for (var i = 0; i < nbVerts; ++i)
    {
      j = i * 3;

      // vertex coord
      vx = vAr[j];
      vy = vAr[j + 1];
      vz = vAr[j + 2];

      // neighborhood vert
      k = vertices[i].ringVertices_[0] * 3;
      v2x = vAr[k];
      v2y = vAr[k + 1];
      v2z = vAr[k + 2];

      // displacement/detail vector (object space)
      dx = vx - vArOld[j];
      dy = vy - vArOld[j + 1];
      dz = vz - vArOld[j + 2];

      // normal vec
      nx = nAr[j];
      ny = nAr[j + 1];
      nz = nAr[j + 2];

      // tangent vec (vertex - vertex neighbor)
      tx = v2x - vx;
      ty = v2y - vy;
      tz = v2z - vz;
      // distance to normal plane
      len = tx * nx + ty * ny + tz * nz;
      // project on normal plane
      tx -= nx * len;
      ty -= ny * len;
      tz -= nz * len;
      // normalize vector
      len = 1.0 / Math.sqrt(tx * tx + ty * ty + tz * tz);
      tx *= len;
      ty *= len;
      tz *= len;

      // bi normal/tangent
      bix = ny * tz - nz * ty;
      biy = nz * tx - nx * tz;
      biz = nx * ty - ny * tx;

      // order : n/t/bi
      smoAr[j] = nx * dx + ny * dy + nz * dz;
      smoAr[j + 1] = tx * dx + ty * dy + tz * dz;
      smoAr[j + 2] = bix * dx + biy * dy + biz * dz;
    }
  }
};