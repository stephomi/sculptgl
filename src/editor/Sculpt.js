define([
  'lib/glMatrix',
  'math3d/Geometry',
  'misc/Tablet',
  'object/Mesh',
  'states/StateGeometry',
  'states/StateColor'
], function (glmatrix, Geometry, Tablet, Mesh, StateGeometry, StateColor) {

  'use strict';

  var vec2 = glmatrix.vec2;
  var vec3 = glmatrix.vec3;
  var mat4 = glmatrix.mat4;
  var quat = glmatrix.quat;

  function Sculpt(states) {
    this.states_ = states; //for undo-redo
    this.multimesh_ = null; //mesh
    this.intensity_ = 0.75; //deformation intensity
    this.tool_ = Sculpt.tool.BRUSH; //sculpting mode
    this.detailSubdivision_ = 0.75; //maximal edge length before we subdivide it
    this.detailDecimation_ = 0.1; //minimal edge length before we collapse it (dependent of detailSubdivision_)
    this.negative_ = false; //opposition deformation
    this.clay_ = true; //clay sculpting (modifier for brush tool)
    this.culling_ = false; //if we backface cull the vertices
    this.color_ = [168.0, 66.0, 66.0]; //color painting

    //rotate stuffs
    this.rotateData_ = {
      normal: [0.0, 0.0, 0.0], //normal of rotation plane
      center: [0.0, 0.0] //2D center of rotation 
    };
    this.rotateDataSym_ = {
      normal: [0.0, 0.0, 0.0], //normal of rotation plane
      center: [0.0, 0.0] //2D center of rotation 
    };

    //drag stuffs
    this.dragDir_ = [0.0, 0.0, 0.0]; //direction of deformation
    this.dragDirSym_ = [0.0, 0.0, 0.0]; //direction of deformation
  }

  //the sculpting tools
  Sculpt.tool = {
    BRUSH: 0,
    INFLATE: 1,
    ROTATE: 2,
    SMOOTH: 3,
    FLATTEN: 4,
    PINCH: 5,
    CREASE: 6,
    DRAG: 7,
    COLOR: 8,
    SCALE: 9,
    CUT: 10
  };

  Sculpt.prototype = {
    startSculpt: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var multimesh = sculptgl.multimesh_;
      var mesh = multimesh.getCurrent();
      var picking = sculptgl.picking_;
      picking.intersectionMouseMesh(multimesh, mouseX, mouseY);
      if (picking.multimesh_ !== null)
        this.states_.pushState(this.tool_ === Sculpt.tool.COLOR ? new StateColor(mesh) : new StateGeometry(mesh));
    },
    /** Make a brush stroke */
    sculptStroke: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      if (this.tool_ === Sculpt.tool.ROTATE)
        return this.sculptStrokeRotate(mouseX, mouseY, sculptgl);
      else if (this.tool_ === Sculpt.tool.SCALE)
        return this.sculptStrokeScale(mouseX, mouseY, sculptgl);
      var ptPlane = sculptgl.ptPlane_;
      var nPlane = sculptgl.nPlane_;
      var picking = sculptgl.picking_;
      var pickingSym = sculptgl.pickingSym_;
      var lx = sculptgl.lastMouseX_;
      var ly = sculptgl.lastMouseY_;
      var dx = mouseX - lx;
      var dy = mouseY - ly;
      var dist = Math.sqrt(dx * dx + dy * dy);
      sculptgl.sumDisplacement_ += dist;
      var sumDisp = sculptgl.sumDisplacement_;
      var minSpacing = 0.15 * picking.rDisplay_;
      var step = dist / Math.floor(dist / minSpacing);
      dx /= dist;
      dy /= dist;
      if (!sculptgl.continuous_) {
        mouseX = lx;
        mouseY = ly;
      } else {
        sumDisp = 0.0;
        dist = 0.0;
      }
      var multimesh = sculptgl.multimesh_;
      var sym = sculptgl.symmetry_;
      var drag = this.tool_ === Sculpt.tool.DRAG;
      if (drag) {
        minSpacing = 0.0;
        if (picking.multimesh_ === null)
          return;
        picking.multimesh_ = pickingSym.multimesh_ = multimesh;
        vec3.copy(pickingSym.interPoint_, picking.interPoint_);
        Geometry.mirrorPoint(pickingSym.interPoint_, ptPlane, nPlane);
      }
      if (sumDisp > minSpacing * 100.0 && !drag)
        sumDisp = 0.0;
      else if (sumDisp > minSpacing || sumDisp === 0.0) {
        sumDisp = 0.0;
        for (var i = 0; i <= dist; i += step) {
          if (drag)
            this.updateDragDir(multimesh, picking, mouseX, mouseY);
          else
            picking.intersectionMouseMesh(multimesh, mouseX, mouseY);
          if (!picking.multimesh_)
            break;
          picking.pickVerticesInSphere(picking.rLocalSqr_);
          this.sculptMesh(picking);
          if (sym) {
            if (drag)
              this.updateDragDir(multimesh, pickingSym, mouseX, mouseY, ptPlane, nPlane);
            else
              pickingSym.intersectionMouseMesh(multimesh, mouseX, mouseY, ptPlane, nPlane);
            if (!pickingSym.multimesh_)
              break;
            pickingSym.rLocalSqr_ = picking.rLocalSqr_;
            pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
            this.sculptMesh(pickingSym, true);
          }
          mouseX += dx * step;
          mouseY += dy * step;
        }
        sculptgl.multimesh_.updateBuffers(this.tool_ === Sculpt.tool.COLOR);
      }
      sculptgl.sumDisplacement_ = sumDisp;
    },
    /** Make a brush scale stroke */
    sculptStrokeScale: function (mouseX, mouseY, sculptgl) {
      if (sculptgl.picking_.multimesh_) {
        sculptgl.picking_.pickVerticesInSphere(sculptgl.picking_.rLocalSqr_);
        this.sculptMesh(sculptgl.picking_, false, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
        if (sculptgl.symmetry_) {
          sculptgl.pickingSym_.pickVerticesInSphere(sculptgl.pickingSym_.rLocalSqr_);
          this.sculptMesh(sculptgl.pickingSym_, true, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
        }
        sculptgl.multimesh_.updateBuffers();
      }
    },
    /** Make a brush rotate stroke */
    sculptStrokeRotate: function (mouseX, mouseY, sculptgl) {
      if (sculptgl.picking_.multimesh_) {
        sculptgl.picking_.pickVerticesInSphere(sculptgl.picking_.rLocalSqr_);
        this.sculptMesh(sculptgl.picking_, false, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
        if (sculptgl.symmetry_) {
          sculptgl.pickingSym_.pickVerticesInSphere(sculptgl.pickingSym_.rLocalSqr_);
          this.sculptMesh(sculptgl.pickingSym_, true, sculptgl.lastMouseX_, sculptgl.lastMouseY_, mouseX, mouseY);
        }
        sculptgl.multimesh_.updateBuffers();
      }
    },
    /** Sculpt the mesh */
    sculptMesh: function (picking, sym, mouseX, mouseY, lastMouseX, lastMouseY) {
      var mesh = this.multimesh_.getCurrent();
      var iVertsSelected = picking.pickedVertices_;
      var radiusSquared = picking.rLocalSqr_;
      var center = picking.interPoint_;
      var eyeDir = picking.eyeDir_;
      var vertSculptFlags = mesh.vertSculptFlags_;
      var intensity = this.intensity_ * Tablet.getPressureIntensity();

      //undo-redo
      this.states_.pushVertices(iVertsSelected, this.tool_ === Sculpt.tool.COLOR);

      var nbVertsSelected = iVertsSelected.length;
      var iVertsInRadius = [];
      var iVertsFront = [];
      var sculptFlag = Mesh.SCULPT_FLAG;
      var nAr = mesh.normalsXYZ_;
      var eyeX = eyeDir[0];
      var eyeY = eyeDir[1];
      var eyeZ = eyeDir[2];
      for (var i = 0; i < nbVertsSelected; ++i) {
        var id = iVertsSelected[i];
        if (vertSculptFlags[id] === sculptFlag) {
          iVertsInRadius.push(id);
          var j = id * 3;
          if ((nAr[j] * eyeX + nAr[j + 1] * eyeY + nAr[j + 2] * eyeZ) <= 0.0)
            iVertsFront.push(id);
        }
      }
      //no sculpting if we are only picking back-facing vertices
      if (iVertsFront.length !== 0) {
        if (this.culling_)
          iVertsInRadius = iVertsFront;

        switch (this.tool_) {
        case Sculpt.tool.BRUSH:
          this.brush(center, iVertsInRadius, iVertsFront, radiusSquared, intensity);
          break;
        case Sculpt.tool.INFLATE:
          this.inflate(center, iVertsInRadius, radiusSquared, intensity);
          break;
        case Sculpt.tool.ROTATE:
          this.rotate(center, iVertsInRadius, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, sym);
          break;
        case Sculpt.tool.SMOOTH:
          this.smooth(iVertsInRadius, intensity);
          break;
        case Sculpt.tool.FLATTEN:
          this.flatten(center, iVertsInRadius, iVertsFront, radiusSquared, intensity);
          break;
        case Sculpt.tool.PINCH:
          this.pinch(center, iVertsInRadius, radiusSquared, intensity);
          break;
        case Sculpt.tool.CREASE:
          this.crease(center, iVertsInRadius, iVertsFront, radiusSquared, intensity);
          break;
        case Sculpt.tool.DRAG:
          this.drag(center, iVertsInRadius, radiusSquared, sym);
          break;
        case Sculpt.tool.COLOR:
          this.paint(center, iVertsInRadius, radiusSquared);
          break;
        case Sculpt.tool.SCALE:
          this.scale(center, iVertsInRadius, radiusSquared, mouseX - lastMouseX);
          break;
        }
      }

      this.multimesh_.updateMesh(mesh.getTrianglesFromVertices(iVertsSelected), iVertsSelected);
    },
    /** Brush stroke, move vertices along a direction computed by their averaging normals */
    brush: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity) {
      var aNormal = this.areaNormal(iVertsFront);
      if (!aNormal)
        return;
      var aCenter = this.areaCenter(iVertsFront);
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var deformIntensityBrush = intensity * radius * 0.1;
      var deformIntensityFlatten = this.clay_ ? intensity : intensity * 0.3;
      if (this.negative_)
        deformIntensityBrush = -deformIntensityBrush;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var ax = aCenter[0];
      var ay = aCenter[1];
      var az = aCenter[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= (distToPlane * deformIntensityFlatten - deformIntensityBrush);
        vAr[ind] -= anx * fallOff;
        vAr[ind + 1] -= any * fallOff;
        vAr[ind + 2] -= anz * fallOff;
      }
    },
    /** Inflate a group of vertices */
    inflate: function (center, iVerts, radiusSquared, intensity) {
      var mesh = this.multimesh_.getCurrent();
      var vAr = mesh.verticesXYZ_;
      var nAr = mesh.normalsXYZ_;
      var nbVerts = iVerts.length;
      var radius = Math.sqrt(radiusSquared);
      var deformIntensity = intensity * radius * 0.1;
      if (this.negative_)
        deformIntensity = -deformIntensity;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff = deformIntensity * fallOff;
        var nx = nAr[ind];
        var ny = nAr[ind + 1];
        var nz = nAr[ind + 2];
        fallOff /= Math.sqrt(nx * nx + ny * ny + nz * nz);
        vAr[ind] += nx * fallOff;
        vAr[ind + 1] += ny * fallOff;
        vAr[ind + 2] += nz * fallOff;
      }
    },
    /** Start a sculpt sculpt stroke */
    startScale: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.picking_;
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, this.multimesh_.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      picking.intersectionRayMesh(this.multimesh_, vNear, vFar, mouseX, mouseY, 1.0);
      if (!picking.multimesh_)
        return;
      picking.pickVerticesInSphere(picking.rLocalSqr_);
      if (sculptgl.symmetry_) {
        var pickingSym = sculptgl.pickingSym_;
        var ptPlane = sculptgl.ptPlane_;
        var nPlane = sculptgl.nPlane_;
        var vNearSym = [vNear[0], vNear[1], vNear[2]];
        Geometry.mirrorPoint(vNearSym, ptPlane, nPlane);
        var vFarSym = [vFar[0], vFar[1], vFar[2]];
        Geometry.mirrorPoint(vFarSym, ptPlane, nPlane);
        pickingSym.intersectionRayMesh(this.multimesh_, vNearSym, vFarSym, mouseX, mouseY, 1.0);
        if (!pickingSym.multimesh_)
          return;
        pickingSym.rLocalSqr_ = picking.rLocalSqr_;
        pickingSym.pickVerticesInSphere(pickingSym.rLocalSqr_);
      }
    },
    /** Scale the vertices around the mouse point intersection */
    scale: function (center, iVerts, radiusSquared, intensity) {
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var deltaScale = intensity * 0.01;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVerts.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= deltaScale;
        vAr[ind] += dx * fallOff;
        vAr[ind + 1] += dy * fallOff;
        vAr[ind + 2] += dz * fallOff;
      }
    },
    /** Start a rotate sculpt stroke */
    startRotate: function (sculptgl) {
      var mouseX = sculptgl.mouseX_;
      var mouseY = sculptgl.mouseY_;
      var picking = sculptgl.picking_;
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, this.multimesh_.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      this.initRotateData(picking, vNear, vFar, mouseX, mouseY, this.rotateData_);
      if (sculptgl.symmetry_) {
        var pickingSym = sculptgl.pickingSym_;
        var ptPlane = sculptgl.ptPlane_;
        var nPlane = sculptgl.nPlane_;
        var vNearSym = [vNear[0], vNear[1], vNear[2]];
        Geometry.mirrorPoint(vNearSym, ptPlane, nPlane);
        var vFarSym = [vFar[0], vFar[1], vFar[2]];
        Geometry.mirrorPoint(vFarSym, ptPlane, nPlane);
        this.initRotateData(pickingSym, vNearSym, vFarSym, mouseX, mouseY, this.rotateDataSym_);
        pickingSym.rLocalSqr_ = picking.rLocalSqr_;
      }
    },
    /** Set a few infos that will be needed for the rotate function afterwards */
    initRotateData: function (picking, vNear, vFar, mouseX, mouseY, rotateData) {
      picking.intersectionRayMesh(this.multimesh_, vNear, vFar, mouseX, mouseY, 1.0);
      if (!picking.multimesh_)
        return;
      picking.pickVerticesInSphere(picking.rLocalSqr_);
      var ray = [0.0, 0.0, 0.0];
      vec3.sub(ray, vNear, vFar);
      rotateData.normal = vec3.normalize(ray, ray);
      rotateData.center = [mouseX, mouseY];
    },
    /** Rotate the vertices around the mouse point intersection */
    rotate: function (center, iVerts, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, sym) {
      var rotateData = this.rotateData_;
      if (sym)
        rotateData = this.rotateDataSym_;
      var mouseCenter = rotateData.center;
      var vecMouse = [mouseX - mouseCenter[0], mouseY - mouseCenter[1]];
      if (vec2.len(vecMouse) < 30)
        return;
      vec2.normalize(vecMouse, vecMouse);
      var nPlane = rotateData.normal;
      var rot = [0.0, 0.0, 0.0, 0.0];
      var vecOldMouse = [lastMouseX - mouseCenter[0], lastMouseY - mouseCenter[1]];
      vec2.normalize(vecOldMouse, vecOldMouse);
      var angle = Geometry.signedAngle2d(vecMouse, vecOldMouse);
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVerts.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        var coord = [vAr[ind], vAr[ind + 1], vAr[ind + 2]];
        quat.setAxisAngle(rot, nPlane, angle * fallOff);
        vec3.sub(coord, coord, center);
        vec3.transformQuat(coord, coord, rot);
        vec3.add(coord, coord, center);
        vAr[ind] = coord[0];
        vAr[ind + 1] = coord[1];
        vAr[ind + 2] = coord[2];
      }
    },
    /** Smooth a group of vertices. New position is given by simple averaging */
    smooth: function (iVerts, intensity) {
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
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
    /** Flatten, projection of the sculpting vertex onto a plane defined by the barycenter and normals of all the sculpting vertices */
    flatten: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity) {
      var aNormal = this.areaNormal(iVertsFront);
      if (!aNormal)
        return;
      var aCenter = this.areaCenter(iVertsFront);
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var deformIntensity = intensity * 0.3;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var ax = aCenter[0];
      var ay = aCenter[1];
      var az = aCenter[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
        var dx = vx - cx;
        var dy = vy - cy;
        var dz = vz - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= distToPlane * deformIntensity;
        vAr[ind] -= anx * fallOff;
        vAr[ind + 1] -= any * fallOff;
        vAr[ind + 2] -= anz * fallOff;
      }
    },
    /** Pinch, vertices gather around intersection point */
    pinch: function (center, iVertsInRadius, radiusSquared, intensity) {
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var deformIntensity = intensity * 0.05;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = cx - vx;
        var dy = cy - vy;
        var dz = cz - vz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff = deformIntensity * fallOff;
        vAr[ind] += dx * fallOff;
        vAr[ind + 1] += dy * fallOff;
        vAr[ind + 2] += dz * fallOff;
      }
    },
    /** Pinch+brush-like sculpt */
    crease: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity) {
      var aNormal = this.areaNormal(iVertsFront);
      if (!aNormal)
        return;
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var radius = Math.sqrt(radiusSquared);
      var nbVerts = iVertsInRadius.length;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var anx = aNormal[0];
      var any = aNormal[1];
      var anz = aNormal[2];
      var deformIntensity = intensity * 0.05;
      var brushFactor = deformIntensity * radius;
      if (this.negative_)
        brushFactor = -brushFactor;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVertsInRadius[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var dx = cx - vx;
        var dy = cy - vy;
        var dz = cz - vz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        var brushModifier = Math.pow(2.0 - fallOff, -5) * brushFactor;
        fallOff = fallOff * deformIntensity;
        vAr[ind] += dx * fallOff + anx * brushModifier;
        vAr[ind + 1] += dy * fallOff + any * brushModifier;
        vAr[ind + 2] += dz * fallOff + anz * brushModifier;
      }
    },
    /** Set a few infos that will be needed for the drag function afterwards */
    updateDragDir: function (multimesh, picking, mouseX, mouseY, ptPlane, nPlane) {
      var vNear = picking.camera_.unproject(mouseX, mouseY, 0.0);
      var vFar = picking.camera_.unproject(mouseX, mouseY, 1.0);
      var matInverse = mat4.create();
      mat4.invert(matInverse, multimesh.getMatrix());
      vec3.transformMat4(vNear, vNear, matInverse);
      vec3.transformMat4(vFar, vFar, matInverse);
      var dir = this.dragDir_;
      if (ptPlane) {
        dir = this.dragDirSym_;
        Geometry.mirrorPoint(vNear, ptPlane, nPlane);
        Geometry.mirrorPoint(vFar, ptPlane, nPlane);
      }
      var center = picking.interPoint_;
      picking.interPoint_ = Geometry.vertexOnLine(center, vNear, vFar);
      vec3.sub(dir, picking.interPoint_, center);
      picking.multimesh_ = multimesh;
      picking.computeRadiusWorldSq(mouseX, mouseY);
      var eyeDir = picking.eyeDir_;
      vec3.sub(eyeDir, vFar, vNear);
      vec3.normalize(eyeDir, eyeDir);
    },
    /** Drag deformation */
    drag: function (center, iVerts, radiusSquared, sym) {
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
      var nbVerts = iVerts.length;
      var radius = Math.sqrt(radiusSquared);
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var dir = sym ? this.dragDirSym_ : this.dragDir_;
      var dirx = dir[0];
      var diry = dir[1];
      var dirz = dir[2];
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        vAr[ind] += dirx * fallOff;
        vAr[ind + 1] += diry * fallOff;
        vAr[ind + 2] += dirz * fallOff;
      }
    },
    /** Paint color vertices */
    paint: function (center, iVerts, radiusSquared) {
      var mesh = this.multimesh_.getCurrent();
      var vAr = mesh.verticesXYZ_;
      var cAr = mesh.colorsRGB_;
      var color = this.color_;
      var radius = Math.sqrt(radiusSquared);
      var cr = color[0] / 255.0;
      var cg = color[1] / 255.0;
      var cb = color[2] / 255.0;
      var cx = center[0];
      var cy = center[1];
      var cz = center[2];
      var intensity = this.intensity_;
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var dx = vAr[ind] - cx;
        var dy = vAr[ind + 1] - cy;
        var dz = vAr[ind + 2] - cz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
        var fallOff = dist * dist;
        fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
        fallOff *= intensity;
        var fallOffCompl = 1.0 - fallOff;
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
      }
    },
    /** Smooth a group of vertices along the plane defined by the normal of the vertex */
    smoothFlat: function (iVerts, intensity) {
      var mesh = this.multimesh_.getCurrent();
      var vAr = mesh.verticesXYZ_;
      var nAr = mesh.normalsXYZ_;
      var nbVerts = iVerts.length;
      var smoothVerts = new Float32Array(nbVerts * 3);
      this.laplacianSmooth(iVerts, smoothVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        var vx = vAr[ind];
        var vy = vAr[ind + 1];
        var vz = vAr[ind + 2];
        var nx = nAr[ind];
        var ny = nAr[ind + 1];
        var nz = nAr[ind + 2];
        var i3 = i * 3;
        var smx = smoothVerts[i3];
        var smy = smoothVerts[i3 + 1];
        var smz = smoothVerts[i3 + 2];
        var dot = nx * (smx - vx) + ny * (smy - vy) + nz * (smz - vz);
        vAr[ind] += (smx - nx * dot - vx) * intensity;
        vAr[ind + 1] += (smy - ny * dot - vy) * intensity;
        vAr[ind + 2] += (smz - nz * dot - vz) * intensity;
      }
    },
    /** Laplacian smooth. Special rule for vertex on the edge of the mesh. */
    laplacianSmooth: function (iVerts, smoothVerts) {
      var mesh = this.multimesh_.getCurrent();
      var vrrStartCount = mesh.vrrStartCount_;
      var vertRingVert = mesh.vertRingVert_;
      var vertOnEdge = mesh.vertOnEdge_;
      var vAr = mesh.verticesXYZ_;
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
    },
    /** Compute average normal of a group of vertices with culling */
    areaNormal: function (iVerts) {
      var nAr = this.multimesh_.getCurrent().normalsXYZ_;
      var nbVerts = iVerts.length;
      var anx = 0.0;
      var any = 0.0;
      var anz = 0.0;
      for (var i = 0; i < nbVerts; ++i) {
        var ind = iVerts[i] * 3;
        anx += nAr[ind];
        any += nAr[ind + 1];
        anz += nAr[ind + 2];
      }
      var len = Math.sqrt(anx * anx + any * any + anz * anz);
      if (len === 0.0)
        return null;
      len = 1.0 / len;
      return [anx * len, any * len, anz * len];
    },
    /** Compute average center of a group of vertices (with culling) */
    areaCenter: function (iVerts) {
      var vAr = this.multimesh_.getCurrent().verticesXYZ_;
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
    }
  };

  return Sculpt;
});