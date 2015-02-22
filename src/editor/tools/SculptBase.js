define([
  'misc/Utils'
], function (Utils) {

  'use strict';

  var SculptBase = function (states) {
    this.states_ = states; // for undo-redo
    this.mesh_ = null; // the current edited mesh
    this.lastMouseX_ = 0.0;
    this.lastMouseY_ = 0.0;
  };

  SculptBase.prototype = {
    /** Start sculpting */
    start: function (main) {
      var picking = main.getPicking();
      picking.intersectionMouseMeshes(main.getMeshes(), main.mouseX_, main.mouseY_);
      var mesh = picking.getMesh();
      if (!mesh)
        return;
      picking.initAlpha();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;
      if (pickingSym) {
        pickingSym.intersectionMouseMesh(mesh, main.mouseX_, main.mouseY_);
        pickingSym.initAlpha();
      }
      if (main.getMesh() !== mesh) {
        main.mesh_ = mesh;
        main.getGui().updateMesh();
      }
      this.mesh_ = mesh;
      this.pushState();
      this.lastMouseX_ = main.mouseX_;
      this.lastMouseY_ = main.mouseY_;
      this.startSculpt(main);
    },
    /** End sculpting */
    end: function () {
      if (this.mesh_) {
        this.updateMeshBuffers();
        this.mesh_.checkLeavesUpdate();
      }
    },
    endTransform: function () {
      var mesh = this.mesh_;
      if (!mesh)
        return;
      var em = mesh.getEditMatrix();
      // check identity
      if ((em[0] * em[5] * em[10]) === 1.0 && em[12] === 0.0 && em[13] === 0.0 && em[14] === 0.0)
        return;
      var iVerts = this.getUnmaskedVertices();
      this.states_.pushVertices(iVerts);

      this.applyEditMatrix(iVerts);
      if (iVerts.length === 0) return;
      this.updateMeshBuffers();
    },
    /** Push undo operation */
    pushState: function () {
      this.states_.pushStateGeometry(this.mesh_);
    },
    /** Start sculpting operation */
    startSculpt: function (main) {
      if (this.lockPosition_ === true)
        return;
      this.sculptStroke(main);
    },
    /** Update sculpting operation */
    update: function (main) {
      if (this.lockPosition_ === true)
        return this.updateSculptLock(main);
      this.sculptStroke(main);
    },
    /** Update lock position */
    updateSculptLock: function (main) {
      this.states_.getCurrentState().undo(); // I can't believe it actually worked

      var picking = main.getPicking();
      var origRad = picking.getScreenRadius();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;

      var dx = main.mouseX_ - this.lastMouseX_;
      var dy = main.mouseY_ - this.lastMouseY_;
      picking.rDisplay_ = Math.sqrt(dx * dx + dy * dy);
      // it's a bit hacky... I just simulate another stroke with a very small offset
      // so that the stroke still has a direction (the mask can be rotated correctly then)
      var offx = dx / picking.rDisplay_;
      var offy = dy / picking.rDisplay_;
      this.makeStroke(this.lastMouseX_ + offx * 1e-3, this.lastMouseY_ + offy * 1e-3, picking, pickingSym);
      picking.rDisplay_ = origRad;

      this.updateRender(main);
      main.getCanvas().style.cursor = 'default';
    },
    /** Make a brush stroke */
    sculptStroke: function (main) {
      var picking = main.getPicking();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;

      var dx = main.mouseX_ - this.lastMouseX_;
      var dy = main.mouseY_ - this.lastMouseY_;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var minSpacing = 0.15 * picking.getScreenRadius();

      if (dist <= minSpacing)
        return;

      var step = 1.0 / Math.floor(dist / minSpacing);
      dx *= step;
      dy *= step;
      var mouseX = this.lastMouseX_ + dx;
      var mouseY = this.lastMouseY_ + dy;

      for (var i = step; i <= 1.0; i += step) {
        if (!this.makeStroke(mouseX, mouseY, picking, pickingSym))
          break;
        mouseX += dx;
        mouseY += dy;
      }

      this.updateRender(main);

      this.lastMouseX_ = main.mouseX_;
      this.lastMouseY_ = main.mouseY_;
    },
    updateRender: function (main) {
      this.updateMeshBuffers();
      main.render();
    },
    makeStroke: function (mouseX, mouseY, picking, pickingSym) {
      var mesh = this.mesh_;
      picking.intersectionMouseMesh(mesh, mouseX, mouseY);
      var pick1 = picking.getMesh();
      if (pick1) {
        picking.pickVerticesInSphere(picking.getLocalRadius2());
        picking.computePickedNormal();
      }
      // if dyn topo, we need to the picking and the sculpting altogether
      var dynTopo = mesh.getDynamicTopology && !this.lockPosition_;
      if (dynTopo && pick1)
        this.stroke(picking, false);

      var pick2;
      if (pickingSym) {
        pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY);
        pick2 = pickingSym.getMesh();
        if (pick2) {
          pickingSym.setLocalRadius2(picking.getLocalRadius2());
          pickingSym.pickVerticesInSphere(pickingSym.getLocalRadius2());
          pickingSym.computePickedNormal();
        }
      }

      if (!dynTopo && pick1) this.stroke(picking, false);
      if (pick2) this.stroke(pickingSym, true);
      return pick1 || pick2;
    },
    updateMeshBuffers: function () {
      if (this.mesh_.getDynamicTopology)
        this.mesh_.updateBuffers();
      else
        this.mesh_.updateGeometryBuffers();
    },
    updateContinuous: function (main) {
      var picking = main.getPicking();
      var pickingSym = main.getSculpt().getSymmetry() ? main.getPickingSymmetry() : null;
      this.makeStroke(main.mouseX_, main.mouseY_, picking, pickingSym);
      this.updateRender(main);
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
      var mAr = this.mesh_.getMaterials();
      var anx = 0.0;
      var any = 0.0;
      var anz = 0.0;
      for (var i = 0, l = iVerts.length; i < l; ++i) {
        var ind = iVerts[i] * 3;
        var f = mAr[ind + 2];
        anx += nAr[ind] * f;
        any += nAr[ind + 1] * f;
        anz += nAr[ind + 2] * f;
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
      var mAr = this.mesh_.getMaterials();
      var nbVerts = iVerts.length;
      var ax = 0.0;
      var ay = 0.0;
      var az = 0.0;
      var acc = 0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var f = mAr[ind + 2];
        acc += f;
        ax += vAr[ind] * f;
        ay += vAr[ind + 1] * f;
        az += vAr[ind + 2] * f;
      }
      return [ax / acc, ay / acc, az / acc];
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
    laplacianSmooth: function (iVerts, smoothVerts, vField) {
      var mesh = this.mesh_;
      var vrvStartCount = mesh.getVerticesRingVertStartCount();
      var vertRingVert = mesh.getVerticesRingVert();
      var ringVerts = vertRingVert instanceof Array ? vertRingVert : null;
      var vertOnEdge = mesh.getVerticesOnEdge();
      var vAr = vField || mesh.getVertices();
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
    },
    getUnmaskedVertices: function () {
      return this.filterMaskedVertices(0.0, Infinity);
    },
    getMaskedVertices: function () {
      return this.filterMaskedVertices(-Infinity, 1.0);
    },
    filterMaskedVertices: function (lowerBound, upperBound) {
      var lb = lowerBound === undefined ? -Infinity : lowerBound;
      var ub = upperBound === undefined ? Infinity : upperBound;
      var nbVertices = this.mesh_.getNbVertices();
      var cleaned = new Uint32Array(Utils.getMemory(4 * nbVertices), 0, nbVertices);
      var mAr = this.mesh_.getMaterials();
      var acc = 0;
      for (var i = 0; i < nbVertices; ++i) {
        var mask = mAr[i * 3 + 2];
        if (mask > lb && mask < ub)
          cleaned[acc++] = i;
      }
      return new Uint32Array(cleaned.subarray(0, acc));
    },
  };

  return SculptBase;
});