define(function (require, exports, module) {

  'use strict';

  var EdgeData = function (mesh) {
    this._mesh = mesh; // the mesh

    this._edges = null; // edges (Uint8Array) (1 => outer edge, 0 or 2 => inner edge, >=3 non manifold)
  };

  EdgeData.prototype = {
    getEdges: function () {
      return this._edges;
    },
    getNbEdges: function () {
      return this._edges.length;
    },
    /** Computes the edges */
    initEdges: function () {
      var mesh = this._mesh;
      var fAr = mesh.getFaces();
      var feAr = mesh.getFaceEdges();
      var nbEdges = 0;
      var vertEdgeTemp = new Uint32Array(mesh.getNbVertices());
      var vrfStartCount = mesh.getVerticesRingFaceStartCount();
      var vertRingFace = mesh.getVerticesRingFace();
      for (var i = 0, nbVerts = mesh.getNbVertices(); i < nbVerts; ++i) {
        var start = vrfStartCount[i * 2];
        var end = start + vrfStartCount[i * 2 + 1];
        var compTest = nbEdges;
        for (var j = start; j < end; ++j) {
          var id = vertRingFace[j] * 4;
          var iv1 = fAr[id];
          var iv2 = fAr[id + 1];
          var iv3 = fAr[id + 2];
          var iv4 = fAr[id + 3];
          var t = 0;
          var idEdge = 0;
          if (iv4 < 0) {
            if (i > iv1) {
              t = vertEdgeTemp[iv1];
              idEdge = id + (i === iv2 ? 0 : 2);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv1] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            if (i > iv2) {
              t = vertEdgeTemp[iv2];
              idEdge = id + (i === iv1 ? 0 : 1);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv2] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            if (i > iv3) {
              t = vertEdgeTemp[iv3];
              idEdge = id + (i === iv1 ? 2 : 1);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv3] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            feAr[id + 3] = -1;
          } else {
            if (i > iv1 && i !== iv3) {
              t = vertEdgeTemp[iv1];
              idEdge = id + (i === iv2 ? 0 : 3);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv1] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            if (i > iv2 && i !== iv4) {
              t = vertEdgeTemp[iv2];
              idEdge = id + (i === iv1 ? 0 : 1);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv2] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            if (i > iv3 && i !== iv1) {
              t = vertEdgeTemp[iv3];
              idEdge = id + (i === iv2 ? 1 : 2);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv3] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
            if (i > iv4 && i !== iv2) {
              t = vertEdgeTemp[iv4];
              idEdge = id + (i === iv1 ? 3 : 2);
              if (t <= compTest) {
                feAr[idEdge] = nbEdges;
                vertEdgeTemp[iv4] = ++nbEdges;
              } else {
                feAr[idEdge] = t - 1;
              }
            }
          }
        }
      }
      var eAr = this._edges = new Uint8Array(nbEdges);
      for (var k = 0, nbFaceEdges = feAr.length; k < nbFaceEdges; ++k)
        eAr[feAr[k]]++;
    }
  };

  module.exports = EdgeData;
});