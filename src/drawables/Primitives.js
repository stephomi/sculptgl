import Utils from 'misc/Utils';
import MeshStatic from 'mesh/meshStatic/MeshStatic';
import Remesh from 'editing/Remesh';

var Primitives = {};

var createPlaneArray = function (
  lx = -0.5, ly = 0.0, lz = -0.5,
  wx = 1.0, wy = 0.0, wz = 0.0,
  hx = 0.0, hy = 0.0, hz = 1.0
) {

  var faces = new Float32Array(4);
  faces[0] = 0;
  faces[1] = 1;
  faces[2] = 2;
  faces[3] = 3;

  var v = new Float32Array(12);
  v[0] = lx;
  v[1] = ly;
  v[2] = lz;

  v[3] = lx + wx;
  v[4] = ly + wy;
  v[5] = lz + wz;

  v[6] = lx + wx + hx;
  v[7] = ly + wy + hy;
  v[8] = lz + wz + hz;

  v[9] = lx + hx;
  v[10] = ly + hy;
  v[11] = lz + hz;

  return {
    faces: faces,
    vertices: v
  };
};

var createCubeArray = function (side = 1.0) {
  var v = new Float32Array(24);
  v[1] = v[2] = v[4] = v[6] = v[7] = v[9] = v[10] = v[11] = v[14] = v[18] = v[21] = v[23] = -side * 0.5;
  v[0] = v[3] = v[5] = v[8] = v[12] = v[13] = v[15] = v[16] = v[17] = v[19] = v[20] = v[22] = side * 0.5;

  var uv = new Float32Array(28);
  uv[0] = uv[6] = uv[8] = uv[10] = uv[11] = uv[13] = uv[16] = uv[23] = uv[25] = 0.5;
  uv[1] = uv[3] = 1.0;
  uv[2] = uv[4] = uv[9] = uv[12] = uv[14] = uv[15] = uv[18] = 0.25;
  uv[5] = uv[7] = uv[21] = uv[24] = uv[26] = uv[27] = 0.75;
  uv[17] = uv[19] = uv[20] = uv[22] = 0.0;

  var f = new Uint32Array(24);
  var ft = new Uint32Array(24);
  f[0] = f[8] = f[21] = ft[0] = 0;
  f[1] = f[11] = f[12] = ft[1] = 1;
  f[2] = f[15] = f[16] = ft[2] = ft[15] = ft[16] = 2;
  f[3] = f[19] = f[22] = ft[3] = ft[19] = ft[22] = 3;
  f[4] = f[9] = f[20] = ft[4] = ft[9] = 4;
  f[7] = f[10] = f[13] = ft[5] = ft[18] = ft[23] = 5;
  f[6] = f[14] = f[17] = ft[6] = ft[14] = ft[17] = 6;
  f[5] = f[18] = f[23] = ft[7] = ft[10] = 7;
  ft[8] = 8;
  ft[11] = 9;
  ft[12] = 10;
  ft[13] = 11;
  ft[20] = 12;
  ft[21] = 13;

  return {
    vertices: v,
    uv: uv,
    faces: f,
    facesUV: ft
  };
};

var createCylinderArray = function (
  radiusTop = 0.5, radiusBottom = 0.5, height = 2.0,
  radSegments = 64, heightSegments = 64, topCap = true, lowCap = true
) {

  var isSingularTop = topCap && radiusTop === 0.0;
  var isSingularBottom = lowCap && radiusBottom === 0.0;
  var heightHalf = height * 0.5;

  var nbVertices = (heightSegments + 1) * radSegments;
  var nbFaces = heightSegments * radSegments;
  if (topCap) {
    nbVertices += 1;
    nbFaces += radSegments;
  }
  if (lowCap) {
    nbVertices += 1;
    nbFaces += radSegments;
  }
  if (isSingularTop || isSingularBottom) {
    nbVertices -= radSegments;
    nbFaces -= radSegments;
  }
  var vAr = new Float32Array(nbVertices * 3);
  var fAr = new Uint32Array(nbFaces * 4);

  var id = 0;
  var k = 0;
  var i = 0;
  var j = 0;
  var startHeight = isSingularTop ? 1 : 0;
  var endHeight = isSingularBottom ? heightSegments - 1 : heightSegments;
  for (i = startHeight; i <= endHeight; i++) {
    var v = i / heightSegments;
    var radius = v * (radiusBottom - radiusTop) + radiusTop;
    for (j = 0; j < radSegments; j++) {
      var u = Math.PI * 2 * j / radSegments;
      k = 3 * id++;
      vAr[k] = radius * Math.sin(u);
      vAr[k + 1] = -v * height + heightHalf;
      vAr[k + 2] = radius * Math.cos(u);
    }
  }

  id = 0;
  for (j = 0; j < radSegments; j++) {
    var off = j === radSegments - 1 ? 0 : j + 1;
    for (i = startHeight; i < endHeight; i++) {
      k = 4 * id++;
      fAr[k] = radSegments * i + j;
      fAr[k + 1] = radSegments * (i + 1) + j;
      fAr[k + 2] = radSegments * (i + 1) + off;
      fAr[k + 3] = radSegments * i + off;
    }
  }

  var last;
  if (topCap) {
    last = (lowCap ? vAr.length - 6 : vAr.length - 3) / 3;
    vAr[last * 3 + 1] = heightHalf;
    for (j = 0; j < radSegments; j++) {
      k = 4 * id++;
      fAr[k] = j;
      fAr[k + 1] = j === radSegments - 1 ? 0 : j + 1;
      fAr[k + 2] = last;
      fAr[k + 3] = Utils.TRI_INDEX;
    }
  }

  if (lowCap) {
    last = (vAr.length - 3) / 3;
    vAr[last * 3 + 1] = -heightHalf;
    if (isSingularTop) --i;
    var end = radSegments * i;
    for (j = 0; j < radSegments; j++) {
      k = 4 * id++;
      fAr[k] = j === radSegments - 1 ? end : end + j + 1;
      fAr[k + 1] = end + j;
      fAr[k + 2] = last;
      fAr[k + 3] = Utils.TRI_INDEX;
    }
  }

  return {
    vertices: vAr,
    faces: fAr
  };
};

var createTorusArray = function (radiusOut = 0.5, radiusWidth = 0.1, arc = Math.PI * 2, nbRadial = 32, nbTubular = 128) {
  var isFull = Math.PI * 2 - arc < 1e-2;

  var nbVertices = nbRadial * nbTubular;
  var nbFaces = nbVertices;
  if (!isFull) {
    nbVertices += 2;
    nbFaces += nbRadial;
  }
  var endTubular = isFull ? nbTubular : nbTubular - 1;

  var vAr = new Float32Array(nbVertices * 3);
  var fAr = new Uint32Array(nbFaces * 4);
  var id = 0;
  var k = 0;
  var i = 0;
  var j = 0;
  for (i = 0; i < nbTubular; ++i) {
    for (j = 0; j < nbRadial; ++j) {
      var u = i / endTubular * arc;
      var v = j / nbRadial * Math.PI * 2;
      k = 3 * id++;
      vAr[k] = (radiusOut + radiusWidth * Math.cos(v)) * Math.cos(u);
      vAr[k + 1] = radiusWidth * Math.sin(v);
      vAr[k + 2] = (radiusOut + radiusWidth * Math.cos(v)) * Math.sin(u);
    }
  }

  id = 0;
  for (i = 0; i < endTubular; ++i) {
    var offi = i === nbTubular - 1 ? 0 : i + 1;
    for (j = 0; j < nbRadial; ++j) {
      k = 4 * id++;
      fAr[k] = nbRadial * i + j;
      var offj = j === nbRadial - 1 ? 0 : j + 1;
      fAr[k + 1] = nbRadial * i + offj;
      fAr[k + 2] = nbRadial * offi + offj;
      fAr[k + 3] = nbRadial * offi + j;
    }
  }

  if (!isFull) {
    var last = (vAr.length - 6) / 3;
    vAr[last * 3] = radiusOut;
    for (j = 0; j < nbRadial; j++) {
      k = 4 * id++;
      fAr[k] = last;
      fAr[k + 1] = j === nbRadial - 1 ? 0 : j + 1;
      fAr[k + 2] = j;
      fAr[k + 3] = Utils.TRI_INDEX;
    }

    ++last;
    vAr[last * 3] = radiusOut * Math.cos(arc);
    vAr[last * 3 + 2] = radiusOut * Math.sin(arc);
    var end = nbRadial * i;
    for (j = 0; j < nbRadial; j++) {
      k = 4 * id++;
      fAr[k] = last;
      fAr[k + 1] = end + j;
      fAr[k + 2] = j === nbRadial - 1 ? end : end + j + 1;
      fAr[k + 3] = Utils.TRI_INDEX;
    }
  }

  return {
    vertices: vAr,
    faces: fAr
  };
};

var createGridArray = function (
  cx = -0.5, cy = 0.0, cz = -0.5,
  wx = 1.0, wy = 0.0, wz = 0.0,
  hx = 0.0, hy = 0.0, hz = 1.0,
  res1 = 20, res2 = res1
) {

  res1 += 2;
  res2 += 2;

  var vAr = new Float32Array((res1 + res2) * 2 * 3);
  var i = 0;
  var j = 0;
  var sx = wx / (res1 - 1);
  var sy = wy / (res1 - 1);
  var sz = wz / (res1 - 1);
  var ux = cx + wx + hx;
  var uy = cy + wy + hy;
  var uz = cz + wz + hz;
  for (i = 0; i < res1; ++i) {
    j = i * 6;
    vAr[j] = cx + sx * i;
    vAr[j + 1] = cy + sy * i;
    vAr[j + 2] = cz + sz * i;
    vAr[j + 3] = ux - sx * (res1 - i - 1);
    vAr[j + 4] = uy - sy * (res1 - i - 1);
    vAr[j + 5] = uz - sz * (res1 - i - 1);
  }

  sx = hx / (res2 - 1);
  sy = hy / (res2 - 1);
  sz = hz / (res2 - 1);
  for (i = 0; i < res2; ++i) {
    j = (res1 + i) * 6;
    vAr[j] = cx + sx * i;
    vAr[j + 1] = cy + sy * i;
    vAr[j + 2] = cz + sz * i;
    vAr[j + 3] = ux - sx * (res2 - i - 1);
    vAr[j + 4] = uy - sy * (res2 - i - 1);
    vAr[j + 5] = uz - sz * (res2 - i - 1);
  }

  return {
    vertices: vAr
  };
};

var createMesh = function (gl, arr) {
  var mesh = new MeshStatic(gl);
  mesh.setVertices(arr.vertices);
  if (arr.faces) mesh.setFaces(arr.faces);
  if (arr.uv && arr.facesUV) mesh.initTexCoordsDataFromOBJData(arr.uv, arr.facesUV);

  mesh.init();
  if (gl) mesh.initRender();
  return mesh;
};

var slice = Array.prototype.slice;

Primitives.createGrid = function (gl) {
  var mesh = createMesh(gl, createGridArray.apply(this, slice.call(arguments, 1)));
  if (gl) {
    mesh.setMode(gl.LINES);
    mesh.setUseDrawArrays(true);
    mesh.setAlreadyDrawArrays();
  }
  return mesh;
};

Primitives.createCube = function (gl) {
  return createMesh(gl, createCubeArray.apply(this, slice.call(arguments, 1)));
};

Primitives.createCylinder = function (gl) {
  return createMesh(gl, createCylinderArray.apply(this, slice.call(arguments, 1)));
};

Primitives.createTorus = function (gl) {
  return createMesh(gl, createTorusArray.apply(this, slice.call(arguments, 1)));
};

Primitives.createPlane = function (gl) {
  return createMesh(gl, createPlaneArray.apply(this, slice.call(arguments, 1)));
};

Primitives.createArrow = function (gl, thick = 0.5, height = 2.0, rConeT = 5.0, rConeH = 0.2, radSegments = 4, heightSegments = 1) {
  var base = createMesh(null, createCylinderArray(thick, thick, height, radSegments, heightSegments));
  var cone = createMesh(null, createCylinderArray(0.0, thick * rConeT, height * rConeH, radSegments, heightSegments));
  cone.getMatrix()[13] = height * 0.5;

  var arrow = {
    vertices: null,
    faces: null
  };
  Remesh.mergeArrays([base, cone], arrow);
  return createMesh(gl, arrow);
};

Primitives.createLine2D = function (gl, lx = 0.0, ly = 0.0, ux = 0.0, uy = 0.0) {
  var mesh = createMesh(gl, {
    vertices: new Float32Array([lx, ly, 0.0, ux, uy, 0.0])
  });
  if (gl) {
    mesh.setMode(gl.LINES);
    mesh.setUseDrawArrays(true);
    mesh.setAlreadyDrawArrays();
  }
  return mesh;
};

export default Primitives;
