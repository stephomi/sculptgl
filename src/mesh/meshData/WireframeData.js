define([], function () {

  'use strict';

  function WireframeData(mesh) {
    this.mesh_ = mesh; // the mesh
    this.drawArraysWireframe_ = null; // array for the wireframe (base on drawArrays vertices)
    this.drawElementsWireframe_ = null; // array for the wireframe (base on drawElements vertices)
  }

  WireframeData.prototype = {
    /** Return wireframe array (or compute it if not up to date) */
    getWireframe: function (useDrawArrays) {
      var mesh = this.mesh_;
      var nbEdges = mesh.getNbEdges();
      var cdw;
      if (useDrawArrays) {
        if (this.drawArraysWireframe_ && this.drawArraysWireframe_.length === nbEdges * 2) {
          return this.drawArraysWireframe_;
        }
        cdw = this.drawArraysWireframe_ = new Uint32Array(nbEdges * 2);
      } else {
        if (this.drawElementsWireframe_ && this.drawElementsWireframe_.length === nbEdges * 2) {
          return this.drawElementsWireframe_;
        }
        cdw = this.drawElementsWireframe_ = new Uint32Array(nbEdges * 2);
      }

      var fAr = mesh.getFaces();
      var feAr = mesh.getFaceEdges();
      var nbFaces = mesh.getNbFaces();
      var facesToTris = mesh.getFacesToTriangles();

      var nbLines = 0;
      var tagEdges = new Int32Array(nbEdges);

      for (var i = 0; i < nbFaces; ++i) {
        var id = i * 4;

        var iv1, iv2, iv3;
        var iv4 = fAr[id + 3];
        if (useDrawArrays) {
          var idTri = facesToTris[i] * 3;
          iv1 = idTri;
          iv2 = idTri + 1;
          iv3 = idTri + 2;
          if (iv4 >= 0) iv4 = idTri + 5;
        } else {
          iv1 = fAr[id];
          iv2 = fAr[id + 1];
          iv3 = fAr[id + 2];
        }

        var ide1 = feAr[id];
        var ide2 = feAr[id + 1];
        var ide3 = feAr[id + 2];
        var ide4 = feAr[id + 3];

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
          cdw[nbLines * 2 + 1] = iv4 < 0 ? iv1 : iv4;
          nbLines++;
        }
        if (iv4 >= 0 && tagEdges[ide4] === 0) {
          tagEdges[ide4] = 1;
          cdw[nbLines * 2] = iv4;
          cdw[nbLines * 2 + 1] = iv1;
          nbLines++;
        }
      }
      return useDrawArrays ? this.drawArraysWireframe_ : this.drawElementsWireframe_;
    }
  };

  return WireframeData;
});