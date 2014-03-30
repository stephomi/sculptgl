'use strict';

var Multiresolution = {};

/** Apply back the detail vectors */
Multiresolution.applyDetails = function (meshUp) {
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
};

/** Compute the detail vectors */
Multiresolution.computeDetails = function (meshUp, downSubd) {
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
};

/** Apply taubin smoothing */
Multiresolution.taubinSmoothing = function (meshUp, meshDown) {
  var vArUp = meshUp.verticesXYZ_;
  var vArDown = meshDown.verticesXYZ_;
  var tmp = new Float32Array(vArUp.length);
  // TODO which topology ? meshUp/meshDown?
  Multiresolution.laplaceSmooth(meshUp, tmp, vArUp, 0.65);
  Multiresolution.laplaceSmooth(meshUp, vArDown, tmp, -0.68);
};

/** Apply laplaciant smoothing */
Multiresolution.laplaceSmooth = function (mesh, target, source, factor) {
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
};