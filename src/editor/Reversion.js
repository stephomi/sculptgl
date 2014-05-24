define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var Reversion = {};

  Reversion.detectExtraordinaryVertices = function (mesh) {
    var nbVertices = mesh.getNbVertices();
    var fAr = mesh.getFaces();
    var onEdge = mesh.getVerticesOnEdge();
    var vrvStartCount = mesh.getVerticesRingVertStartCount();
    var vrf = mesh.getVerticesRingFace();
    var vrfStartCount = mesh.getVerticesRingFaceStartCount();
    var vExtraTags = new Int8Array(nbVertices);
    for (var i = 0, l = nbVertices; i < l; ++i) {
      var id = i * 2;
      var len = vrvStartCount[id + 1];
      var startFace = vrfStartCount[id];
      var countFace = vrfStartCount[id + 1];
      var vBorder = onEdge[i];
      var nbQuad = 0;
      for (var j = startFace, endFace = startFace + countFace; j < endFace; ++j) {
        nbQuad += fAr[vrf[j] * 4 + 3] < 0 ? 0 : 1;
      }
      if (nbQuad === 0) {
        // tris
        if ((!vBorder && len !== 6) || (vBorder && len !== 4))
          vExtraTags[i] = 1;
      } else if (nbQuad === countFace) {
        // quads
        if ((!vBorder && len !== 4) || (vBorder && len !== 3))
          vExtraTags[i] = 1;
      } else {
        // quad and tri
        if (vBorder || len !== 5)
          vExtraTags[i] = 1;
      }
    }
    return vExtraTags;
  };

  /** Return the first extraordinary vertex if it exists... or a random vertex otherwise */
  Reversion.getSeed = function (mesh, vEvenTags, vExtraTags) {
    for (var i = 0, l = mesh.getNbVertices(); i < l; ++i) {
      if (vEvenTags[i] !== 0)
        continue;
      if (vExtraTags[i] === 1)
        return i;
    }
    return 0;
  };

  /** Tag the even vertices */
  Reversion.tagVertices = function (mesh, vEvenTags, vExtraTags) {
    var tagFlag = ++Utils.TAG_FLAG;
    var vFlags = mesh.getVerticesTagFlags();
    var vrvSC = mesh.getVerticesRingVertStartCount();
    var vrv = mesh.getVerticesRingVert();
    var onEdge = mesh.getVerticesOnEdge();

    var vSeed = Reversion.getSeed(mesh, vEvenTags, vExtraTags);
    vEvenTags[vSeed] = 1;
    var stack = new Uint32Array(Utils.getMemory(mesh.getNbVertices() * 4), 0, mesh.getNbVertices());
    if (stack.length === 0)
      return;
    stack[0] = vSeed;
    var curStack = 1;
    while (curStack > 0) {
      var idVert = stack[--curStack];
      var start = vrvSC[idVert * 2];
      var end = start + vrvSC[idVert * 2 + 1];
      var i = 0;
      var vBorder = onEdge[idVert];
      var stamp = ++tagFlag;
      // tag the odd vertices
      for (i = start; i < end; ++i) {
        var oddi = vrv[i];
        vFlags[oddi] = stamp;
        var oddTag = vEvenTags[oddi];
        // already an even vertex
        if (oddTag === 1)
          return;
        vEvenTags[oddi] = -1; //odd vertex
        vFlags[oddi] = stamp;
      }
      // stamp-1 means odd vertex, while stamp ==> locally already
      // visited candidates opposites even vertex
      stamp = ++tagFlag;
      for (i = start; i < end; ++i) {
        var oddId = vrv[i];
        // extraordinary vertex marked as odd vertex
        if (vExtraTags[oddId] !== 0)
          return;
        // odd vertex on the boundary and even in the interior
        if (onEdge[oddId] && !vBorder)
          return;
        var oddStart = vrvSC[oddId * 2];
        var oddEnd = oddStart + vrvSC[oddId * 2 + 1];
        // find opposite vertex
        for (var j = oddStart; j < oddEnd; ++j) {
          var evenj = vrv[j];
          if (evenj === idVert)
            continue;
          if (vFlags[evenj] >= (stamp - 1)) // see comments above
            continue;
          vFlags[evenj] = stamp;
          if (vEvenTags[evenj] !== 0) // already processed
            continue;
          var oppStart = vrvSC[evenj * 2];
          var oppEnd = oppStart + vrvSC[evenj * 2 + 1];
          var nbOdd = 0;
          for (var k = oppStart; k < oppEnd; ++k) {
            if (vFlags[vrv[k]] === (stamp - 1))
              nbOdd++;
          }
          if (nbOdd === 2) {
            vEvenTags[evenj] = -1;
          } else {
            vEvenTags[evenj] = 1;
            stack[curStack++] = evenj;
          }
        }
      }
    }
    Utils.TAG_FLAG = tagFlag;
    return vEvenTags;
  };

  /** Tag the even vertices */
  Reversion.tagEvenVertices = function (mesh) {
    var nbVertices = mesh.getNbVertices();
    // 0 not processed, -1 odd vertex, 1 even vertex
    var vEvenTags = new Int8Array(nbVertices);
    var vExtraTags = Reversion.detectExtraordinaryVertices(mesh);
    var running = true;
    while (running) {
      var status = Reversion.tagVertices(mesh, vEvenTags, vExtraTags);
      if (!status)
        return;
      running = false;
      for (var i = 0; i < nbVertices; ++i) {
        if (vEvenTags[i] === 0) {
          running = true;
          break;
        }
      }
    }
    return vEvenTags;
  };

  /** Creates the coarse faces from the tagged vertices */
  Reversion.createFaces = function (baseMesh, newMesh, vEvenTags) {
    var feAr = baseMesh.getFaceEdges();
    var fArUp = baseMesh.getFaces();
    var tagEdges = new Int32Array(baseMesh.getNbEdges());
    var i = 0;
    var nbFaces = baseMesh.getNbFaces();
    var acc = 0;
    var triFaceOrQuadCenter = new Int32Array(nbFaces / 4);
    var centerQuadUp = new Int32Array(baseMesh.getNbVertices());
    var fArDown = new Int32Array(nbFaces);
    for (i = 0; i < nbFaces; ++i)
      fArDown[i] = -1;
    for (i = 0; i < nbFaces; ++i) {
      var j = i * 4;
      var iv1 = fArUp[j];
      var iv2 = fArUp[j + 1];
      var iv3 = fArUp[j + 2];
      var iv4 = fArUp[j + 3];
      var tag1 = vEvenTags[iv1];
      var tag2 = vEvenTags[iv2];
      var tag3 = vEvenTags[iv3];
      if (iv4 < 0) {
        // center tri
        if (tag1 + tag2 + tag3 === -3) {
          triFaceOrQuadCenter[acc++] = i;
          continue;
        }
        // tri
        if (tag1 === 1) tagEdges[feAr[j + 1]] = iv1 + 1;
        else if (tag2 === 1) tagEdges[feAr[j + 2]] = iv2 + 1;
        else if (tag3 === 1) tagEdges[feAr[j]] = iv3 + 1;
      } else {
        //quad
        var ivCorner = 0;
        var ivCenter = 0;
        if (tag1 === 1) {
          ivCorner = iv1;
          ivCenter = iv3;
          tagEdges[feAr[j + 1]] = iv1 + 1;
        } else if (tag2 === 1) {
          ivCorner = iv2;
          ivCenter = iv4;
          tagEdges[feAr[j + 1]] = iv2 + 1;
        } else if (tag3 === 1) {
          ivCorner = iv3;
          ivCenter = iv1;
          tagEdges[feAr[j + 1]] = iv3 + 1;
        } else {
          ivCorner = iv4;
          ivCenter = iv2;
          tagEdges[feAr[j + 1]] = iv4 + 1;
        }
        var quad = centerQuadUp[ivCenter] - 1;
        if (quad < 0) {
          triFaceOrQuadCenter[acc] = -ivCenter - 1;
          fArDown[acc * 4 + 3] = ivCorner;
          centerQuadUp[ivCenter] = ++acc;
        } else {
          var idQuad = quad * 4;
          var oppEdge = tagEdges[feAr[j + 1]] - 1;
          if (oppEdge < 0) {
            // no opposite edge
            if (fArDown[idQuad + 2] < 0) {
              fArDown[idQuad + 2] = ivCorner;
            } else { // permutation !
              fArDown[idQuad + 1] = fArDown[idQuad + 2];
              fArDown[idQuad + 2] = ivCorner;
            }
          } else {
            // insert after oppEdge
            if (fArDown[idQuad + 1] === oppEdge) {
              fArDown[idQuad] = ivCorner;
            } else {
              fArDown[idQuad] = fArDown[idQuad + 1];
              if (fArDown[idQuad + 2] === oppEdge) {
                fArDown[idQuad + 1] = ivCorner;
              } else {
                fArDown[idQuad + 1] = fArDown[idQuad + 2];
                fArDown[idQuad + 2] = ivCorner;
              }
            }
          }
        }
      }
    }
    nbFaces /= 4;
    for (i = 0; i < nbFaces; ++i) {
      var cen = triFaceOrQuadCenter[i];
      if (cen < 0)
        continue;
      var id = cen * 4;
      var idFace = i * 4;
      fArDown[idFace] = tagEdges[feAr[id]] - 1;
      fArDown[idFace + 1] = tagEdges[feAr[id + 1]] - 1;
      fArDown[idFace + 2] = tagEdges[feAr[id + 2]] - 1;
    }
    newMesh.setFaces(fArDown);
    return triFaceOrQuadCenter;
  };

  /** Creates the vertices of the mesh */
  Reversion.createVertices = function (baseMesh, newMesh, triFaceOrQuadCenter) {
    var acc = 0;
    var vertexMapUp = new Uint32Array(baseMesh.getNbVertices());
    newMesh.setVerticesMapping(vertexMapUp);
    var fArDown = newMesh.getFaces();
    var tagVert = new Float32Array(baseMesh.getNbVertices());
    var i = 0;
    var len = fArDown.length;
    for (i = 0; i < len; ++i) {
      var iv = fArDown[i];
      if (iv === -1)
        continue;
      var tag = tagVert[iv] - 1;
      if (tag === -1) {
        tag = acc++;
        tagVert[iv] = tag + 1;
        vertexMapUp[tag] = iv;
      }
      fArDown[i] = tag;
    }
    newMesh.setVertices(new Float32Array(acc * 3));
    var fArUp = baseMesh.getFaces();
    var vrf = baseMesh.getVerticesRingFace();
    var vrfStartCount = baseMesh.getVerticesRingFaceStartCount();
    var tagMid = new Uint8Array(baseMesh.getNbVertices());
    len /= 4;
    for (i = 0; i < len; ++i) {
      var iCenter = triFaceOrQuadCenter[i];
      var mid1, mid2, mid3, mid4, mid5;
      var tag1, tag2, tag3, tag4, tag5;
      if (iCenter >= 0) {
        // tri
        var id = iCenter * 4;
        mid1 = fArUp[id + 1];
        mid2 = fArUp[id + 2];
        mid3 = fArUp[id];
        mid4 = -1;
        mid5 = -1;
      } else {
        // quad
        mid5 = -iCenter - 1;
        var idQuadDown = i * 4;
        var corner1 = vertexMapUp[fArDown[idQuadDown]];
        var corner2 = vertexMapUp[fArDown[idQuadDown + 1]];
        var corner3 = vertexMapUp[fArDown[idQuadDown + 2]];
        var corner4 = vertexMapUp[fArDown[idQuadDown + 3]];
        var start = vrfStartCount[mid5 * 2];
        var end = start + 4;
        for (var j = start; j < end; ++j) {
          var idQuad = vrf[j] * 4;
          var id1 = fArUp[idQuad];
          var id2 = fArUp[idQuad + 1];
          var id3 = fArUp[idQuad + 2];
          var id4 = fArUp[idQuad + 3];
          if (id1 === corner1) mid1 = id2;
          else if (id2 === corner1) mid1 = id3;
          else if (id3 === corner1) mid1 = id4;
          else if (id4 === corner1) mid1 = id1;

          if (id1 === corner2) mid2 = id2;
          else if (id2 === corner2) mid2 = id3;
          else if (id3 === corner2) mid2 = id4;
          else if (id4 === corner2) mid2 = id1;

          if (id1 === corner3) mid3 = id2;
          else if (id2 === corner3) mid3 = id3;
          else if (id3 === corner3) mid3 = id4;
          else if (id4 === corner3) mid3 = id1;

          if (id1 === corner4) mid4 = id2;
          else if (id2 === corner4) mid4 = id3;
          else if (id3 === corner4) mid4 = id4;
          else if (id4 === corner4) mid4 = id1;
        }
      }
      tag1 = tagMid[mid1];
      tag2 = tagMid[mid2];
      tag3 = tagMid[mid3];
      tag4 = mid4 >= 0 ? tagMid[mid4] : -1;
      tag5 = mid5 >= 0 ? tagMid[mid5] : -1;
      if (tag1 === 0) {
        tagMid[mid1] = 1;
        vertexMapUp[acc++] = mid1;
      }
      if (tag2 === 0) {
        tagMid[mid2] = 1;
        vertexMapUp[acc++] = mid2;
      }
      if (tag3 === 0) {
        tagMid[mid3] = 1;
        vertexMapUp[acc++] = mid3;
      }
      if (tag4 === 0) {
        tagMid[mid4] = 1;
        vertexMapUp[acc++] = mid4;
      }
      if (tag5 === 0) {
        tagMid[mid5] = 1;
        vertexMapUp[acc++] = mid5;
      }
    }
  };

  /** Copy the vertices data from up to low */
  Reversion.copyVerticesData = function (baseMesh, newMesh) {
    var vArUp = baseMesh.getVertices();
    var cArUp = baseMesh.getColors();
    var vArDown = newMesh.getVertices();
    var cArDown = new Float32Array(vArDown);
    newMesh.setColors(cArDown);
    var vertexMapUp = newMesh.getVerticesMapping();
    var i = 0;
    var nbVertices = newMesh.getNbVertices();
    for (i = 0; i < nbVertices; ++i) {
      if (vertexMapUp[i] >= nbVertices)
        break;
    }
    if (i === nbVertices) {
      // we don't have to keep the vertex mapping
      var fArDown = newMesh.getFaces();
      var nb = fArDown.length;
      for (i = 0; i < nb; ++i) {
        var idv = fArDown[i];
        if (idv >= 0)
          fArDown[i] = vertexMapUp[idv];
      }
      // direct mapping for even vertices
      for (i = 0; i < nbVertices; ++i)
        vertexMapUp[i] = i;
      vArDown.set(vArUp.subarray(0, nbVertices * 3));
      cArDown.set(cArUp.subarray(0, nbVertices * 3));
    } else {
      // we keep the vertex mapping
      newMesh.setEvenMapping(true);
      for (i = 0; i < nbVertices; ++i) {
        var id = i * 3;
        var idUp = vertexMapUp[i] * 3;
        vArDown[id] = vArUp[idUp];
        vArDown[id + 1] = vArUp[idUp + 1];
        vArDown[id + 2] = vArUp[idUp + 2];
        cArDown[id] = cArUp[idUp];
        cArDown[id + 1] = cArUp[idUp + 1];
        cArDown[id + 2] = cArUp[idUp + 2];
      }
    }
  };

  /** Apply the reverse of a subdivision */
  Reversion.computeReverse = function (baseMesh, newMesh) {
    if (baseMesh.getNbFaces() % 4 !== 0)
      return false;
    var vEvenTags = Reversion.tagEvenVertices(baseMesh);
    if (!vEvenTags)
      return false;
    Reversion.createVertices(baseMesh, newMesh, Reversion.createFaces(baseMesh, newMesh, vEvenTags));
    Reversion.copyVerticesData(baseMesh, newMesh);
    newMesh.allocateArrays();
    return true;
  };

  return Reversion;
});