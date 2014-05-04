define([], function () {

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
    this.vAr_ = mesh.getVertices();
    this.cAr_ = mesh.getColors();
    this.eAr_ = mesh.getEdges();
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
    Subdivision.applyEvenSmooth(baseMesh, newMesh.getVertices(), newMesh.getColors());
    Subdivision.applyOddSmooth(baseMesh, newMesh.getVertices(), newMesh.getColors(), newMesh.getIndices());
  };

  /** Apply loop subdivision without topology computation */
  Subdivision.partialSubdivision = function (baseMesh, vertOut, colorOut) {
    Subdivision.applyEvenSmooth(baseMesh, vertOut, colorOut);
    Subdivision.applyOddSmooth(baseMesh, vertOut, colorOut);
  };

  /** Allocate the arrays for the new mesh */
  Subdivision.allocateArrays = function (baseMesh, newMesh) {
    newMesh.setVertices(new Float32Array((baseMesh.getNbVertices() + baseMesh.getNbEdges()) * 3));
    newMesh.setIndices(new Uint32Array(baseMesh.getNbTriangles() * 4 * 3));
    // not necessary because the edges will be computed later
    // newMesh.edges_ = new Uint8Array(baseMesh.getNbEdges() * 2 + baseMesh.getNbTriangles() * 3);
    newMesh.allocateArrays();
  };

  /** Even vertices smoothing */
  Subdivision.applyEvenSmooth = function (baseMesh, even, colorOut) {
    colorOut.set(baseMesh.getColors());
    var vArOld = baseMesh.getVertices();
    var vertOnEdgeOld = baseMesh.getVerticesOnEdge();
    var vrrStartCount = baseMesh.getVerticesRingVertStartCount();
    var vertRingVert = baseMesh.getVerticesRingVert();
    var nbVerts = baseMesh.getNbVertices();

    for (var i = 0; i < nbVerts; ++i) {
      var j = i * 3;
      var start = vrrStartCount[i * 2];
      var count = vrrStartCount[i * 2 + 1];
      var avx = 0.0;
      var avy = 0.0;
      var avz = 0.0;
      var beta = 0.0;
      var betaComp = 0.0;
      var k = 0;
      var id = 0;
      if (vertOnEdgeOld[i]) { // edge vertex
        for (k = 0; k < count; ++k) {
          id = vertRingVert[start + k];
          if (vertOnEdgeOld[id]) {
            id *= 3;
            avx += vArOld[id];
            avy += vArOld[id + 1];
            avz += vArOld[id + 2];
            beta++;
          }
        }
        beta = 0.25 / beta;
        betaComp = 0.75;
      } else {
        for (k = 0; k < count; ++k) {
          id = vertRingVert[start + k] * 3;
          avx += vArOld[id];
          avy += vArOld[id + 1];
          avz += vArOld[id + 2];
        }
        if (count === 6) {
          beta = 0.0625;
          betaComp = 0.625;
        } else if (count === 3) { // warren weights
          beta = 0.1875;
          betaComp = 0.4375;
        } else {
          beta = 0.375 / count;
          betaComp = 0.625;
        }
      }
      even[j] = vArOld[j] * betaComp + avx * beta;
      even[j + 1] = vArOld[j + 1] * betaComp + avy * beta;
      even[j + 2] = vArOld[j + 2] * betaComp + avz * beta;
    }
  };

  /** Odd vertices smoothing */
  Subdivision.applyOddSmooth = function (mesh, odds, colorOut, iArOut) {
    var iAr = mesh.getIndices();
    var teAr = mesh.getTriEdges();
    var midComputer = new MidEdgeComputer(mesh, odds, colorOut);
    for (var i = 0, l = mesh.getNbTriangles(); i < l; ++i) {
      var id = i * 3;
      var iv1 = iAr[id];
      var iv2 = iAr[id + 1];
      var iv3 = iAr[id + 2];
      var ivMid1 = midComputer.computeMidEdge(iv1, iv2, iv3, teAr[id]);
      var ivMid2 = midComputer.computeMidEdge(iv2, iv3, iv1, teAr[id + 1]);
      var ivMid3 = midComputer.computeMidEdge(iv3, iv1, iv2, teAr[id + 2]);
      if (iArOut) {
        id *= 4;
        iArOut[id] = ivMid1;
        iArOut[id + 1] = ivMid2;
        iArOut[id + 2] = ivMid3;

        id += 3;
        iArOut[id] = iv1;
        iArOut[id + 1] = ivMid1;
        iArOut[id + 2] = ivMid3;

        id += 3;
        iArOut[id] = ivMid1;
        iArOut[id + 1] = iv2;
        iArOut[id + 2] = ivMid2;

        id += 3;
        iArOut[id] = ivMid2;
        iArOut[id + 1] = iv3;
        iArOut[id + 2] = ivMid3;
      }
    }
  };

  return Subdivision;
});