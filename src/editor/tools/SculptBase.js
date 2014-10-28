define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  function SculptBase(states) {
    this.states_ = states; // for undo-redo
    this.mesh_ = null; // the current edited mesh
  }

  SculptBase.prototype = {
    /** Start sculpting */
    start: function (main) {
      var picking = main.getPicking();
      picking.intersectionMouseMeshes(main.getMeshes(), main.mouseX_, main.mouseY_);
      var mesh = picking.getMesh();
      if (!mesh)
        return;
      if (main.getMesh() !== mesh) {
        main.mesh_ = mesh;
        main.getGui().updateMesh();
      }
      this.mesh_ = mesh;
      this.pushState();
      this.startSculpt(main);
    },
    /** Push undo operation */
    pushState: function () {
      this.states_.pushStateGeometry(this.mesh_);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      this.sculptStroke(main);
    },
    /** Update sculpting operation */
    update: function (main) {
      this.sculptStroke(main);
    },
    /** Make a brush stroke */
    sculptStroke: function (main, colorState) {
      var mesh = this.mesh_;
      var mouseX = main.mouseX_;
      var mouseY = main.mouseY_;
      var picking = main.getPicking();
      var pickingSym = main.getPickingSymmetry();
      var lx = main.lastMouseX_;
      var ly = main.lastMouseY_;
      var dx = mouseX - lx;
      var dy = mouseY - ly;
      var dist = Math.sqrt(dx * dx + dy * dy);
      main.sumDisplacement_ += dist;
      var sumDisp = main.sumDisplacement_;
      var minSpacing = 0.15 * picking.getScreenRadius();
      var step = dist / Math.floor(dist / minSpacing);
      dx /= dist;
      dy /= dist;
      if (!main.continuous_) {
        mouseX = lx;
        mouseY = ly;
      } else {
        sumDisp = 0.0;
        dist = 0.0;
      }
      var sym = main.getSculpt().getSymmetry();
      if (sumDisp > minSpacing || sumDisp === 0.0) {
        sumDisp = 0.0;
        for (var i = 0; i <= dist; i += step) {
          picking.intersectionMouseMesh(mesh, mouseX, mouseY);
          if (!picking.getMesh())
            break;
          picking.pickVerticesInSphere(picking.getLocalRadius2());
          this.stroke(picking);
          if (sym) {
            pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY, true);
            if (!pickingSym.getMesh())
              break;
            pickingSym.setLocalRadius2(picking.getLocalRadius2());
            pickingSym.pickVerticesInSphere(pickingSym.getLocalRadius2());
            this.stroke(pickingSym, true);
          }
          mouseX += dx * step;
          mouseY += dy * step;
        }
        if (main.getMesh().getDynamicTopology) {
          main.getMesh().updateBuffers();
        } else if (colorState) {
          main.getMesh().updateColorBuffer();
          main.getMesh().updateMaterialBuffer();
        } else {
          main.getMesh().updateGeometryBuffers();
        }
      }
      main.sumDisplacement_ = sumDisp;
    },
    /** Return the vertices that point toward the camera */
    getFrontVertices: function (iVertsInRadius, eyeDir) {
      var nbVertsSelected = iVertsInRadius.length;
      var iVertsFront = new Uint32Array(Utils.getMemory(4 * nbVertsSelected), 0, nbVertsSelected);
      var acc = 0;
      var nAr = this.mesh_.getNormals();
      var eyeX = eyeDir[0];
      var eyeY = eyeDir[1];
      var eyeZ = eyeDir[2];
      for (var i = 0; i < nbVertsSelected; ++i) {
        var id = iVertsInRadius[i];
        var j = id * 3;
        if ((nAr[j] * eyeX + nAr[j + 1] * eyeY + nAr[j + 2] * eyeZ) <= 0.0)
          iVertsFront[acc++] = id;
      }
      return new Uint32Array(iVertsFront.subarray(0, acc));
    },
    /** Compute average normal of a group of vertices with culling */
    areaNormal: function (iVerts) {
      var nAr = this.mesh_.getNormals();
      var anx = 0.0;
      var any = 0.0;
      var anz = 0.0;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        anx += nAr[ind];
        any += nAr[ind + 1];
        anz += nAr[ind + 2];
      }
      var len = Math.sqrt(anx * anx + any * any + anz * anz);
      if (len === 0.0)
        return;
      len = 1.0 / len;
      return [anx * len, any * len, anz * len];
    },
    /** Compute average center of a group of vertices (with culling) */
    areaCenter: function (iVerts) {
      var vAr = this.mesh_.getVertices();
      var nbVerts = iVerts.length;
      var ax = 0.0;
      var ay = 0.0;
      var az = 0.0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        ax += vAr[ind];
        ay += vAr[ind + 1];
        az += vAr[ind + 2];
      }
      return [ax / nbVerts, ay / nbVerts, az / nbVerts];
    },
    /** Updates the vertices original coords that are sculpted for the first time in this stroke */
    updateProxy: function (iVerts) {
      var mesh = this.mesh_;
      var vAr = mesh.getVertices();
      var vProxy = mesh.getVerticesProxy();
      if (vAr === vProxy)
        return;
      var vertStateFlags = mesh.getVerticesStateFlags();
      var stateFlag = Utils.STATE_FLAG;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var id = iVerts[i];
        if (vertStateFlags[id] !== stateFlag) {
          var ind = id * 3;
          vProxy[ind] = vAr[ind];
          vProxy[ind + 1] = vAr[ind + 1];
          vProxy[ind + 2] = vAr[ind + 2];
        }
      }
    },
    /** Laplacian smooth. Special rule for vertex on the edge of the mesh. */
    laplacianSmooth: function (iVerts, smoothVerts) {
      var mesh = this.mesh_;
      var vrvStartCount = mesh.getVerticesRingVertStartCount();
      var vertRingVert = mesh.getVerticesRingVert();
      var ringVerts = vertRingVert instanceof Array ? vertRingVert : null;
      var vertOnEdge = mesh.getVerticesOnEdge();
      var vAr = mesh.getVertices();
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var i3 = i * 3;
        var id = iVerts[i];
        var start, end;
        if (ringVerts) {
          vertRingVert = ringVerts[id];
          start = 0;
          end = vertRingVert.length;
        } else {
          start = vrvStartCount[id * 2];
          end = start + vrvStartCount[id * 2 + 1];
        }
        var avx = 0.0;
        var avy = 0.0;
        var avz = 0.0;
        var j = 0;
        var ind = 0;
        if (vertOnEdge[id] === 1) {
          var nbVertEdge = 0;
          for (j = start; j < end; ++j) {
            ind = vertRingVert[j];
            // we average only with vertices that are also on the edge
            if (vertOnEdge[ind] === 1) {
              ind *= 3;
              avx += vAr[ind];
              avy += vAr[ind + 1];
              avz += vAr[ind + 2];
              ++nbVertEdge;
            }
          }
          if (nbVertEdge >= 2) {
            smoothVerts[i3] = avx / nbVertEdge;
            smoothVerts[i3 + 1] = avy / nbVertEdge;
            smoothVerts[i3 + 2] = avz / nbVertEdge;
            continue;
          }
          avx = avy = avz = 0.0;
        }
        for (j = start; j < end; ++j) {
          ind = vertRingVert[j] * 3;
          avx += vAr[ind];
          avy += vAr[ind + 1];
          avz += vAr[ind + 2];
        }
        j = end - start;
        smoothVerts[i3] = avx / j;
        smoothVerts[i3 + 1] = avy / j;
        smoothVerts[i3 + 2] = avz / j;
      }
    },
    dynamicTopology: function (picking) {
      var mesh = this.mesh_;
      var iVerts = picking.getPickedVertices();
      if (!mesh.getDynamicTopology)
        return iVerts;
      if (iVerts.length === 0) {
        iVerts = mesh.getVerticesFromFaces([picking.getPickedFace()]);
        // undo-redo
        this.states_.pushVertices(iVerts);
      }

      var topo = mesh.getDynamicTopology();
      var subFactor = topo.getSubdivisionFactor();
      var decFactor = topo.getDecimationFactor();
      if (subFactor === 0.0 && decFactor === 0.0)
        return iVerts;

      var iFaces = mesh.getFacesFromVertices(iVerts);
      var radius2 = picking.getLocalRadius2();
      var center = picking.getIntersectionPoint();
      var d2Max = radius2 * (1.1 - subFactor) * 0.2;
      var d2Min = (d2Max / 4.2025) * decFactor;

      // undo-redo
      this.states_.pushFaces(iFaces);

      if (subFactor)
        iFaces = topo.subdivision(iFaces, center, radius2, d2Max, this.states_);
      if (decFactor)
        iFaces = topo.decimation(iFaces, center, radius2, d2Min, this.states_);
      iVerts = mesh.getVerticesFromFaces(iFaces);

      var nbVerts = iVerts.length;
      var sculptFlag = Utils.SCULPT_FLAG;
      var vscf = mesh.getVerticesSculptFlags();
      var iVertsInRadius = new Uint32Array(Utils.getMemory(nbVerts * 4), 0, nbVerts);
      var acc = 0;
      for (var i = 0; i < nbVerts; ++i) {
        var iVert = iVerts[i];
        if (vscf[iVert] === sculptFlag)
          iVertsInRadius[acc++] = iVert;
      }
      iVertsInRadius = new Uint32Array(iVertsInRadius.subarray(0, acc));
      mesh.updateTopology(iFaces);
      mesh.updateGeometry(iFaces, iVertsInRadius);
      return iVertsInRadius;
    }
  };

  return SculptBase;
});