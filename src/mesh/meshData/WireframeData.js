define([], function () {

  'use strict';

  function WireframeData(mesh) {
    this.mesh_ = mesh; //the mesh
    this.drawArraysWireframe_ = null; //array for the wireframe (base on drawArrays vertices)
    this.drawElementsWireframe_ = null; //array for the wireframe (base on drawElements vertices)
  }

  WireframeData.prototype = {
    /** Return wireframe arrays */
    getWireframe: function (useDrawArrays) {
      return useDrawArrays ? this.drawArraysWireframe_ : this.drawElementsWireframe_;
    },
    /** Updates the arrays that are going to be used for webgl */
    updateWireframe: function (useDrawArrays) {
      var mesh = this.mesh_;
      var nbEdges = mesh.getNbEdges();
      var cdw;
      if (useDrawArrays) {
        if (this.drawArraysWireframe_ && this.drawArraysWireframe_.length === nbEdges * 2) {
          return;
        }
        cdw = this.drawArraysWireframe_ = new Uint32Array(nbEdges * 2);
      } else {
        if (this.drawElementsWireframe_ && this.drawElementsWireframe_.length === nbEdges * 2) {
          return;
        }
        cdw = this.drawElementsWireframe_ = new Uint32Array(nbEdges * 2);
      }

      var iAr = mesh.getIndices();
      var teAr = mesh.getTriEdges();
      var nbTriangles = mesh.getNbTriangles();

      var nbLines = 0;
      var tagEdges = new Int32Array(nbEdges);

      for (var i = 0; i < nbTriangles; ++i) {
        var id = i * 3;

        var iv1 = useDrawArrays ? id : iAr[id];
        var iv2 = useDrawArrays ? id + 1 : iAr[id + 1];
        var iv3 = useDrawArrays ? id + 2 : iAr[id + 2];

        var ide1 = teAr[id];
        var ide2 = teAr[id + 1];
        var ide3 = teAr[id + 2];

        if (tagEdges[ide1] === 0) {
          tagEdges[ide1] = 1;
          cdw[nbLines * 2] = iv1;
          cdw[nbLines * 2 + 1] = iv2;
          nbLines++;
        }
        if (tagEdges[ide2] === 0) {
          tagEdges[ide2] = 1;
          cdw[nbLines * 2] = iv2;
          cdw[nbLines * 2 + 1] = iv3;
          nbLines++;
        }
        if (tagEdges[ide3] === 0) {
          tagEdges[ide3] = 1;
          cdw[nbLines * 2] = iv3;
          cdw[nbLines * 2 + 1] = iv1;
          nbLines++;
        }
      }
    }
  };

  return WireframeData;
});