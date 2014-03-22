'use strict';

function Multimesh(gl) {
  this.gl_ = gl;

  this.meshes_ = [];
  this.sel_ = 0;
  this.render_ = new Render(gl, this);

  this.detail_ = [];

  this.bbox_ = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  this.center_ = [0.0, 0.0, 0.0]; //center of mesh, local space (before mesh transform)
  this.matTransform_ = mat4.create(); //transformation matrix of the mesh
  this.scale_ = -1.0; //used for export in order to keep the same scale as import...
}

Multimesh.SCALE = 100.0;

Multimesh.prototype = {
  getCurrent: function () {
    return this.meshes_[this.sel_];
  },
  getScale: function () {
    return this.scale_;
  },
  getMatrix: function () {
    return this.matTransform_;
  },
  addLevel: function () {
    if ((this.meshes_.length - 1) !== this.sel_)
      return this.getCurrent();
    var baseMesh = this.getCurrent();
    var newMesh = new Mesh(this.gl_);

    var subdiv = new Subdivision();
    console.time('subdiv');
    subdiv.subdivide(baseMesh, newMesh);
    console.timeEnd('subdiv');
    newMesh.computeOctree(newMesh.computeAabb(), 0.2);

    this.meshes_.push(newMesh);
    this.sel_++;

    this.render_.mesh_ = newMesh;
    this.updateBuffers(true, true);

    return newMesh;
  },
  lowerLevel: function () {
    if (this.sel_ === 0)
      return this.meshes_[0];
    this.lowerAnalysis();
    this.sel_--;
    var mesh = this.getCurrent();
    mesh.computeOctree(mesh.computeAabb(), 0.2);
    this.render_.mesh_ = mesh;
    this.updateBuffers(true, true);
    return mesh;
  },
  higherLevel: function () {
    if (this.sel_ === this.meshes_.length - 1)
      return this.getCurrent();
    this.sel_++;
    var mesh = this.getCurrent();
    mesh.computeOctree(mesh.computeAabb(), 0.2);
    this.render_.mesh_ = mesh;
    this.updateBuffers(true, true);
    return mesh;
  },
  analysis: function () {
    // finer level to coarser level;
  },
  init: function () {
    var mesh = this.meshes_[0];
    this.bbox_ = mesh.computeAabb();
    var box = this.bbox_;
    this.center_ = [(box[0] + box[3]) * 0.5, (box[1] + box[4]) * 0.5, (box[2] + box[5]) * 0.5];

    mesh.init();
    mesh.computeOctree(box, 0.2);
    this.render_.mesh_ = mesh;

    //scale and center
    var diag = vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);
    var scale = this.scale_ = Multimesh.SCALE / diag;
    mat4.scale(this.matTransform_, this.matTransform_, [scale, scale, scale]);
    this.moveTo([0.0, 0.0, 0.0]);
    this.toto=mat4.create();
    mat4.translate(this.toto, mat4.create(), vec3.sub([0.0,0.0,0.0], [0.0,0.0,0.0], this.center_));
  },
  /** Initialize buffers and shadr */
  initRender: function (shaderType, textures, shaders) {
    this.render_.initBuffers();
    this.render_.updateShaders(shaderType, textures, shaders);
    this.render_.updateBuffers(true, true);
  },
  /** Update the rendering buffers */
  updateBuffers: function (updateColors, updateIndex) {
    this.render_.updateBuffers(updateColors, updateIndex);
  },
  render: function (camera, picking) {
    this.render_.render(camera, picking);
  },
  /** Move the mesh center to a certain point */
  moveTo: function (destination) {
    mat4.translate(this.matTransform_, this.matTransform_, vec3.sub(destination, destination, this.center_));
  },
  checkLeavesUpdate: function () {
    this.getCurrent().checkLeavesUpdate();
  },
  lowerAnalysis: function () {
    var meshDown = this.meshes_[this.sel_ - 1];
    var meshUp = this.meshes_[this.sel_];

    var vertRingVertUp = meshUp.vertRingVert_;
    var vArUp = meshUp.verticesXYZ_;
    var nArUp = meshUp.normalsXYZ_;
    var smoArUp = meshUp.smoothArray_;

    var vArDown = meshDown.verticesXYZ_;
    var nbVertsDown = meshDown.getNbVertices();

    var j = 0;
    var k = 0;
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

    for (var i = 0; i < nbVertsDown; ++i) {
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
      dx = smoArUp[j];
      dy = smoArUp[j + 1];
      dz = smoArUp[j + 2];

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
      vArDown[j] = vx - (nx * dx + tx * dy + bix * dz);
      vArDown[j + 1] = vy - (ny * dx + ty * dy + biy * dz);
      vArDown[j + 2] = vz - (nz * dx + tz * dy + biz * dz);
    }
    meshDown.updateGeometry();
  }
};