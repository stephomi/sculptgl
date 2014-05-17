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

  // v4____m3____v3
  // |     |     |
  // |     |     |
  // |m4___|c_ __|m2
  // |     |     |
  // |     |     |
  // |_____|_____|
  // v1   m1     v2

  // Helper class
  var OddVertexComputer = function (mesh, vArOut, cArOut) {
    this.vArOut_ = vArOut;
    this.cArOut_ = cArOut;
    this.vAr_ = mesh.getVertices();
    this.cAr_ = mesh.getColors();
    this.eAr_ = mesh.getEdges();
    this.nbVertices_ = mesh.getNbVertices();
    this.tagEdges_ = new Int32Array(mesh.getNbEdges());
  };

  OddVertexComputer.prototype = {
    computeTriangleEdgeVertex: function (iv1, iv2, iv3, ide) {
      var vAr = this.vAr_;
      var cAr = this.cAr_;
      var eAr = this.eAr_;
      var vArOut = this.vArOut_;
      var cArOut = this.cArOut_;
      var tagEdges = this.tagEdges_;
      var id1 = iv1 * 3;
      var id2 = iv2 * 3;
      var idOpp = iv3 * 3;
      var testEdge = tagEdges[ide] - 1;
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
        tagEdges[ide] = ivMid + 1;
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
    },
    computeQuadEdgeVertex: function (iv1, iv2, iv3, iv4, ide) {
      var vAr = this.vAr_;
      var cAr = this.cAr_;
      var eAr = this.eAr_;
      var vArOut = this.vArOut_;
      var cArOut = this.cArOut_;
      var tagEdges = this.tagEdges_;
      var id1 = iv1 * 3;
      var id2 = iv2 * 3;
      var idOpp = iv3 * 3;
      var idOpp2 = iv4 * 3;
      var testEdge = tagEdges[ide] - 1;
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
        tagEdges[ide] = ivMid + 1;
        vArOut[idMid] = 0.0625 * (vAr[idOpp] + vAr[idOpp2]) + 0.375 * (vAr[id1] + vAr[id2]);
        vArOut[idMid + 1] = 0.0625 * (vAr[idOpp + 1] + vAr[idOpp2 + 1]) + 0.375 * (vAr[id1 + 1] + vAr[id2 + 1]);
        vArOut[idMid + 2] = 0.0625 * (vAr[idOpp + 2] + vAr[idOpp2 + 2]) + 0.375 * (vAr[id1 + 2] + vAr[id2 + 2]);

        cArOut[idMid] = 0.0625 * (cAr[idOpp] + cAr[idOpp2]) + 0.375 * (cAr[id1] + cAr[id2]);
        cArOut[idMid + 1] = 0.0625 * (cAr[idOpp + 1] + cAr[idOpp2 + 1]) + 0.375 * (cAr[id1 + 1] + cAr[id2 + 1]);
        cArOut[idMid + 2] = 0.0625 * (cAr[idOpp + 2] + cAr[idOpp2 + 2]) + 0.375 * (cAr[id1 + 2] + cAr[id2 + 2]);
      } else { // mid vertex already exists
        vArOut[idMid] += 0.0625 * (vAr[idOpp] + vAr[idOpp2]);
        vArOut[idMid + 1] += 0.0625 * (vAr[idOpp + 1] + vAr[idOpp2 + 1]);
        vArOut[idMid + 2] += 0.0625 * (vAr[idOpp + 2] + vAr[idOpp2 + 2]);

        cArOut[idMid] += 0.0625 * (cAr[idOpp] + cAr[idOpp2]);
        cArOut[idMid + 1] += 0.0625 * (cAr[idOpp + 1] + cAr[idOpp2 + 1]);
        cArOut[idMid + 2] += 0.0625 * (cAr[idOpp + 2] + cAr[idOpp2 + 2]);
      }
      return ivMid;
    },
    computeFaceVertex: function (iv1, iv2, iv3, iv4) {
      var id1 = iv1 * 3;
      var id2 = iv2 * 3;
      var id3 = iv3 * 3;
      var id4 = iv4 * 3;
      var vAr = this.vAr_;
      var cAr = this.cAr_;
      var vArOut = this.vArOut_;
      var cArOut = this.cArOut_;
      var ivCen = this.nbVertices_++;
      var idCen = ivCen * 3;
      vArOut[idCen] = 0.25 * (vAr[id1] + vAr[id2] + vAr[id3] + vAr[id4]);
      vArOut[idCen + 1] = 0.25 * (vAr[id1 + 1] + vAr[id2 + 1] + vAr[id3 + 1] + vAr[id4 + 1]);
      vArOut[idCen + 2] = 0.25 * (vAr[id1 + 2] + vAr[id2 + 2] + vAr[id3 + 2] + vAr[id4 + 2]);

      cArOut[idCen] = 0.25 * (cAr[id1] + cAr[id2] + cAr[id3] + cAr[id4]);
      cArOut[idCen + 1] = 0.25 * (cAr[id1 + 1] + cAr[id2 + 1] + cAr[id3 + 1] + cAr[id4 + 1]);
      cArOut[idCen + 2] = 0.25 * (cAr[id1 + 2] + cAr[id2 + 2] + cAr[id3 + 2] + cAr[id4 + 2]);
      return ivCen;
    }
  };

  var Subdivision = {};

  /** Apply a complete loop subdivision (by updating the topology) */
  Subdivision.fullSubdivision = function (baseMesh, newMesh) {
    Subdivision.allocateArrays(baseMesh, newMesh);
    Subdivision.applyEvenSmooth(baseMesh, newMesh.getVertices(), newMesh.getColors());
    Subdivision.applyOddSmooth(baseMesh, newMesh.getVertices(), newMesh.getColors(), newMesh.getFaces());
  };

  /** Apply loop subdivision without topology computation */
  Subdivision.partialSubdivision = function (baseMesh, vertOut, colorOut) {
    Subdivision.applyEvenSmooth(baseMesh, vertOut, colorOut);
    Subdivision.applyOddSmooth(baseMesh, vertOut, colorOut);
  };

  /** Allocate the arrays for the new mesh */
  Subdivision.allocateArrays = function (baseMesh, newMesh) {
    newMesh.setVertices(new Float32Array((baseMesh.getNbVertices() + baseMesh.getNbEdges() + baseMesh.getNbQuads()) * 3));
    newMesh.setFaces(new Int32Array(baseMesh.getNbFaces() * 4 * 4));
    newMesh.allocateArrays();
  };

  /** Even vertices smoothing */
  Subdivision.applyEvenSmooth = function (baseMesh, even, colorOut) {
    colorOut.set(baseMesh.getColors());
    var vArOld = baseMesh.getVertices();
    var fArOld = baseMesh.getFaces();
    var vertOnEdgeOld = baseMesh.getVerticesOnEdge();
    var vrvStartCount = baseMesh.getVerticesRingVertStartCount();
    var vertRingVert = baseMesh.getVerticesRingVert();
    var vrfStartCount = baseMesh.getVerticesRingFaceStartCount();
    var vertRingFace = baseMesh.getVerticesRingFace();
    var onlyTri = baseMesh.hasOnlyTriangles();
    var nbVerts = baseMesh.getNbVertices();

    for (var i = 0; i < nbVerts; ++i) {
      var j = i * 3;
      var start = vrvStartCount[i * 2];
      var count = vrvStartCount[i * 2 + 1];
      var end = start + count;
      var avx = 0.0;
      var avy = 0.0;
      var avz = 0.0;
      var beta = 0.0;
      var alpha = 0.0;
      var k = 0;
      var id = 0;
      // edge vertex
      if (vertOnEdgeOld[i]) {
        for (k = start; k < end; ++k) {
          id = vertRingVert[k];
          if (vertOnEdgeOld[id]) {
            id *= 3;
            avx += vArOld[id];
            avy += vArOld[id + 1];
            avz += vArOld[id + 2];
            beta++;
          }
        }
        beta = 0.25 / beta;
        alpha = 0.75;
        even[j] = vArOld[j] * alpha + avx * beta;
        even[j + 1] = vArOld[j + 1] * alpha + avy * beta;
        even[j + 2] = vArOld[j + 2] * alpha + avz * beta;
        continue;
      }
      // interior vertex
      for (k = start; k < end; ++k) {
        id = vertRingVert[k] * 3;
        avx += vArOld[id];
        avy += vArOld[id + 1];
        avz += vArOld[id + 2];
      }
      // only vertex tri
      if (onlyTri) {
        if (count === 6) {
          beta = 0.0625;
          alpha = 0.625;
        } else if (count === 3) { // warren weights
          beta = 0.1875;
          alpha = 0.4375;
        } else {
          beta = 0.375 / count;
          alpha = 0.625;
        }
        even[j] = vArOld[j] * alpha + avx * beta;
        even[j + 1] = vArOld[j + 1] * alpha + avy * beta;
        even[j + 2] = vArOld[j + 2] * alpha + avz * beta;
        continue;
      }
      var oppx = 0.0;
      var oppy = 0.0;
      var oppz = 0.0;
      var gamma = 0.0;

      var startFace = vrfStartCount[i * 2];
      var countFace = vrfStartCount[i * 2 + 1];
      var endFace = startFace + countFace;
      var nbQuad = 0;
      for (k = startFace; k < endFace; ++k) {
        id = vertRingFace[k] * 4;
        var iv4 = fArOld[id + 3];
        if (iv4 < 0) continue;
        nbQuad++;
        var iv1 = fArOld[id];
        var iv2 = fArOld[id + 1];
        var iv3 = fArOld[id + 2];
        var ivOpp = 0;
        if (iv1 === i) ivOpp = iv3 * 3;
        else if (iv2 === i) ivOpp = iv4 * 3;
        else if (iv3 === i) ivOpp = iv1 * 3;
        else ivOpp = iv2 * 3;
        oppx += vArOld[ivOpp];
        oppy += vArOld[ivOpp + 1];
        oppz += vArOld[ivOpp + 2];
      }
      // interior vertex quad
      if (nbQuad === (endFace - startFace)) {
        if (count === 4) {
          alpha = 0.5625;
          beta = 0.09375;
          gamma = 0.015625;
        } else {
          beta = 1.5 / (count * count);
          gamma = 0.25 / (count * count);
          alpha = 1.0 - (beta + gamma) * count;
        }
        even[j] = vArOld[j] * alpha + avx * beta + oppx * gamma;
        even[j + 1] = vArOld[j + 1] * alpha + avy * beta + oppy * gamma;
        even[j + 2] = vArOld[j + 2] * alpha + avz * beta + oppz * gamma;
        continue;
      }
      // interior vertex tri
      if (nbQuad === 0) {
        if (count === 6) {
          beta = 0.0625;
          alpha = 0.625;
        } else if (count === 3) { // warren weights
          beta = 0.1875;
          alpha = 0.4375;
        } else {
          beta = 0.375 / count;
          alpha = 0.625;
        }
        even[j] = vArOld[j] * alpha + avx * beta;
        even[j + 1] = vArOld[j + 1] * alpha + avy * beta;
        even[j + 2] = vArOld[j + 2] * alpha + avz * beta;
        continue;
      }
      // interior tri-quad
      alpha = 1.0 / (1.0 + count * 0.5 + nbQuad * 0.25);
      beta = alpha * 0.5;
      gamma = alpha * 0.25;
      even[j] = vArOld[j] * alpha + avx * beta + oppx * gamma;
      even[j + 1] = vArOld[j + 1] * alpha + avy * beta + oppy * gamma;
      even[j + 2] = vArOld[j + 2] * alpha + avz * beta + oppz * gamma;
    }
  };

  /** Odd vertices smoothing */
  Subdivision.applyOddSmooth = function (mesh, odds, colorOut, fArOut) {
    var fAr = mesh.getFaces();
    var feAr = mesh.getFaceEdges();
    var oddComputer = new OddVertexComputer(mesh, odds, colorOut);
    for (var i = 0, l = mesh.getNbFaces(); i < l; ++i) {
      var id = i * 4;
      var iv1 = fAr[id];
      var iv2 = fAr[id + 1];
      var iv3 = fAr[id + 2];
      var iv4 = fAr[id + 3];
      var ivMid1, ivMid2, ivMid3, ivMid4, ivCen;
      if (iv4 >= 0) {
        ivMid1 = oddComputer.computeQuadEdgeVertex(iv1, iv2, iv3, iv4, feAr[id]);
        ivMid2 = oddComputer.computeQuadEdgeVertex(iv2, iv3, iv4, iv1, feAr[id + 1]);
        ivMid3 = oddComputer.computeQuadEdgeVertex(iv3, iv4, iv1, iv2, feAr[id + 2]);
        ivMid4 = oddComputer.computeQuadEdgeVertex(iv4, iv1, iv2, iv3, feAr[id + 3]);
        ivCen = oddComputer.computeFaceVertex(iv1, iv2, iv3, iv4);
      } else {
        ivMid1 = oddComputer.computeTriangleEdgeVertex(iv1, iv2, iv3, feAr[id]);
        ivMid2 = oddComputer.computeTriangleEdgeVertex(iv2, iv3, iv1, feAr[id + 1]);
        ivMid3 = oddComputer.computeTriangleEdgeVertex(iv3, iv1, iv2, feAr[id + 2]);
      }
      if (!fArOut)
        continue;

      id *= 4;
      if (iv4 >= 0) {
        fArOut[id + 1] = fArOut[id + 4] = ivMid1;
        fArOut[id + 6] = fArOut[id + 9] = ivMid2;
        fArOut[id + 11] = fArOut[id + 14] = ivMid3;
        fArOut[id + 3] = fArOut[id + 12] = ivMid4;
        fArOut[id + 2] = fArOut[id + 7] = fArOut[id + 8] = fArOut[id + 13] = ivCen;
        fArOut[id] = iv1;
        fArOut[id + 5] = iv2;
        fArOut[id + 10] = iv3;
        fArOut[id + 15] = iv4;
      } else {
        fArOut[id] = fArOut[id + 5] = fArOut[id + 8] = ivMid1;
        fArOut[id + 1] = fArOut[id + 10] = fArOut[id + 12] = ivMid2;
        fArOut[id + 2] = fArOut[id + 6] = fArOut[id + 14] = ivMid3;
        fArOut[id + 3] = fArOut[id + 7] = fArOut[id + 11] = fArOut[id + 15] = -1;
        fArOut[id + 4] = iv1;
        fArOut[id + 9] = iv2;
        fArOut[id + 13] = iv3;
      }
      id += 12;
    }
  };

  return Subdivision;
});