define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  //       v3
  //       /\
  //      /3T\ 
  //   m3/____\m2
  //    /\ 0T /\
  //   /1T\  /2T\
  //  /____\/____\ 
  // v1    m1    v2

  // Helper class
  var MidEdgeComputer = function (mesh, vArOut, cArOut) {
    this.vArOut_ = vArOut;
    this.cArOut_ = cArOut;
    this.vAr_ = mesh.verticesXYZ_;
    this.cAr_ = mesh.colorsRGB_;
    this.eAr_ = mesh.edges_;
    this.nbVertices_ = mesh.getNbVertices();
    this.tagEdges_ = new Int32Array(mesh.getNbEdges());
    this.init();
  };

  MidEdgeComputer.prototype = {
    init: function () {
      var tagEdges = this.tagEdges_;
      for (var i = 0, len = tagEdges.length; i < len; ++i)
        tagEdges[i] = -1;
    },
    computeMidEdge: function (iv1, iv2, iv3, ide) {
      var vAr = this.vAr_;
      var cAr = this.cAr_;
      var eAr = this.eAr_;
      var vArOut = this.vArOut_;
      var cArOut = this.cArOut_;
      var tagEdges = this.tagEdges_;
      var id1 = iv1 * 3;
      var id2 = iv2 * 3;
      var idOpp = iv3 * 3;
      var testEdge = tagEdges[ide];
      var ivMid = testEdge === -1 ? this.nbVertices_++ : testEdge;
      var idMid = ivMid * 3;
      if (eAr[ide] === 1) { // mid edge vertex
        vArOut[idMid] = 0.5 * (vAr[id1] + vAr[id2]);
        vArOut[idMid + 1] = 0.5 * (vAr[id1 + 1] + vAr[id2 + 1]);
        vArOut[idMid + 2] = 0.5 * (vAr[id1 + 2] + vAr[id2 + 2]);

        cArOut[idMid] = 0.5 * (cAr[id1] + cAr[id2]);
        cArOut[idMid + 1] = 0.5 * (cAr[id1 + 1] + cAr[id2 + 1]);
        cArOut[idMid + 2] = 0.5 * (cAr[id1 + 2] + cAr[id2 + 2]);
      } else if (testEdge === -1) { // new mid vertex
        tagEdges[ide] = ivMid;
        vArOut[idMid] = 0.125 * vAr[idOpp] + 0.375 * (vAr[id1] + vAr[id2]);
        vArOut[idMid + 1] = 0.125 * vAr[idOpp + 1] + 0.375 * (vAr[id1 + 1] + vAr[id2 + 1]);
        vArOut[idMid + 2] = 0.125 * vAr[idOpp + 2] + 0.375 * (vAr[id1 + 2] + vAr[id2 + 2]);

        cArOut[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id1] + cAr[id2]);
        cArOut[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id1 + 1] + cAr[id2 + 1]);
        cArOut[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id1 + 2] + cAr[id2 + 2]);
      } else { // mid vertex already exists
        vArOut[idMid] += 0.125 * vAr[idOpp];
        vArOut[idMid + 1] += 0.125 * vAr[idOpp + 1];
        vArOut[idMid + 2] += 0.125 * vAr[idOpp + 2];

        cArOut[idMid] += 0.125 * cAr[idOpp];
        cArOut[idMid + 1] += 0.125 * cAr[idOpp + 1];
        cArOut[idMid + 2] += 0.125 * cAr[idOpp + 2];
      }
      return ivMid;
    }
  };

  var Subdivision = {};

  /** Apply a complete loop subdivision (by updating the topology) */
  Subdivision.fullSubdivision = function (baseMesh, newMesh) {
    Subdivision.allocateArrays(baseMesh, newMesh);
    Subdivision.applyEvenSmooth(baseMesh, newMesh.verticesXYZ_, newMesh.colorsRGB_);
    Subdivision.applyOddSmooth(baseMesh, newMesh.verticesXYZ_, newMesh.colorsRGB_, newMesh.indicesABC_);
    newMesh.initTopology();
  };

  /** Apply loop subdivision without topology computation */
  Subdivision.partialSubdivision = function (baseMesh, vertOut, colorOut) {
    Subdivision.applyEvenSmooth(baseMesh, vertOut, colorOut);
    Subdivision.applyOddSmooth(baseMesh, vertOut, colorOut);
  };

  /** Allocate the arrays for the new mesh */
  Subdivision.allocateArrays = function (baseMesh, newMesh) {
    newMesh.verticesXYZ_ = new Float32Array((baseMesh.getNbVertices() + baseMesh.getNbEdges()) * 3);
    newMesh.indicesABC_ = new Utils.indexArrayType(baseMesh.getNbTriangles() * 4 * 3);
    // not necessary because the edges will be computed later
    // newMesh.edges_ = new Uint8Array(baseMesh.getNbEdges() * 2 + baseMesh.getNbTriangles() * 3);
    newMesh.allocateArrays();
  };

  /** Even vertices smoothing */
  Subdivision.applyEvenSmooth = function (baseMesh, even, colorOut) {
    colorOut.set(baseMesh.colorsRGB_);
    var vArOld = baseMesh.verticesXYZ_;
    var vertOnEdgeOld = baseMesh.vertOnEdge_;
    var vertRingVert = baseMesh.vertRingVert_;
    var nbVerts = baseMesh.getNbVertices();

    for (var i = 0; i < nbVerts; ++i) {
      var j = i * 3;
      var ring = vertRingVert[i];
      var nbVRing = ring.length;
      var avx = 0.0,
        avy = 0.0,
        avz = 0.0;
      var beta = 0.0,
        betaComp = 0.0;
      var k = 0;
      if (vertOnEdgeOld[i]) { //edge vertex
        var comp = 0;
        for (k = 0; k < nbVRing; ++k) {
          var ind = ring[k];
          if (vertOnEdgeOld[ind]) {
            ind *= 3;
            avx += vArOld[ind];
            avy += vArOld[ind + 1];
            avz += vArOld[ind + 2];
            comp++;
          }
        }
        comp = 0.25 / comp;
        even[j] = vArOld[j] * 0.75 + avx * comp;
        even[j + 1] = vArOld[j + 1] * 0.75 + avy * comp;
        even[j + 2] = vArOld[j + 2] * 0.75 + avz * comp;
      } else {
        for (k = 0; k < nbVRing; ++k) {
          var id = ring[k] * 3;
          avx += vArOld[id];
          avy += vArOld[id + 1];
          avz += vArOld[id + 2];
        }
        if (nbVRing === 6) {
          beta = 0.0625;
          betaComp = 0.625;
        } else if (nbVRing === 3) { //warren weights
          beta = 0.1875;
          betaComp = 0.4375;
        } else {
          beta = 0.375 / nbVRing;
          betaComp = 0.625;
        }
        even[j] = vArOld[j] * betaComp + avx * beta;
        even[j + 1] = vArOld[j + 1] * betaComp + avy * beta;
        even[j + 2] = vArOld[j + 2] * betaComp + avz * beta;
      }
    }
  };

  /** Odd vertices smoothing */
  Subdivision.applyOddSmooth = function (mesh, odds, colorOut, iArOut) {
    var iAr = mesh.indicesABC_;
    var teAr = mesh.triEdges_;
    var nbTris = mesh.getNbTriangles();
    var midComputer = new MidEdgeComputer(mesh, odds, colorOut);
    for (var i = 0; i < nbTris; ++i) {
      var id = i * 3;
      var iv1 = iAr[id];
      var iv2 = iAr[id + 1];
      var iv3 = iAr[id + 2];
      var ivMid1 = midComputer.computeMidEdge(iv1, iv2, iv3, teAr[id]);
      var ivMid2 = midComputer.computeMidEdge(iv2, iv3, iv1, teAr[id + 1]);
      var ivMid3 = midComputer.computeMidEdge(iv3, iv1, iv2, teAr[id + 2]);
      if (iArOut) {
        iArOut[id] = ivMid1;
        iArOut[id + 1] = ivMid2;
        iArOut[id + 2] = ivMid3;

        id += nbTris;
        var idt1 = id * 3;
        iArOut[idt1] = iv1;
        iArOut[idt1 + 1] = ivMid1;
        iArOut[idt1 + 2] = ivMid3;

        var idt2 = (id + 1) * 3;
        iArOut[idt2] = ivMid1;
        iArOut[idt2 + 1] = iv2;
        iArOut[idt2 + 2] = ivMid2;

        var idt3 = (id + 2) * 3;
        iArOut[idt3] = ivMid2;
        iArOut[idt3 + 1] = iv3;
        iArOut[idt3 + 2] = ivMid3;
      }
    }
  };

  return Subdivision;
});