define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var Decimation = {};

  Decimation.getSeed = function (mesh, vEvenTags) {
    var vAr = mesh.getVertices();
    var onEdge = mesh.getVerticesOnEdge();
    var vrvStartCount = mesh.getVerticesRingVertStartCount();
    for (var i = 0, l = vAr.length; i < l; ++i) {
      if (vEvenTags[i] !== 0)
        continue;
      var len = vrvStartCount[i * 2 + 1];
      var vBorder = onEdge[i];
      // TODO QUAD (quad => border odd!==2 , quad odd!==4)
      if ((vBorder && len !== 4) || (!vBorder && len !== 6))
        return i;
    }
    return 0;
  };

  Decimation.tagVertices = function (mesh, vEvenTags) {
    var tagFlag = ++Utils.TAG_FLAG;
    var vFlags = mesh.getVerticesTagFlags();
    var vrvSC = mesh.getVerticesRingVertStartCount();
    var vrv = mesh.getVerticesRingVert();
    var onEdge = mesh.getVerticesOnEdge();

    var vSeed = Decimation.getSeed(mesh, vEvenTags);
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
        var oddStart = vrvSC[oddId * 2];
        var oddEnd = vrvSC[oddId * 2 + 1];
        var oddBorder = onEdge[oddId];
        // extraordinary vertex marked as odd vertex
        // TODO QUAD (quad => border odd!==2 , quad odd!==4)
        if ((oddBorder && oddEnd !== 4) || (!oddBorder && oddEnd !== 6))
          return;
        // odd vertex on the boundary and even in the interior
        if (oddBorder && !vBorder)
          return;
        oddEnd += oddStart;
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
  Decimation.tagEvenVertices = function (mesh) {
    var nbVertices = mesh.getNbVertices();
    // 0 not processed, -1 odd vertex, 1 even vertex
    var vEvenTags = new Int8Array(nbVertices);
    var running = true;
    while (running) {
      var status = Decimation.tagVertices(mesh, vEvenTags);
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
  Decimation.createFaces = function (baseMesh, newMesh, vEvenTags) {
    var feAr = baseMesh.getFaceEdges();
    var fArUp = baseMesh.getFaces();
    var tagEdges = new Int32Array(baseMesh.getNbEdges());
    var i = 0;
    var nbFaces = baseMesh.getNbFaces();
    for (i = 0; i < nbFaces; ++i) {
      var j = i * 4;
      var iv1 = fArUp[j];
      var iv2 = fArUp[j + 1];
      var iv3 = fArUp[j + 2];
      var tag1 = vEvenTags[iv1];
      var tag2 = vEvenTags[iv2];
      var tag3 = vEvenTags[iv3];
      if (tag1 + tag2 + tag3 === -3)
        continue;
      if (tag1 === 1)
        tagEdges[feAr[j + 1]] = iv1 + 1;
      else if (tag2 === 1)
        tagEdges[feAr[j + 2]] = iv2 + 1;
      else if (tag3 === 1)
        tagEdges[feAr[j]] = iv3 + 1;
    }
    var fArDown = new Int32Array(nbFaces * 4 / 4);
    var fArCenterUp = new Int32Array(nbFaces / 4);
    var acc = 0;
    for (i = 0; i < nbFaces; ++i) {
      var id = i * 4;
      var te1 = tagEdges[feAr[id]] - 1;
      if (te1 === -1)
        continue;
      var te2 = tagEdges[feAr[id + 1]] - 1;
      if (te2 === -1)
        continue;
      var te3 = tagEdges[feAr[id + 2]] - 1;
      if (te3 === -1)
        continue;
      fArCenterUp[acc] = i;
      var idFace = acc * 4;
      fArDown[idFace] = te1;
      fArDown[idFace + 1] = te2;
      fArDown[idFace + 2] = te3;
      fArDown[idFace + 3] = -1;
      ++acc;
    }
    newMesh.setFaces(fArDown);
    return fArCenterUp;
  };

  /** Creates the vertices of the mesh */
  Decimation.createVertices = function (baseMesh, newMesh, fArCenterUp) {
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
    var tagMid = new Uint8Array(baseMesh.getNbVertices());
    len /= 3;
    for (i = 0; i < len; ++i) {
      var id = fArCenterUp[i] * 4;
      var mid1 = fArUp[id];
      var mid2 = fArUp[id + 1];
      var mid3 = fArUp[id + 2];
      var tag1 = tagMid[mid1];
      var tag2 = tagMid[mid2];
      var tag3 = tagMid[mid3];
      if (tag2 === 0) {
        tagMid[mid2] = 1;
        vertexMapUp[acc++] = mid2;
      }
      if (tag3 === 0) {
        tagMid[mid3] = 1;
        vertexMapUp[acc++] = mid3;
      }
      if (tag1 === 0) {
        tagMid[mid1] = 1;
        vertexMapUp[acc++] = mid1;
      }
    }
  };

  /** Copy the vertices data from up to low */
  Decimation.copyVerticesData = function (baseMesh, newMesh) {
    var vArUp = baseMesh.getVertices();
    var cArUp = baseMesh.getColors();
    var vertexMapUp = newMesh.getVerticesMapping();
    var vArDown = newMesh.getVertices();
    var cArDown = new Float32Array(vArDown);
    for (var i = 0, len = newMesh.getNbVertices(); i < len; ++i) {
      var id = i * 3;
      var idUp = vertexMapUp[i] * 3;
      vArDown[id] = vArUp[idUp];
      vArDown[id + 1] = vArUp[idUp + 1];
      vArDown[id + 2] = vArUp[idUp + 2];
      cArDown[id] = cArUp[idUp];
      cArDown[id + 1] = cArUp[idUp + 1];
      cArDown[id + 2] = cArUp[idUp + 2];
    }
    newMesh.setVertices(vArDown);
    newMesh.setColors(cArDown);
  };

  /** Apply the reverse of loop subdivision */
  Decimation.reverseLoop = function (baseMesh, newMesh) {
    var vEvenTags = Decimation.tagEvenVertices(baseMesh);
    if (!vEvenTags)
      return false;
    var fArCenterUp = Decimation.createFaces(baseMesh, newMesh, vEvenTags);
    Decimation.createVertices(baseMesh, newMesh, fArCenterUp);
    Decimation.copyVerticesData(baseMesh, newMesh);
    newMesh.allocateArrays();
    return true;
  };

  return Decimation;
});