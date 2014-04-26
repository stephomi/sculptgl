define([
  'misc/Tablet',
  'editor/tools/SculptUtils',
  'states/StateGeometry'
], function (Tablet, SculptUtils, StateGeometry) {

  'use strict';

  function Pinch(states) {
    this.states_ = states; //for undo-redo
    this.mesh_ = null; //the current edited mesh
    this.intensity_ = 0.75; //deformation intensity
    this.culling_ = false; //if we backface cull the vertices
  }

  Pinch.prototype = {
    /** Start sculpting operation */
    start: function (sculptgl) {
      var picking = sculptgl.scene_.picking_;
      var mesh = sculptgl.mesh_;
      picking.intersectionMouseMesh(mesh, sculptgl.mouseX_, sculptgl.mouseY_);
      if (picking.mesh_ === null)
        return;
      this.states_.pushState(new StateGeometry(mesh));
      this.mesh_ = mesh;
      this.update(sculptgl);
    },
    /** Update sculpting operation */
    update: function (sculptgl) {
      SculptUtils.sculptStroke(sculptgl, this.mesh_, this.stroke.bind(this));
    },
    /** On stroke */
    stroke: function (picking) {
      var mesh = this.mesh_;
      var iVertsInRadius = picking.pickedVertices_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsInRadius);

      if (this.culling_)
        iVertsInRadius = SculptUtils.getFrontVertices(mesh, iVertsInRadius, picking.eyeDir_);

      this.smooth(mesh, iVertsInRadius, intensity);

      this.mesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsInRadius), iVertsInRadius);
    },
    /** Smooth a group of vertices. New position is given by simple averaging */
    smooth: function (mesh, iVerts, intensity) {
      var vAr = mesh.getVertices();
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(mesh, iVerts, smoothVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var i3 = i * 3;
        var dx = (smoothVerts[i3] - vAr[ind]) * intensity;
        var dy = (smoothVerts[i3 + 1] - vAr[ind + 1]) * intensity;
        var dz = (smoothVerts[i3 + 2] - vAr[ind + 2]) * intensity;
        vAr[ind] += dx;
        vAr[ind + 1] += dy;
        vAr[ind + 2] += dz;
      }
    },
    /** Laplacian smooth. Special rule for vertex on the edge of the mesh. */
    laplacianSmooth: function (mesh, iVerts, smoothVerts) {
      var vrrStartCount = mesh.getVertRingVertStartCount();
      var vertRingVert = mesh.getVertRingVert();
      var vertOnEdge = mesh.getVerticesOnEdge();
      var vAr = mesh.getVertices();
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var i3 = i * 3;
        var id = iVerts[i];
        var start = vrrStartCount[id * 2];
        var count = vrrStartCount[id * 2 + 1];
        var avx = 0.0;
        var avy = 0.0;
        var avz = 0.0;
        var j = 0;
        var ind = 0;
        if (vertOnEdge[id] === 1) {
          var nbVertEdge = 0;
          for (j = 0; j < count; ++j) {
            ind = vertRingVert[start + j];
            //we average only with vertices that are also on the edge
            if (vertOnEdge[ind] === 1) {
              ind *= 3;
              avx += vAr[ind];
              avy += vAr[ind + 1];
              avz += vAr[ind + 2];
              ++nbVertEdge;
            }
          }
          count = nbVertEdge;
        } else {
          for (j = 0; j < count; ++j) {
            ind = vertRingVert[start + j] * 3;
            avx += vAr[ind];
            avy += vAr[ind + 1];
            avz += vAr[ind + 2];
          }
        }
        smoothVerts[i3] = avx / count;
        smoothVerts[i3 + 1] = avy / count;
        smoothVerts[i3 + 2] = avz / count;
      }
    }
    // /** Smooth a group of vertices. New position is given by simple averaging */
    // smoothFlat: function (mesh, iVerts, intensity) {
    //   var vAr = mesh.getVertices();
    //   var nbVerts = iVerts.length;
    //   var smoothVerts = new Float32Array(nbVerts * 3);
    //   this.laplacianSmooth(iVerts, smoothVerts);
    //   for (var i = 0; i < nbVerts; ++i) {
    //     var ind = iVerts[i] * 3;
    //     var i3 = i * 3;
    //     var dx = (smoothVerts[i3] - vAr[ind]) * intensity;
    //     var dy = (smoothVerts[i3 + 1] - vAr[ind + 1]) * intensity;
    //     var dz = (smoothVerts[i3 + 2] - vAr[ind + 2]) * intensity;
    //     vAr[ind] += dx;
    //     vAr[ind + 1] += dy;
    //     vAr[ind + 2] += dz;
    //   }
    // },

  };

  return Pinch;
});