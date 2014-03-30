/*global
Subdivision:false,
Mesh:false
*/
'use strict';

var Multiresolution = {};

/** Go to one level above (down to up) */
Multiresolution.higherSynthesis = function (meshDown, meshUp) {
  Subdivision.geometrySubdivide(meshDown, meshUp.verticesXYZ_);
  Multiresolution.applyColors(meshDown, meshUp);
  Multiresolution.applyDetails(meshUp);
};

/** Go to one level below (up to down) */
Multiresolution.lowerAnalysis = function (meshUp, meshDown) {
  // TODO try to perform the dual of loop subdivision ? (taubin smooth)
  // Multiresolution.taubinSmoothing(meshUp, meshDown);
  meshUp.sculptRef_ = Mesh.SCULPT_FLAG;
  meshDown.verticesXYZ_.set(meshUp.verticesXYZ_.subarray(0, meshDown.getNbVertices() * 3));
  meshDown.colorsRGB_.set(meshUp.colorsRGB_.subarray(0, meshDown.getNbVertices() * 3));
  var subdVerts = new Float32Array(meshUp.getNbVertices() * 3);
  Subdivision.geometrySubdivide(meshDown, subdVerts);
  Multiresolution.computeDetails(meshUp, subdVerts);
};

Multiresolution.applyColors = function (meshDown, meshUp) {
  var sculptRef = meshUp.sculptRef_;
  meshUp.colorsRGB_.set(meshDown.colorsRGB_);
  meshUp.vertPaintFlags_.set(meshDown.vertPaintFlags_);
  var iArDown = meshDown.indicesABC_;
  var cArDown = meshDown.colorsRGB_;
  var nbTriangles = meshDown.getNbTriangles();

  var iArUp = meshUp.indicesABC_;
  var vPfUp = meshUp.vertPaintFlags_;
  var cArUp = meshUp.colorsRGB_;
  var sculptFlag = Mesh.SCULPT_FLAG;

  for (var i = 0; i < nbTriangles; ++i) {
    var id = i * 3;
    var iv1 = iArDown[id];
    var iv2 = iArDown[id + 1];
    var iv3 = iArDown[id + 2];

    var ivMid1 = iArUp[id];
    var ivMid2 = iArUp[id + 1];
    var ivMid3 = iArUp[id + 2];

    var vp1 = vPfUp[iv1];
    var vp2 = vPfUp[iv2];
    var vp3 = vPfUp[iv3];

    iv1 *= 3;
    iv2 *= 3;
    iv3 *= 3;

    if (vp1 > sculptRef || vp2 > sculptRef) {
      vPfUp[ivMid1] = sculptFlag;
      ivMid1 *= 3;
      cArUp[ivMid1] = 0.5 * (cArDown[iv1] + cArDown[iv2]);
      cArUp[ivMid1 + 1] = 0.5 * (cArDown[iv1 + 1] + cArDown[iv2 + 1]);
      cArUp[ivMid1 + 2] = 0.5 * (cArDown[iv1 + 2] + cArDown[iv2 + 2]);
    }
    if (vp2 > sculptRef || vp3 > sculptRef) {
      vPfUp[ivMid2] = sculptFlag;
      ivMid2 *= 3;
      cArUp[ivMid2] = 0.5 * (cArDown[iv2] + cArDown[iv3]);
      cArUp[ivMid2 + 1] = 0.5 * (cArDown[iv2 + 1] + cArDown[iv3 + 1]);
      cArUp[ivMid2 + 2] = 0.5 * (cArDown[iv2 + 2] + cArDown[iv3 + 2]);
    }
    if (vp1 > sculptRef || vp3 > sculptRef) {
      vPfUp[ivMid3] = sculptFlag;
      ivMid3 *= 3;
      cArUp[ivMid3] = 0.5 * (cArDown[iv1] + cArDown[iv3]);
      cArUp[ivMid3 + 1] = 0.5 * (cArDown[iv1 + 1] + cArDown[iv3 + 1]);
      cArUp[ivMid3 + 2] = 0.5 * (cArDown[iv1 + 2] + cArDown[iv3 + 2]);
    }
  }
};

/** Apply back the detail vectors */
Multiresolution.applyDetails = function (meshUp) {
  var vertRingVertUp = meshUp.vertRingVert_;
  var vArUp = meshUp.verticesXYZ_;
  var nArUp = meshUp.normalsXYZ_;
  var nbVertsUp = meshUp.getNbVertices();

  var vArOut = new Float32Array(vArUp.length);

  var dAr = meshUp.detailsXYZ_;

  for (var i = 0; i < nbVertsUp; ++i) {
    var j = i * 3;

    // vertex coord
    var vx = vArUp[j];
    var vy = vArUp[j + 1];
    var vz = vArUp[j + 2];

    // neighborhood vert
    var k = vertRingVertUp[i][0] * 3;
    var v2x = vArUp[k];
    var v2y = vArUp[k + 1];
    var v2z = vArUp[k + 2];

    // displacement/detail vector (object space)
    var dx = dAr[j];
    var dy = dAr[j + 1];
    var dz = dAr[j + 2];

    // normal vec
    var nx = nArUp[j];
    var ny = nArUp[j + 1];
    var nz = nArUp[j + 2];

    // tangent vec (vertex - vertex neighbor)
    var tx = v2x - vx;
    var ty = v2y - vy;
    var tz = v2z - vz;
    // distance to normal plane
    var len = tx * nx + ty * ny + tz * nz;
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
    var bix = ny * tz - nz * ty;
    var biy = nz * tx - nx * tz;
    var biz = nx * ty - ny * tx;

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

  for (var i = 0; i < nbVertices; ++i) {
    var j = i * 3;

    // vertex coord
    var vx = vArUp[j];
    var vy = vArUp[j + 1];
    var vz = vArUp[j + 2];

    // neighborhood vert
    var k = vertRingVertUp[i][0] * 3;
    var v2x = vArUp[k];
    var v2y = vArUp[k + 1];
    var v2z = vArUp[k + 2];

    // displacement/detail vector (object space)
    var dx = vx - downSubd[j];
    var dy = vy - downSubd[j + 1];
    var dz = vz - downSubd[j + 2];

    // normal vec
    var nx = nArUp[j];
    var ny = nArUp[j + 1];
    var nz = nArUp[j + 2];

    // tangent vec (vertex - vertex neighbor)
    var tx = v2x - vx;
    var ty = v2y - vy;
    var tz = v2z - vz;
    // distance to normal plane
    var len = tx * nx + ty * ny + tz * nz;
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
    var bix = ny * tz - nz * ty;
    var biy = nz * tx - nx * tz;
    var biz = nx * ty - ny * tx;

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
  var sx = 0.0,
    sy = 0.0,
    sz = 0.0;
  var j = 0,
    is = 0;
  for (var i = 0; i < nbVerts; ++i) {
    var it = i * 3;
    var ivRing = vertRingVert[i];
    var nbVRing = ivRing.length;
    var avx = 0.0,
      avy = 0.0,
      avz = 0.0;
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