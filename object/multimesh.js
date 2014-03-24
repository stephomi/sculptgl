'use strict';

function Multimesh(gl) {
  this.gl_ = gl;

  this.meshes_ = [];
  this.sel_ = 0;
  this.render_ = new Render(gl, this);

  this.bbox_ = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  this.center_ = [0.0, 0.0, 0.0]; //center of mesh, local space (before mesh transform)
  this.matTransform_ = mat4.create(); //transformation matrix of the mesh
  this.scale_ = -1.0; //used for export in order to keep the same scale as import...

  this.subdivision_ = new Subdivision();
}

Multimesh.SCALE = 100.0;

Multimesh.prototype = {
  /** Return the current mesh */
  getCurrent: function () {
    return this.meshes_[this.sel_];
  },
  /** Return transformation matrix */
  getMatrix: function () {
    return this.matTransform_;
  },
  /** Return the scale (which is applied in the transform matrix) */
  getScale: function () {
    return this.scale_;
  },
  /** Add an extra level to the mesh (loop subdivision) */
  addLevel: function () {
    if ((this.meshes_.length - 1) !== this.sel_)
      return this.getCurrent();
    var baseMesh = this.getCurrent();
    var newMesh = new Mesh(this.gl_);

    console.time('subdiv');
    this.subdivision_.applyLoopSubdivision(baseMesh, newMesh);
    console.timeEnd('subdiv');
    newMesh.computeOctree(newMesh.computeAabb(), 0.2);

    this.meshes_.push(newMesh);
    this.sel_++;

    this.render_.mesh_ = newMesh;
    this.updateBuffers(true, true);

    return newMesh;
  },
  /** Go to one level below in mesh resolution */
  lowerLevel: function () {
    if (this.sel_ === 0)
      return this.meshes_[0];
    this.lowerAnalysis(this.getCurrent(), this.meshes_[--this.sel_]);
    this.updateMesh();
    return this.getCurrent();
  },
  /** Go to one level higher in mesh resolution, if available */
  higherLevel: function () {
    if (this.sel_ === this.meshes_.length - 1)
      return this.getCurrent();
    this.higherSynthesis(this.getCurrent(), this.meshes_[++this.sel_]);
    this.updateMesh();
    return this.getCurrent();
  },
  updateMesh: function () {
    var mesh = this.getCurrent();
    mesh.updateGeometry();
    mesh.computeOctree(mesh.computeAabb(), 0.2);
    this.render_.mesh_ = mesh;
    this.updateBuffers(true, true);
  },
  /** Go to one level above (down to up) */
  higherSynthesis: function (meshDown, meshUp) {
    this.subdivision_.geometrySubdivide(meshDown, meshUp.verticesXYZ_);
    this.applyDetails(meshUp);
  },
  /** Go to one level below (up to down) */
  lowerAnalysis: function (meshUp, meshDown) {
    // TODO try to perform the dual of loop subdivision ? (taubin smooth)
    // this.taubinSmoothing(meshUp, meshDown);
    meshDown.verticesXYZ_.set(meshUp.verticesXYZ_.subarray(0, meshDown.getNbVertices() * 3));
    var subdVerts = new Float32Array(meshUp.getNbVertices() * 3);
    this.subdivision_.geometrySubdivide(meshDown, subdVerts);
    this.computeDetails(meshUp, subdVerts);
  },
  /** Initialize the mesh, octree, topology, geometry, bbox, transformation */
  init: function () {
    var mesh = this.meshes_[0];
    var box = this.bbox_ = mesh.computeAabb();
    this.center_ = [(box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5];

    mesh.init();
    mesh.computeOctree(box, 0.2);

    //scale and center
    var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
    var scale = this.scale_ = Multimesh.SCALE / diag;
    mat4.scale(this.matTransform_, this.matTransform_, [scale, scale, scale]);
    this.moveTo([0.0, 0.0, 0.0]);
    this.toto = mat4.create();
    mat4.translate(this.toto, mat4.create(), vec3.sub([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], this.center_));
  },
  /** Move the mesh center to a certain point */
  moveTo: function (destination) {
    mat4.translate(this.matTransform_, this.matTransform_, vec3.sub(destination, destination, this.center_));
  },
  /** Initialize rendering */
  initRender: function (textures, shaders, shaderType, flatShading) {
    this.render_.mesh_ = this.getCurrent();
    this.render_.flatShading_ = flatShading;
    this.render_.initBuffers();
    this.updateShaders(shaderType, textures, shaders);
  },
  /** Initialize buffers and shaders */
  updateShaders: function (shaderType, textures, shaders) {
    this.render_.updateShaders(shaderType, textures, shaders);
    this.render_.updateBuffers(true, true);
  },
  /** Update the rendering buffers */
  updateBuffers: function (updateColors, updateIndex) {
    this.render_.updateBuffers(updateColors, updateIndex);
  },
  /** Render the mesh */
  render: function (camera, picking) {
    this.render_.render(camera, picking);
  },
  /** Analyse the cells in the octree that needs an update */
  checkLeavesUpdate: function () {
    this.getCurrent().checkLeavesUpdate();
  },
  /** Apply taubin smoothing */
  taubinSmoothing: function (meshUp, meshDown) {
    var vArUp = meshUp.verticesXYZ_;
    var vArDown = meshDown.verticesXYZ_;
    var tmp = new Float32Array(vArUp.length);
    // TODO which topology ? meshUp/meshDown?
    this.laplaceSmooth(meshUp, tmp, vArUp, 0.65);
    this.laplaceSmooth(meshUp, vArDown, tmp, -0.68);
  },
  laplaceSmooth: function (mesh, target, source, factor) {
    var vertOnEdge = mesh.vertOnEdge_;
    var vertRingVert = mesh.vertRingVert_;
    var nbVerts = target.length / 3;
    var avx = 0.0,
      avy = 0.0,
      avz = 0.0;
    var sx = 0.0,
      sy = 0.0,
      sz = 0.0;
    var i = 0,
      j = 0,
      it = 0,
      is = 0;
    for (i = 0; i < nbVerts; ++i) {
      it = i * 3;
      var ivRing = vertRingVert[i];
      var nbVRing = ivRing.length;
      avx = avy = avz = 0.0;
      if (vertOnEdge[i] === 1) {
        var nbVertEdge = 0;
        for (j = 0; j < nbVRing; ++j) {
          is = ivRing[j];
          //we average only with vertices that are also on the edge
          if (vertOnEdge[is] === 1) {
            is *= 3;
            avx += source[is];
            avy += source[is + 1];
            avz += source[is + 2];
            ++nbVertEdge;
          }
        }
        nbVRing = nbVertEdge;
      } else {
        for (j = 0; j < nbVRing; ++j) {
          is = ivRing[j] * 3;
          avx += source[is];
          avy += source[is + 1];
          avz += source[is + 2];
        }
      }
      sx = source[it];
      sy = source[it + 1];
      sz = source[it + 2];
      target[it] = sx + ((avx / nbVRing) - sx) * factor;
      target[it + 1] = sy + ((avy / nbVRing) - sy) * factor;
      target[it + 2] = sz + ((avz / nbVRing) - sz) * factor;
    }
  },
  computeDetails: function (meshUp, downSubd) {
    var vertRingVertUp = meshUp.vertRingVert_;
    var vArUp = meshUp.verticesXYZ_;
    var nArUp = meshUp.normalsXYZ_;
    var nbVertices = meshUp.getNbVertices();

    var dAr = meshUp.detailsXYZ_ = new Float32Array(downSubd.length);

    var j = 0,
      k = 0;
    var len = 0.0;
    var vx = 0.0,
      vy = 0.0,
      vz = 0.0;
    var v2x = 0.0,
      v2y = 0.0,
      v2z = 0.0;
    var dx = 0.0,
      dy = 0.0,
      dz = 0.0;
    var nx = 0.0,
      ny = 0.0,
      nz = 0.0;
    var tx = 0.0,
      ty = 0.0,
      tz = 0.0;
    var bix = 0.0,
      biy = 0.0,
      biz = 0.0;

    for (var i = 0; i < nbVertices; ++i) {
      j = i * 3;

      // vertex coord
      vx = vArUp[j];
      vy = vArUp[j + 1];
      vz = vArUp[j + 2];

      // neighborhood vert
      k = vertRingVertUp[i][0] * 3;
      v2x = vArUp[k];
      v2y = vArUp[k + 1];
      v2z = vArUp[k + 2];

      // displacement/detail vector (object space)
      dx = vx - downSubd[j];
      dy = vy - downSubd[j + 1];
      dz = vz - downSubd[j + 2];

      // normal vec
      nx = nArUp[j];
      ny = nArUp[j + 1];
      nz = nArUp[j + 2];

      // tangent vec (vertex - vertex neighbor)
      tx = v2x - vx;
      ty = v2y - vy;
      tz = v2z - vz;
      // distance to normal plane
      len = tx * nx + ty * ny + tz * nz;
      // project on normal plane
      tx -= nx * len;
      ty -= ny * len;
      tz -= nz * len;
      // normalize vector
      len = 1.0 / Math.sqrt(tx * tx + ty * ty + tz * tz);
      tx *= len;
      ty *= len;
      tz *= len;

      // bi normal/tangent
      bix = ny * tz - nz * ty;
      biy = nz * tx - nx * tz;
      biz = nx * ty - ny * tx;

      // order : n/t/bi
      dAr[j] = nx * dx + ny * dy + nz * dz;
      dAr[j + 1] = tx * dx + ty * dy + tz * dz;
      dAr[j + 2] = bix * dx + biy * dy + biz * dz;
    }
  },
  applyDetails: function (meshUp) {
    var vertRingVertUp = meshUp.vertRingVert_;
    var vArUp = meshUp.verticesXYZ_;
    var nArUp = meshUp.normalsXYZ_;
    var nbVertsUp = meshUp.getNbVertices();

    var vArOut = new Float32Array(vArUp.length);

    var dAr = meshUp.detailsXYZ_;

    var j = 0,
      k = 0;
    var len = 0.0;
    var vx = 0.0,
      vy = 0.0,
      vz = 0.0;
    var v2x = 0.0,
      v2y = 0.0,
      v2z = 0.0;
    var dx = 0.0,
      dy = 0.0,
      dz = 0.0;
    var nx = 0.0,
      ny = 0.0,
      nz = 0.0;
    var tx = 0.0,
      ty = 0.0,
      tz = 0.0;
    var bix = 0.0,
      biy = 0.0,
      biz = 0.0;

    for (var i = 0; i < nbVertsUp; ++i) {
      j = i * 3;

      // vertex coord
      vx = vArUp[j];
      vy = vArUp[j + 1];
      vz = vArUp[j + 2];

      // neighborhood vert
      k = vertRingVertUp[i][0] * 3;
      v2x = vArUp[k];
      v2y = vArUp[k + 1];
      v2z = vArUp[k + 2];

      // displacement/detail vector (object space)
      dx = dAr[j];
      dy = dAr[j + 1];
      dz = dAr[j + 2];

      // normal vec
      nx = nArUp[j];
      ny = nArUp[j + 1];
      nz = nArUp[j + 2];

      // tangent vec (vertex - vertex neighbor)
      tx = v2x - vx;
      ty = v2y - vy;
      tz = v2z - vz;
      // distance to normal plane
      len = tx * nx + ty * ny + tz * nz;
      // project on normal plane
      tx -= nx * len;
      ty -= ny * len;
      tz -= nz * len;
      // normalize vector
      len = 1.0 / Math.sqrt(tx * tx + ty * ty + tz * tz);
      tx *= len;
      ty *= len;
      tz *= len;

      // bi normal/tangent
      bix = ny * tz - nz * ty;
      biy = nz * tx - nx * tz;
      biz = nx * ty - ny * tx;

      // detail vec in the local frame
      vArOut[j] = vx + nx * dx + tx * dy + bix * dz;
      vArOut[j + 1] = vy + ny * dx + ty * dy + biy * dz;
      vArOut[j + 2] = vz + nz * dx + tz * dy + biz * dz;
    }
    meshUp.verticesXYZ_ = vArOut;
  }
};