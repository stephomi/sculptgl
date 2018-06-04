import { vec3, mat4 } from 'gl-matrix';
import HoleFilling from 'editing/HoleFilling';
import SurfaceNets from 'editing/SurfaceNets';
import MarchingCubes from 'editing/MarchingCubes';
import Geometry from 'math3d/Geometry';
import MeshStatic from 'mesh/meshStatic/MeshStatic';
import Utils from 'misc/Utils';
import Enums from 'misc/Enums';
import Smooth from 'editing/tools/Smooth';

var Remesh = {};
Remesh.RESOLUTION = 150;
Remesh.BLOCK = false;
Remesh.SMOOTHING = true;

var floodFill = function (voxels) {
  var step = voxels.step;
  var res = voxels.dims;
  var rx = res[0];
  var ry = res[1];
  var rxy = rx * ry;

  var crossedEdges = voxels.crossedEdges;
  var distField = voxels.distanceField;
  var datalen = distField.length;
  var tagCell = new Uint8Array(datalen); // 0 interior, 1 exterior
  var stack = new Int32Array(datalen);

  stack[0] = 0;
  var curStack = 1;

  var dirs = [-1, 1, -rx, rx, -rxy, rxy];
  var dirsEdge = [0, 0, 1, 1, 2, 2];
  var nbDir = dirs.length;
  var i = 0;
  var idNext = 0;

  while (curStack > 0) {
    var cell = stack[--curStack];
    var cellDist = distField[cell];
    if (cellDist < step) {
      // border hit
      for (i = 0; i < nbDir; ++i) {
        var off = dirs[i];
        idNext = cell + off;
        if (idNext >= datalen || idNext < 0) continue; // range check
        if (tagCell[idNext] === 1) continue; // check if already tagged as exterior
        if (distField[idNext] === Infinity) continue; // check if we are in the far exterior zone
        if (crossedEdges[(off >= 0 ? cell : idNext) * 3 + dirsEdge[i]] === 0) {
          tagCell[idNext] = 1;
          stack[curStack++] = idNext;
        }
      }
    } else {
      // exterior
      for (i = 0; i < nbDir; ++i) {
        idNext = cell + dirs[i];
        if (idNext >= datalen || idNext < 0) continue; // range check
        if (tagCell[idNext] === 1) continue; // check if already tagged as exterior
        tagCell[idNext] = 1;
        stack[curStack++] = idNext;
      }
    }
  }

  for (var id = 0; id < datalen; ++id) {
    if (distField[id] === 0) console.log('hit');
    if (tagCell[id] === 0)
      distField[id] = -distField[id];
  }
};

var voxelize = function (mesh, voxels) {
  var min = voxels.min;
  var step = voxels.step;
  var dims = voxels.dims;
  var invStep = 1.0 / step;

  var vminx = min[0];
  var vminy = min[1];
  var vminz = min[2];

  var rx = dims[0];
  var ry = dims[1];
  var rxy = rx * ry;
  var distField = voxels.distanceField;
  var crossedEdges = voxels.crossedEdges;
  var colors = voxels.colorField;
  var materials = voxels.materialField;

  var iAr = mesh.getTriangles();
  var vAr = mesh.getVertices();
  var cAr = mesh.getColors();
  var mAr = mesh.getMaterials();
  var nbTriangles = mesh.getNbTriangles();

  var v1 = [0.0, 0.0, 0.0];
  var v2 = [0.0, 0.0, 0.0];
  var v3 = [0.0, 0.0, 0.0];
  var triEdge1 = [0.0, 0.0, 0.0];
  var triEdge2 = [0.0, 0.0, 0.0];
  var point = [0.0, 0.0, 0.0];
  var closest = [0.0, 0.0, 0.0, 0];
  var dirUnit = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0]
  ];

  var inv3 = 1 / 3;
  for (var iTri = 0; iTri < nbTriangles; ++iTri) {
    var idTri = iTri * 3;

    var iv1 = iAr[idTri] * 3;
    var iv2 = iAr[idTri + 1] * 3;
    var iv3 = iAr[idTri + 2] * 3;

    var v1x = v1[0] = vAr[iv1];
    var v1y = v1[1] = vAr[iv1 + 1];
    var v1z = v1[2] = vAr[iv1 + 2];
    var v2x = v2[0] = vAr[iv2];
    var v2y = v2[1] = vAr[iv2 + 1];
    var v2z = v2[2] = vAr[iv2 + 2];
    var v3x = v3[0] = vAr[iv3];
    var v3y = v3[1] = vAr[iv3 + 1];
    var v3z = v3[2] = vAr[iv3 + 2];

    var c1x = (cAr[iv1] + cAr[iv2] + cAr[iv3]) * inv3;
    var c1y = (cAr[iv1 + 1] + cAr[iv2 + 1] + cAr[iv3 + 1]) * inv3;
    var c1z = (cAr[iv1 + 2] + cAr[iv2 + 2] + cAr[iv3 + 2]) * inv3;
    var m1x = (mAr[iv1] + mAr[iv2] + mAr[iv3]) * inv3;
    var m1y = (mAr[iv1 + 1] + mAr[iv2 + 1] + mAr[iv3 + 1]) * inv3;
    var m1z = (mAr[iv1 + 2] + mAr[iv2 + 2] + mAr[iv3 + 2]) * inv3;

    // bounding box recomputation (we already have the bbox of the quad but
    // not of the triangles...)
    var xmin = v1x < v2x ? v1x < v3x ? v1x : v3x : v2x < v3x ? v2x : v3x;
    var xmax = v1x > v2x ? v1x > v3x ? v1x : v3x : v2x > v3x ? v2x : v3x;
    var ymin = v1y < v2y ? v1y < v3y ? v1y : v3y : v2y < v3y ? v2y : v3y;
    var ymax = v1y > v2y ? v1y > v3y ? v1y : v3y : v2y > v3y ? v2y : v3y;
    var zmin = v1z < v2z ? v1z < v3z ? v1z : v3z : v2z < v3z ? v2z : v3z;
    var zmax = v1z > v2z ? v1z > v3z ? v1z : v3z : v2z > v3z ? v2z : v3z;

    // cache what can be cached for faster ray-tri and point-tri tests
    // basically edge stuffs
    var e1x = triEdge1[0] = v2x - v1x;
    var e1y = triEdge1[1] = v2y - v1y;
    var e1z = triEdge1[2] = v2z - v1z;
    var e2x = triEdge2[0] = v3x - v1x;
    var e2y = triEdge2[1] = v3y - v1y;
    var e2z = triEdge2[2] = v3z - v1z;
    var a00 = e1x * e1x + e1y * e1y + e1z * e1z;
    var a01 = e1x * e2x + e1y * e2y + e1z * e2z;
    var a11 = e2x * e2x + e2y * e2y + e2z * e2z;

    var snapMinx = Math.floor((xmin - vminx) * invStep);
    var snapMiny = Math.floor((ymin - vminy) * invStep);
    var snapMinz = Math.floor((zmin - vminz) * invStep);

    var snapMaxx = Math.ceil((xmax - vminx) * invStep);
    var snapMaxy = Math.ceil((ymax - vminy) * invStep);
    var snapMaxz = Math.ceil((zmax - vminz) * invStep);

    for (var k = snapMinz; k <= snapMaxz; ++k) {
      for (var j = snapMiny; j <= snapMaxy; ++j) {
        for (var i = snapMinx; i <= snapMaxx; ++i) {
          var x = vminx + i * step;
          var y = vminy + j * step;
          var z = vminz + k * step;
          var n = i + j * rx + k * rxy;

          point[0] = x;
          point[1] = y;
          point[2] = z;
          var newDist = Geometry.distance2PointTriangleEdges(point, triEdge1, triEdge2, v1, a00, a01, a11, closest);
          newDist = Math.sqrt(newDist);
          if (newDist < distField[n]) {
            distField[n] = newDist;
            var n3 = n * 3;
            colors[n3] = c1x;
            colors[n3 + 1] = c1y;
            colors[n3 + 2] = c1z;
            materials[n3] = m1x;
            materials[n3 + 1] = m1y;
            materials[n3 + 2] = m1z;
          }

          if (newDist > step)
            continue;

          for (var it = 0; it < 3; ++it) {
            var val = closest[it] - point[it];
            if (val < 0.0 || val > step)
              continue;

            var idEdge = n * 3 + it;
            if (crossedEdges[idEdge] === 1)
              continue;

            var dist = Geometry.intersectionRayTriangleEdges(point, dirUnit[it], triEdge1, triEdge2, v1);
            if (dist < 0.0 || dist > step)
              continue;

            crossedEdges[idEdge] = 1;
          }

        }
      }
    }
  }
};

// grid structure
var createVoxelData = function (box) {
  var step = Math.max((box[3] - box[0]), (box[4] - box[1]), (box[5] - box[2])) / Remesh.RESOLUTION;
  var stepMin = step * 1.51;
  var stepMax = step * 1.51;
  var min = [box[0] - stepMin, box[1] - stepMin, box[2] - stepMin];
  var max = [box[3] + stepMax, box[4] + stepMax, box[5] + stepMax];

  var rx = Math.ceil((max[0] - min[0]) / step);
  var ry = Math.ceil((max[1] - min[1]) / step);
  var rz = Math.ceil((max[2] - min[2]) / step);

  var datalen = rx * ry * rz;
  var buffer = Utils.getMemory((4 * (1 + 3 + 3) + 3) * datalen);
  var distField = new Float32Array(buffer, 0, datalen);
  var colors = new Float32Array(buffer, 4 * datalen, datalen * 3);
  var materials = new Float32Array(buffer, 16 * datalen, datalen * 3);
  var crossedEdges = new Uint8Array(buffer, 28 * datalen, datalen * 3);

  // Initialize data
  for (var idf = 0; idf < datalen; ++idf)
    distField[idf] = Infinity;

  for (var ide = 0, datalene = datalen * 3; ide < datalene; ++ide)
    crossedEdges[ide] = 0;

  for (var idc = 0, datalenc = datalen * 3; idc < datalenc; ++idc)
    colors[idc] = materials[idc] = -1;

  var voxels = {};
  voxels.dims = [rx, ry, rz];
  voxels.step = step;
  voxels.min = min;
  voxels.max = max;
  voxels.crossedEdges = crossedEdges;
  voxels.distanceField = distField;
  voxels.colorField = colors;
  voxels.materialField = materials;
  return voxels;
};

var createMesh = function (mesh, faces, vertices, colors, materials) {
  var newMesh = new MeshStatic(mesh.getGL());
  newMesh.setID(mesh.getID());
  newMesh.setFaces(faces);
  newMesh.setVertices(vertices);
  if (colors) newMesh.setColors(colors);
  if (materials) newMesh.setMaterials(materials);
  newMesh.setRenderData(mesh.getRenderData());
  newMesh.init();
  newMesh.initRender();
  return newMesh;
};

// hole filling + transform to world + ComputeBox
var prepareMeshes = function (meshes) {
  var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  var tmp = [0.0, 0.0, 0.0];
  for (var i = 0, nbm = meshes.length; i < nbm; ++i) {
    var mesh = meshes[i];
    if (mesh.isUsingTexCoords())
      mesh.setShaderType(Enums.Shader.MATCAP);
    var matrix = mesh.getMatrix();

    mesh = meshes[i] = HoleFilling.createClosedMesh(mesh);
    var vAr = mesh.getVertices();
    for (var j = 0, nbv = mesh.getNbVertices(); j < nbv; ++j) {
      var id = j * 3;
      tmp[0] = vAr[id];
      tmp[1] = vAr[id + 1];
      tmp[2] = vAr[id + 2];
      vec3.transformMat4(tmp, tmp, matrix);
      var x = vAr[id] = tmp[0];
      var y = vAr[id + 1] = tmp[1];
      var z = vAr[id + 2] = tmp[2];
      if (x < box[0]) box[0] = x;
      if (y < box[1]) box[1] = y;
      if (z < box[2]) box[2] = z;
      if (x > box[3]) box[3] = x;
      if (y > box[4]) box[4] = y;
      if (z > box[5]) box[5] = z;
    }
  }
  return box;
};

var alignMeshBound = function (mesh, box) {
  var oldMin = [box[0], box[1], box[2]];
  var oldMax = [box[3], box[4], box[5]];
  var oldRadius = vec3.dist(oldMin, oldMax);
  var oldCenter = vec3.add([], oldMin, oldMax);
  vec3.scale(oldCenter, oldCenter, 0.5);

  var newBox = mesh.getLocalBound();
  var newMin = [newBox[0], newBox[1], newBox[2]];
  var newMax = [newBox[3], newBox[4], newBox[5]];
  var newRadius = vec3.dist(newMin, newMax);
  var newCenter = vec3.add([], newMin, newMax);
  vec3.scale(newCenter, newCenter, 0.5);

  var scale = oldRadius / newRadius;
  var tr = vec3.scale([], oldCenter, 1.0 / scale);
  vec3.sub(tr, tr, newCenter);

  var mat = mesh.getMatrix();
  mat4.identity(mat);
  mat4.scale(mat, mat, [scale, scale, scale]);
  mat4.translate(mat, mat, tr);
};

var tangentialSmoothing = function (mesh) {
  var nbVertices = mesh.getNbVertices();
  var indices = new Uint32Array(nbVertices);
  for (var i = 0; i < nbVertices; ++i) indices[i] = i;

  var smo = new Smooth();
  smo.setToolMesh(mesh);
  smo.smoothTangent(indices, 1.0);
  mesh.updateGeometry();
  mesh.updateGeometryBuffers();
};

Remesh.remesh = function (meshes, baseMesh, manifold) {
  console.time('remesh total');

  console.time('1. prepareMeshes');
  meshes = meshes.slice();
  var box = prepareMeshes(meshes);
  console.timeEnd('1. prepareMeshes');

  console.time('2. voxelization');
  var voxels = createVoxelData(box);
  for (var i = 0, l = meshes.length; i < l; ++i)
    voxelize(meshes[i], voxels);
  console.timeEnd('2. voxelization');

  console.time('3. flood');
  floodFill(voxels);
  console.timeEnd('3. flood');

  var res;
  if (manifold) {
    console.time('4. marchingCubes');
    MarchingCubes.BLOCK = Remesh.BLOCK;
    res = MarchingCubes.computeSurface(voxels);
    console.timeEnd('4. marchingCubes');
  } else {
    console.time('4. surfaceNets');
    SurfaceNets.BLOCK = Remesh.BLOCK;
    res = SurfaceNets.computeSurface(voxels);
    console.timeEnd('4. surfaceNets');
  }

  console.time('5. createMesh');
  var nmesh = createMesh(baseMesh, res.faces, res.vertices, res.colors, res.materials);
  console.timeEnd('5. createMesh');

  alignMeshBound(nmesh, box);

  if (manifold && Remesh.SMOOTHING) {
    console.time('6. tangential smoothing');
    tangentialSmoothing(nmesh);
    console.timeEnd('6. tangential smoothing');
  }

  console.timeEnd('remesh total');
  console.log('\n');
  return nmesh;
};

Remesh.mergeArrays = function (meshes, arr) {
  var nbVertices = 0;
  var nbFaces = 0;
  var nbQuads = 0;
  var nbTriangles = 0;
  var i, j;

  var nbMeshes = meshes.length;
  var k = 0;
  for (i = 0; i < nbMeshes; ++i) {
    nbVertices += meshes[i].getNbVertices();
    nbFaces += meshes[i].getNbFaces();
    nbQuads += meshes[i].getNbQuads();
    nbTriangles += meshes[i].getNbTriangles();
  }

  arr.nbVertices = nbVertices;
  arr.nbFaces = nbFaces;
  arr.nbQuads = nbQuads;
  arr.nbTriangles = nbTriangles;

  var vAr = arr.vertices = arr.vertices !== undefined ? new Float32Array(nbVertices * 3) : null;
  var cAr = arr.colors = arr.colors !== undefined ? new Float32Array(nbVertices * 3) : null;
  var mAr = arr.materials = arr.materials !== undefined ? new Float32Array(nbVertices * 3) : null;
  var fAr = arr.faces = arr.faces !== undefined ? new Uint32Array(nbFaces * 4) : null;
  var iAr = arr.triangles = arr.triangles !== undefined ? new Uint32Array(nbTriangles * 3) : null;

  var ver = [0.0, 0.0, 0.0];
  var offsetVerts = 0;
  var offsetFaces = 0;
  var offsetTris = 0;
  var offsetIndex = 0;
  for (i = 0; i < nbMeshes; ++i) {
    var mesh = meshes[i];
    var mVerts = mesh.getVertices();
    var mCols = mesh.getColors();
    var mMats = mesh.getMaterials();
    var mFaces = mesh.getFaces();
    var mTris = mesh.getTriangles();

    var mNbVertices = mesh.getNbVertices();
    var mNbFaces = mesh.getNbFaces();
    var mNbTriangles = mesh.getNbTriangles();
    var matrix = mesh.getMatrix();

    for (j = 0; j < mNbVertices; ++j) {
      k = j * 3;
      ver[0] = mVerts[k];
      ver[1] = mVerts[k + 1];
      ver[2] = mVerts[k + 2];
      vec3.transformMat4(ver, ver, matrix);
      vAr[offsetVerts + k] = ver[0];
      vAr[offsetVerts + k + 1] = ver[1];
      vAr[offsetVerts + k + 2] = ver[2];
      if (cAr) {
        cAr[offsetVerts + k] = mCols[k];
        cAr[offsetVerts + k + 1] = mCols[k + 1];
        cAr[offsetVerts + k + 2] = mCols[k + 2];
      }
      if (mAr) {
        mAr[offsetVerts + k] = mMats[k];
        mAr[offsetVerts + k + 1] = mMats[k + 1];
        mAr[offsetVerts + k + 2] = mMats[k + 2];
      }
    }

    offsetVerts += mNbVertices * 3;
    if (fAr) {
      for (j = 0; j < mNbFaces; ++j) {
        k = j * 4;
        fAr[offsetFaces + k] = mFaces[k] + offsetIndex;
        fAr[offsetFaces + k + 1] = mFaces[k + 1] + offsetIndex;
        fAr[offsetFaces + k + 2] = mFaces[k + 2] + offsetIndex;
        fAr[offsetFaces + k + 3] = mFaces[k + 3] === Utils.TRI_INDEX ? Utils.TRI_INDEX : mFaces[k + 3] + offsetIndex;
      }
    }

    if (iAr) {
      for (j = 0; j < mNbTriangles; ++j) {
        k = j * 3;
        iAr[offsetTris + k] = mTris[k] + offsetIndex;
        iAr[offsetTris + k + 1] = mTris[k + 1] + offsetIndex;
        iAr[offsetTris + k + 2] = mTris[k + 2] + offsetIndex;
      }
    }

    offsetIndex += mNbVertices;
    offsetFaces += mNbFaces * 4;
    offsetTris += mNbTriangles * 3;
  }

  return arr;
};

Remesh.mergeMeshes = function (meshes, baseMesh) {
  var arr = { vertices: null, colors: null, materials: null, faces: null };
  Remesh.mergeArrays(meshes, arr);
  return createMesh(baseMesh, arr.faces, arr.vertices, arr.colors, arr.materials);
};

export default Remesh;
