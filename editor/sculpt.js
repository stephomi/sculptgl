'use strict';

function Sculpt(states)
{
  this.states_ = states; //for undo-redo
  this.mesh_ = null; //mesh
  this.intensity_ = 0.75; //deformation intensity
  this.tool_ = Sculpt.tool.BRUSH; //sculpting mode
  this.topo_ = Sculpt.topo.SUBDIVISION; //topological mode
  this.detailSubdivision_ = 0.75; //maximal edge length before we subdivide it
  this.detailDecimation_ = 0.1; //minimal edge length before we collapse it (dependent of detailSubdivision_)
  this.negative_ = false; //opposition deformation
  this.clay_ = false; //clay sculpting (modifier for brush tool)
  this.culling_ = false; //if we backface cull the vertices
  this.color_ = [168, 66, 66]; //color painting

  this.d2Min_ = 0; //uniform refinement of mesh (min edge length)
  this.d2Max_ = 0; //uniform refinement of mesh (max edge length)
  this.d2Thickness_ = 0.5; //distance between 2 vertices before split/merge
  this.d2Move_ = 0; //max displacement of vertices per step

  //rotate stuffs
  this.rotateData_ = {
    normal: [0, 0, 0], //normal of rotation plane
    center: [0, 0] //2D center of rotation 
  };
  this.rotateDataSym_ = {
    normal: [0, 0, 0], //normal of rotation plane
    center: [0, 0] //2D center of rotation 
  };

  //drag stuffs
  this.dragDir_ = [0, 0, 0]; //direction of deformation
  this.dragDirSym_ = [0, 0, 0]; //direction of deformation
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
  SCALE: 9
};

//the topological tools
Sculpt.topo = {
  STATIC: 0,
  SUBDIVISION: 1,
  ADAPTIVE: 2
};

Sculpt.prototype = {
  /** Set adaptive parameters */
  setAdaptiveParameters: function (radiusSquared)
  {
    this.d2Max_ = radiusSquared * (1.1 - this.detailSubdivision_) * 0.2;
    this.d2Min_ = this.d2Max_ / 4.2025;
    this.d2Move_ = this.d2Min_ * 0.2375;
    this.d2Thickness_ = (4.0 * this.d2Move_ + this.d2Max_ / 3.0) * 1.1;
  },

  /** Make a brush stroke */
  sculptStroke: function (mouseX, mouseY, pressureRadius, pressureIntensity, sculptgl)
  {
    if (this.tool_ === Sculpt.tool.ROTATE)
      return this.sculptStrokeRotate(mouseX, mouseY, pressureIntensity, sculptgl);
    else if (this.tool_ === Sculpt.tool.SCALE)
      return this.sculptStrokeScale(mouseX, mouseY, pressureIntensity, sculptgl);
    var ptPlane = sculptgl.ptPlane_,
      nPlane = sculptgl.nPlane_;
    var picking = sculptgl.picking_,
      pickingSym = sculptgl.pickingSym_;
    var lx = sculptgl.lastMouseX_,
      ly = sculptgl.lastMouseY_;
    var dx = mouseX - lx,
      dy = mouseY - ly;
    var dist = Math.sqrt(dx * dx + dy * dy);
    sculptgl.sumDisplacement_ += dist;
    var sumDisp = sculptgl.sumDisplacement_;
    var minSpacing = 0.2 * picking.rDisplay_;
    var step = dist / Math.floor(dist / minSpacing);
    dx /= dist;
    dy /= dist;
    if (!sculptgl.continuous_)
    {
      mouseX = lx;
      mouseY = ly;
    }
    else
    {
      sumDisp = 0;
      dist = 0;
    }
    var mesh = sculptgl.mesh_;
    var sym = sculptgl.symmetry_;
    var drag = this.tool_ === Sculpt.tool.DRAG;
    if (drag)
    {
      minSpacing = 0.0;
      picking.mesh_ = pickingSym.mesh_ = mesh;
      var inter = picking.interPoint_;
      var interSym = pickingSym.interPoint_;
      interSym[0] = inter[0];
      interSym[1] = inter[1];
      interSym[2] = inter[2];
      Geometry.mirrorPoint(interSym, ptPlane, nPlane);
    }
    if (sumDisp > minSpacing * 50.0 && !drag)
      sumDisp = 0;
    else if (sumDisp > minSpacing || sumDisp === 0)
    {
      sumDisp = 0;
      for (var i = 0; i <= dist; i += step)
      {
        if (drag)
          this.updateDragDir(mesh, picking, mouseX, mouseY, pressureRadius);
        else
          picking.intersectionMouseMesh(mesh, mouseX, mouseY, pressureRadius);
        if (!picking.mesh_)
          break;
        picking.pickVerticesInSphere(picking.rWorldSqr_);
        this.sculptMesh(picking, pressureIntensity);
        if (sym)
        {
          if (drag)
            this.updateDragDir(mesh, pickingSym, mouseX, mouseY, pressureRadius, ptPlane, nPlane);
          else
            pickingSym.intersectionMouseMesh(mesh, mouseX, mouseY, pressureRadius, ptPlane, nPlane);
          if (!pickingSym.mesh_)
            break;
          pickingSym.rWorldSqr_ = picking.rWorldSqr_;
          pickingSym.pickVerticesInSphere(pickingSym.rWorldSqr_);
          this.sculptMesh(pickingSym, pressureIntensity, true);
        }
        mouseX += dx * step;
        mouseY += dy * step;
      }
      this.mesh_.updateBuffers();
    }
    sculptgl.sumDisplacement_ = sumDisp;
  },

  /** Make a brush scale stroke */
  sculptStrokeScale: function (mouseX, mouseY, pressureIntensity, sculptgl)
  {
    if (sculptgl.picking_.mesh_)
    {
      sculptgl.picking_.pickVerticesInSphere(sculptgl.picking_.rWorldSqr_);
      this.sculptMesh(sculptgl.picking_, pressureIntensity, false, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
      if (sculptgl.symmetry_)
      {
        sculptgl.pickingSym_.pickVerticesInSphere(sculptgl.pickingSym_.rWorldSqr_);
        this.sculptMesh(sculptgl.pickingSym_, pressureIntensity, true, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
      }
      this.mesh_.updateBuffers();
    }
  },

  /** Make a brush rotate stroke */
  sculptStrokeRotate: function (mouseX, mouseY, pressureIntensity, sculptgl)
  {
    if (sculptgl.picking_.mesh_)
    {
      sculptgl.picking_.pickVerticesInSphere(sculptgl.picking_.rWorldSqr_);
      this.sculptMesh(sculptgl.picking_, pressureIntensity, false, mouseX, mouseY, sculptgl.lastMouseX_, sculptgl.lastMouseY_);
      if (sculptgl.symmetry_)
      {
        sculptgl.pickingSym_.pickVerticesInSphere(sculptgl.pickingSym_.rWorldSqr_);
        this.sculptMesh(sculptgl.pickingSym_, pressureIntensity, true, sculptgl.lastMouseX_, sculptgl.lastMouseY_, mouseX, mouseY);
      }
      this.mesh_.updateBuffers();
    }
  },

  /** Sculpt the mesh */
  sculptMesh: function (picking, pressureIntensity, sym, mouseX, mouseY, lastMouseX, lastMouseY)
  {
    var mesh = this.mesh_;
    var iVertsSelected = picking.pickedVertices_;
    var radiusSquared = picking.rWorldSqr_;
    var center = picking.interPoint_;
    var eyeDir = picking.eyeDir_;
    var vertices = mesh.vertices_;
    var iTris = mesh.getTrianglesFromVertices(iVertsSelected);
    var intensity = this.intensity_ * pressureIntensity;

    //undo-redo
    this.states_.pushState(iTris, iVertsSelected);

    var topo = new Topology(this.states_);
    topo.mesh_ = mesh;
    topo.radiusSquared_ = radiusSquared;
    topo.center_ = center;
    this.setAdaptiveParameters(radiusSquared);
    switch (this.topo_)
    {
    case Sculpt.topo.SUBDIVISION:
      if (this.detailSubdivision_ > 0)
        iTris = topo.subdivision(iTris, this.d2Max_);
      if (this.detailDecimation_ > 0)
        iTris = topo.decimation(iTris, this.d2Min_ * this.detailDecimation_);
      break;
    case Sculpt.topo.ADAPTIVE:
      iTris = topo.subdivision(iTris, this.d2Max_);
      iTris = topo.decimation(iTris, this.d2Min_);
      break;
    }

    iVertsSelected = mesh.getVerticesFromTriangles(iTris);
    var nbVertsSelected = iVertsSelected.length;
    var iVertsInRadius = [];
    var iVertsFront = [];
    var vertexSculptMask = Vertex.sculptMask_;
    var nAr = mesh.normalArray_;
    var eyeX = eyeDir[0],
      eyeY = eyeDir[1],
      eyeZ = eyeDir[2];
    for (var i = 0; i < nbVertsSelected; ++i)
    {
      var id = iVertsSelected[i];
      if (vertices[id].sculptFlag_ === vertexSculptMask)
      {
        iVertsInRadius.push(id);
        var j = id * 3;
        if ((nAr[j] * eyeX + nAr[j + 1] * eyeY + nAr[j + 2] * eyeZ) <= 0)
          iVertsFront.push(id);
      }
    }

    //no sculpting if we are only picking back-facing vertices
    if (iVertsFront.length !== 0)
    {
      if (this.culling_)
        iVertsInRadius = iVertsFront;

      switch (this.tool_)
      {
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

    if (this.topo_ === Sculpt.topo.ADAPTIVE)
    {
      iTris = topo.adaptTopology(iTris, this.d2Thickness_);
      iVertsSelected = mesh.getVerticesFromTriangles(iTris);
    }
    mesh.updateMesh(iTris, iVertsSelected);
  },

  /** Brush stroke, move vertices along a direction computed by their averaging normals */
  brush: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity)
  {
    var aNormal = this.areaNormal(iVertsFront);
    if (!aNormal)
      return;
    var aCenter = this.areaCenter(iVertsFront);
    var vAr = this.mesh_.vertexArray_;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVertsInRadius.length;
    var deformIntensityBrush = intensity * radius * 0.1;
    var deformIntensityFlatten = this.clay_ ? intensity : intensity * 0.3;
    if (this.negative_)
      deformIntensityBrush = -deformIntensityBrush;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var ax = aCenter[0],
      ay = aCenter[1],
      az = aCenter[2];
    var anx = aNormal[0],
      any = aNormal[1],
      anz = aNormal[2];
    var limitMove = this.topo_ === Sculpt.topo.ADAPTIVE;
    var dMove = Math.sqrt(this.d2Move_);
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVertsInRadius[i] * 3;
      var vx = vAr[ind],
        vy = vAr[ind + 1],
        vz = vAr[ind + 2];
      var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
      var dx = vx - cx,
        dy = vy - cy,
        dz = vz - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
      fallOff = fallOff * (distToPlane * deformIntensityFlatten - deformIntensityBrush);
      if (limitMove && fallOff > dMove)
        fallOff = dMove;
      vAr[ind] -= anx * fallOff;
      vAr[ind + 1] -= any * fallOff;
      vAr[ind + 2] -= anz * fallOff;
    }
  },

  /** Inflate a group of vertices */
  inflate: function (center, iVerts, radiusSquared, intensity)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var nbVerts = iVerts.length;
    var radius = Math.sqrt(radiusSquared);
    var deformIntensity = intensity * radius * 0.1;
    if (this.topo_ === Sculpt.topo.ADAPTIVE)
      deformIntensity = Math.min(Math.sqrt(this.d2Move_), deformIntensity);
    if (this.negative_)
      deformIntensity = -deformIntensity;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var dx = vAr[ind] - cx,
        dy = vAr[ind + 1] - cy,
        dz = vAr[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
      fallOff = deformIntensity * fallOff;
      vAr[ind] += nAr[ind] * fallOff;
      vAr[ind + 1] += nAr[ind + 1] * fallOff;
      vAr[ind + 2] += nAr[ind + 2] * fallOff;
    }
  },

  /** Start a sculpt sculpt stroke */
  startScale: function (picking, mouseX, mouseY, pickingSym, ptPlane, nPlane, sym)
  {
    var vNear = picking.camera_.unproject(mouseX, mouseY, 0),
      vFar = picking.camera_.unproject(mouseX, mouseY, 1);
    var matInverse = mat4.create();
    mat4.invert(matInverse, this.mesh_.matTransform_);
    vec3.transformMat4(vNear, vNear, matInverse);
    vec3.transformMat4(vFar, vFar, matInverse);
    picking.intersectionRayMesh(this.mesh_, vNear, vFar, mouseX, mouseY, 1);
    if (!picking.mesh_)
      return;
    picking.pickVerticesInSphere(picking.rWorldSqr_);
    if (sym)
    {
      var vNearSym = [vNear[0], vNear[1], vNear[2]];
      Geometry.mirrorPoint(vNearSym, ptPlane, nPlane);
      var vFarSym = [vFar[0], vFar[1], vFar[2]];
      Geometry.mirrorPoint(vFarSym, ptPlane, nPlane);
      pickingSym.intersectionRayMesh(this.mesh_, vNearSym, vFarSym, mouseX, mouseY, 1);
      if (!pickingSym.mesh_)
        return;
      pickingSym.rWorldSqr_ = picking.rWorldSqr_;
      pickingSym.pickVerticesInSphere(pickingSym.rWorldSqr_);
    }
  },

  /** Scale the vertices around the mouse point intersection */
  scale: function (center, iVerts, radiusSquared, intensity)
  {
    var vAr = this.mesh_.vertexArray_;
    var deltaScale = intensity * 0.01;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVerts.length;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var dx = vAr[ind] - cx,
        dy = vAr[ind + 1] - cy,
        dz = vAr[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
      fallOff *= deltaScale;
      vAr[ind] += dx * fallOff;
      vAr[ind + 1] += dy * fallOff;
      vAr[ind + 2] += dz * fallOff;
    }
  },

  /** Start a rotate sculpt stroke */
  startRotate: function (picking, mouseX, mouseY, pickingSym, ptPlane, nPlane, sym)
  {
    var vNear = picking.camera_.unproject(mouseX, mouseY, 0),
      vFar = picking.camera_.unproject(mouseX, mouseY, 1);
    var matInverse = mat4.create();
    mat4.invert(matInverse, this.mesh_.matTransform_);
    vec3.transformMat4(vNear, vNear, matInverse);
    vec3.transformMat4(vFar, vFar, matInverse);
    this.initRotateData(picking, vNear, vFar, mouseX, mouseY, this.rotateData_);
    if (sym)
    {
      var vNearSym = [vNear[0], vNear[1], vNear[2]];
      Geometry.mirrorPoint(vNearSym, ptPlane, nPlane);
      var vFarSym = [vFar[0], vFar[1], vFar[2]];
      Geometry.mirrorPoint(vFarSym, ptPlane, nPlane);
      this.initRotateData(pickingSym, vNearSym, vFarSym, mouseX, mouseY, this.rotateDataSym_);
      pickingSym.rWorldSqr_ = picking.rWorldSqr_;
    }
  },

  /** Set a few infos that will be needed for the rotate function afterwards */
  initRotateData: function (picking, vNear, vFar, mouseX, mouseY, rotateData)
  {
    picking.intersectionRayMesh(this.mesh_, vNear, vFar, mouseX, mouseY, 1);
    if (!picking.mesh_)
      return;
    picking.pickVerticesInSphere(picking.rWorldSqr_);
    var ray = [0, 0, 0];
    vec3.sub(ray, vNear, vFar);
    rotateData.normal = vec3.normalize(ray, ray);
    rotateData.center = [mouseX, mouseY];
  },

  /** Rotate the vertices around the mouse point intersection */
  rotate: function (center, iVerts, radiusSquared, mouseX, mouseY, lastMouseX, lastMouseY, sym)
  {
    var rotateData = this.rotateData_;
    if (sym)
      rotateData = this.rotateDataSym_;
    var mouseCenter = rotateData.center;
    var vecMouse = [mouseX - mouseCenter[0], mouseY - mouseCenter[1]];
    if (vec2.len(vecMouse) < 30)
      return;
    vec2.normalize(vecMouse, vecMouse);
    var nPlane = rotateData.normal;
    var rot = [0, 0, 0, 0];
    var vecOldMouse = [lastMouseX - mouseCenter[0], lastMouseY - mouseCenter[1]];
    vec2.normalize(vecOldMouse, vecOldMouse);
    var angle = Geometry.signedAngle2d(vecMouse, vecOldMouse);
    var vAr = this.mesh_.vertexArray_;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVerts.length;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var dx = vAr[ind] - cx,
        dy = vAr[ind + 1] - cy,
        dz = vAr[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
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
  smooth: function (iVerts, intensity)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nbVerts = iVerts.length;
    var smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);
    var d2Move = this.d2Move_;
    var dMove = Math.sqrt(d2Move);
    var limitMove = this.topo_ === Sculpt.topo.ADAPTIVE;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var i3 = i * 3;
      var dx = (smoothVerts[i3] - vAr[ind]) * intensity,
        dy = (smoothVerts[i3 + 1] - vAr[ind + 1]) * intensity,
        dz = (smoothVerts[i3 + 2] - vAr[ind + 2]) * intensity;
      if (limitMove)
      {
        var len = dx * dx + dy * dy + dz * dz;
        if (len > d2Move)
        {
          len = dMove / Math.sqrt(len);
          dx *= len;
          dy *= len;
          dz *= len;
        }
      }
      vAr[ind] += dx;
      vAr[ind + 1] += dy;
      vAr[ind + 2] += dz;
    }
  },

  /** Flatten, projection of the sculpting vertex onto a plane defined by the barycenter and normals of all the sculpting vertices */
  flatten: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity)
  {
    var aNormal = this.areaNormal(iVertsFront);
    if (!aNormal)
      return;
    var aCenter = this.areaCenter(iVertsFront);
    var vAr = this.mesh_.vertexArray_;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVertsInRadius.length;
    var deformIntensity = intensity * 0.3;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var ax = aCenter[0],
      ay = aCenter[1],
      az = aCenter[2];
    var anx = aNormal[0],
      any = aNormal[1],
      anz = aNormal[2];
    var dMove = Math.sqrt(this.d2Move_);
    var limitMove = this.topo_ === Sculpt.topo.ADAPTIVE;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVertsInRadius[i] * 3;
      var vx = vAr[ind],
        vy = vAr[ind + 1],
        vz = vAr[ind + 2];
      var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
      var dx = vx - cx,
        dy = vy - cy,
        dz = vz - cz;
      var distToCen = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * distToCen * distToCen * distToCen * distToCen - 4 * distToCen * distToCen * distToCen + 1;
      fallOff = distToPlane * deformIntensity * fallOff;
      if (limitMove && fallOff > dMove)
        fallOff = dMove;
      vAr[ind] -= anx * fallOff;
      vAr[ind + 1] -= any * fallOff;
      vAr[ind + 2] -= anz * fallOff;
    }
  },

  /** Pinch, vertices gather around intersection point */
  pinch: function (center, iVertsInRadius, radiusSquared, intensity)
  {
    var vAr = this.mesh_.vertexArray_;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVertsInRadius.length;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var d2Move = this.d2Move_;
    var dMove = Math.sqrt(d2Move);
    var limitMove = this.topo_ === Sculpt.topo.ADAPTIVE;
    var deformIntensity = intensity * radius * 0.005;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVertsInRadius[i] * 3;
      var vx = vAr[ind],
        vy = vAr[ind + 1],
        vz = vAr[ind + 2];
      var dx = cx - vx,
        dy = cy - vy,
        dz = cz - vz;
      var distToCen = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * distToCen * distToCen * distToCen * distToCen - 4 * distToCen * distToCen * distToCen + 1;
      fallOff = deformIntensity * fallOff;
      dx *= fallOff;
      dy *= fallOff;
      dz *= fallOff;
      if (limitMove)
      {
        var len = dx * dx + dy * dy + dz * dz;
        if (len > d2Move)
        {
          len = dMove / Math.sqrt(len);
          dx *= len;
          dy *= len;
          dz *= len;
        }
      }
      vAr[ind] += dx;
      vAr[ind + 1] += dy;
      vAr[ind + 2] += dz;
    }
  },

  /** Pinch+brush-like sculpt */
  crease: function (center, iVertsInRadius, iVertsFront, radiusSquared, intensity)
  {
    var aNormal = this.areaNormal(iVertsFront);
    if (!aNormal)
      return;
    var vAr = this.mesh_.vertexArray_;
    var radius = Math.sqrt(radiusSquared);
    var nbVerts = iVertsInRadius.length;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var anx = aNormal[0],
      any = aNormal[1],
      anz = aNormal[2];
    var d2Move = this.d2Move_;
    var dMove = Math.sqrt(d2Move);
    var limitMove = this.topo_ === Sculpt.topo.ADAPTIVE;
    var deformIntensity = intensity * radius * 0.005;
    var brushFactor = 10;
    if (this.negative_)
      brushFactor = -10;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVertsInRadius[i] * 3;
      var vx = vAr[ind],
        vy = vAr[ind + 1],
        vz = vAr[ind + 2];
      var dx = cx - vx,
        dy = cy - vy,
        dz = cz - vz;
      var distToCen = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * distToCen * distToCen * distToCen * distToCen - 4 * distToCen * distToCen * distToCen + 1;
      var brushModifier = deformIntensity * Math.pow(2 - fallOff, -5) * brushFactor;
      fallOff *= 0.1;
      dx = dx * fallOff + anx * brushModifier;
      dy = dy * fallOff + any * brushModifier;
      dz = dz * fallOff + anz * brushModifier;
      if (limitMove)
      {
        var len = dx * dx + dy * dy + dz * dz;
        if (len > d2Move)
        {
          len = dMove / Math.sqrt(len);
          dx *= len;
          dy *= len;
          dz *= len;
        }
      }
      vAr[ind] += dx;
      vAr[ind + 1] += dy;
      vAr[ind + 2] += dz;
    }
  },

  /** Set a few infos that will be needed for the drag function afterwards */
  updateDragDir: function (mesh, picking, mouseX, mouseY, pressureRadius, ptPlane, nPlane)
  {
    var vNear = picking.camera_.unproject(mouseX, mouseY, 0),
      vFar = picking.camera_.unproject(mouseX, mouseY, 1);
    var matInverse = mat4.create();
    mat4.invert(matInverse, mesh.matTransform_);
    vec3.transformMat4(vNear, vNear, matInverse);
    vec3.transformMat4(vFar, vFar, matInverse);
    var dir = this.dragDir_;
    if (ptPlane)
    {
      dir = this.dragDirSym_;
      Geometry.mirrorPoint(vNear, ptPlane, nPlane);
      Geometry.mirrorPoint(vFar, ptPlane, nPlane);
    }
    var center = picking.interPoint_;
    picking.interPoint_ = Geometry.vertexOnLine(center, vNear, vFar);
    vec3.sub(dir, picking.interPoint_, center);
    picking.mesh = mesh;
    picking.computeRadiusWorldSq(mouseX, mouseY, pressureRadius);
    var eyeDir = picking.eyeDir_;
    vec3.sub(eyeDir, vFar, vNear);
    vec3.normalize(eyeDir, eyeDir);
  },

  /** Drag deformation */
  drag: function (center, iVerts, radiusSquared, sym)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nbVerts = iVerts.length;
    var radius = Math.sqrt(radiusSquared);
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var dir = sym ? this.dragDirSym_ : this.dragDir_;
    var dirx = dir[0],
      diry = dir[1],
      dirz = dir[2];
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var dx = vAr[ind] - cx,
        dy = vAr[ind + 1] - cy,
        dz = vAr[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
      vAr[ind] += dirx * fallOff;
      vAr[ind + 1] += diry * fallOff;
      vAr[ind + 2] += dirz * fallOff;
    }
  },

  /** Paint color vertices */
  paint: function (center, iVerts, radiusSquared)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var cAr = mesh.colorArray_;
    var color = this.color_;
    var radius = Math.sqrt(radiusSquared);
    var cr = color[0] / 255,
      cg = color[1] / 255,
      cb = color[2] / 255;
    var cx = center[0],
      cy = center[1],
      cz = center[2];
    var intensity = this.intensity_;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var dx = vAr[ind] - cx,
        dy = vAr[ind + 1] - cy,
        dz = vAr[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      var fallOff = 3 * dist * dist * dist * dist - 4 * dist * dist * dist + 1;
      fallOff *= intensity;
      var fallOffCompl = 1.0 - fallOff;
      cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
      cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
      cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
    }
  },

  /** Smooth a group of vertices along the plane defined by the normal of the vertex */
  smoothFlat: function (iVerts, intensity)
  {
    var mesh = this.mesh_;
    var vAr = mesh.vertexArray_;
    var nAr = mesh.normalArray_;
    var nbVerts = iVerts.length;
    var smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      var vx = vAr[ind],
        vy = vAr[ind + 1],
        vz = vAr[ind + 2];
      var nx = nAr[ind],
        ny = nAr[ind + 1],
        nz = nAr[ind + 2];
      var i3 = i * 3;
      var smx = smoothVerts[i3],
        smy = smoothVerts[i3 + 1],
        smz = smoothVerts[i3 + 2];
      var dot = nx * (smx - vx) + ny * (smy - vy) + nz * (smz - vz);
      vAr[ind] += (smx - nx * dot - vx) * intensity;
      vAr[ind + 1] += (smy - ny * dot - vy) * intensity;
      vAr[ind + 2] += (smz - nz * dot - vz) * intensity;
    }
  },

  /** Laplacian smooth. Special rule for vertex on the edge of the mesh. */
  laplacianSmooth: function (iVerts, smoothVerts)
  {
    var mesh = this.mesh_;
    var vertices = mesh.vertices_;
    var vAr = mesh.vertexArray_;
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i)
    {
      var i3 = i * 3;
      var vert = vertices[iVerts[i]];
      var ivRing = vert.ringVertices_;
      var nbVRing = ivRing.length;
      var nx = 0,
        ny = 0,
        nz = 0;
      var j = 0,
        ind = 0;
      if (nbVRing !== vert.tIndices_.length) //edge vertex (or singular stuff...)
      {
        var nbVertEdge = 0;
        for (j = 0; j < nbVRing; ++j)
        {
          ind = ivRing[j];
          var ivr = vertices[ind];
          //we average only with vertices that are also on the edge
          if (ivr.ringVertices_.length !== ivr.tIndices_.length)
          {
            ind *= 3;
            nx += vAr[ind];
            ny += vAr[ind + 1];
            nz += vAr[ind + 2];
            ++nbVertEdge;
          }
        }
        smoothVerts[i3] = nx / nbVertEdge;
        smoothVerts[i3 + 1] = ny / nbVertEdge;
        smoothVerts[i3 + 2] = nz / nbVertEdge;
      }
      else
      {
        for (j = 0; j < nbVRing; ++j)
        {
          ind = ivRing[j] * 3;
          nx += vAr[ind];
          ny += vAr[ind + 1];
          nz += vAr[ind + 2];
        }
        smoothVerts[i3] = nx / nbVRing;
        smoothVerts[i3 + 1] = ny / nbVRing;
        smoothVerts[i3 + 2] = nz / nbVRing;
      }
    }
  },

  /** Compute average normal of a group of vertices with culling */
  areaNormal: function (iVerts)
  {
    var nAr = this.mesh_.normalArray_;
    var nbVerts = iVerts.length;
    var anx = 0,
      any = 0,
      anz = 0;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      anx += nAr[ind];
      any += nAr[ind + 1];
      anz += nAr[ind + 2];
    }
    var len = Math.sqrt(anx * anx + any * any + anz * anz);
    if (len === 0)
      return null;
    len = 1 / len;
    return [anx * len, any * len, anz * len];
  },

  /** Compute average center of a group of vertices (with culling) */
  areaCenter: function (iVerts)
  {
    var vAr = this.mesh_.vertexArray_;
    var nbVerts = iVerts.length;
    var ax = 0,
      ay = 0,
      az = 0;
    for (var i = 0; i < nbVerts; ++i)
    {
      var ind = iVerts[i] * 3;
      ax += vAr[ind];
      ay += vAr[ind + 1];
      az += vAr[ind + 2];
    }
    return [ax / nbVerts, ay / nbVerts, az / nbVerts];
  }
};