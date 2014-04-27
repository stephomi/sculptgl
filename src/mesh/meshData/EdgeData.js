define([], function () {

  'use strict';

  function EdgeData(mesh) {
    this.mesh_ = mesh; //the mesh

    this.edges_ = null; //edges (Uint8Array) (1 => outer edge, 0 or 2 => inner edge)
  }

  EdgeData.prototype = {
    getEdges: function () {
      return this.edges_;
    },
    getNbEdges: function () {
      return this.edges_.length;
    },
    /** Computes the edges */
    initEdges: function () {
      var mesh = this.mesh_;
      var iAr = mesh.getIndices();
      var teAr = mesh.getTriEdges();
      var nbEdges = 0;
      var vertEdgeTemp = new Uint32Array(mesh.getNbVertices());
      var t = 0;
      var idEdge = 0;
      var vrtStartCount = mesh.getVerticesRingTriStartCount();
      var vertRingTri = mesh.getVerticesRingTri();
      for (var i = 0, nbVerts = mesh.getNbVertices(); i < nbVerts; ++i) {
        var start = vrtStartCount[i * 2];
        var count = vrtStartCount[i * 2 + 1];
        var compTest = nbEdges;
        for (var j = 0; j < count; ++j) {
          var id = vertRingTri[start + j] * 3;
          var iv1 = iAr[id];
          var iv2 = iAr[id + 1];
          var iv3 = iAr[id + 2];
          if (i > iv1) {
            t = vertEdgeTemp[iv1];
            idEdge = id + (i === iv2 ? 0 : 2);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv1] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
          if (i > iv2) {
            t = vertEdgeTemp[iv2];
            idEdge = id + (i === iv1 ? 0 : 1);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv2] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
          if (i > iv3) {
            t = vertEdgeTemp[iv3];
            idEdge = id + (i === iv1 ? 2 : 1);
            if (t <= compTest) {
              teAr[idEdge] = nbEdges;
              vertEdgeTemp[iv3] = ++nbEdges;
            } else {
              teAr[idEdge] = t - 1;
            }
          }
        }
      }
      var eAr = this.edges_ = new Uint8Array(nbEdges);
      for (var k = 0, nbTrisEdges = teAr.length; k < nbTrisEdges; ++k) {
        eAr[teAr[k]]++;
      }
    }
  };

  return EdgeData;
});