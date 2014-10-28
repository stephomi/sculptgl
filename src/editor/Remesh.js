define([
  'lib/glMatrix',
  'editor/HoleFilling',
  'editor/SurfaceNets',
  'math3d/Geometry',
  'mesh/Mesh',
  'misc/Utils'
], function (glm, HoleFilling, SurfaceNets, Geometry, Mesh, Utils) {

  'use strict';

  var vec3 = glm.vec3;

  var Remesh = {};

  Remesh.resolution = 150;

  Remesh.floodFill = function (voxels, step) {
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
      if (cellDist < step) // border hit
      {
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
      } else { // exterior
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
      if (tagCell[id] === 0)
        distField[id] = -distField[id];
    }
  };

  Remesh.voxelize = function (mesh, voxels, dims, step) {
    var invStep = 1.0 / step;

    var vminx = dims[0][0];
    var vminy = dims[1][0];
    var vminz = dims[2][0];

    var rx = voxels.dims[0];
    var ry = voxels.dims[1];
    var distField = voxels.distanceField;
    var crossedEdges = voxels.crossedEdges;

    var iAr = mesh.getTriangles();
    var vAr = mesh.getVertices();
    var nbTriangles = mesh.getNbTriangles();

    var v1 = [0.0, 0.0, 0.0];
    var v2 = [0.0, 0.0, 0.0];
    var v3 = [0.0, 0.0, 0.0];
    var triEdge1 = [0.0, 0.0, 0.0];
    var triEdge2 = [0.0, 0.0, 0.0];
    var point = [0.0, 0.0, 0.0];
    var closest = [0.0, 0.0, 0.0, 0];
    var rxy = rx * ry;
    var dirUnit = [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 1.0]
    ];

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
            if (newDist < distField[n])
              distField[n] = newDist;
            if (newDist > step)
              continue;

            for (var it = 0; it < 3; ++it) {
              var val = closest[it] - point[it];
              if (val < 0.0 || val > step) continue;
              var idEdge = n * 3 + it;
              if (crossedEdges[idEdge] === 1) continue;
              var dist = Geometry.intersectionRayTriangleEdges(point, dirUnit[it], triEdge1, triEdge2, v1);
              if (dist < 0.0 || dist > step) continue;
              crossedEdges[idEdge] = 1;
            }

          }
        }
      }
    }
  };

  Remesh.createVoxelData = function (dims, step) {
    var rx = 1 + Math.ceil((dims[0][1] - dims[0][0]) / step);
    var ry = 1 + Math.ceil((dims[1][1] - dims[1][0]) / step);
    var rz = 1 + Math.ceil((dims[2][1] - dims[2][0]) / step);
    var datalen = rx * ry * rz;
    var buffer = Utils.getMemory((4 + 3) * datalen);
    var distField = new Float32Array(buffer, 0, datalen);
    var crossedEdges = new Uint8Array(buffer, 4 * datalen, datalen * 3);
    // Initialize data
    for (var idf = 0; idf < datalen; ++idf)
      distField[idf] = Infinity;
    for (var ide = 0, datalene = datalen * 3; ide < datalene; ++ide)
      crossedEdges[ide] = 0;
    var voxels = {};
    voxels.dims = [rx, ry, rz];
    voxels.crossedEdges = crossedEdges;
    voxels.distanceField = distField;
    return voxels;
  };

  Remesh.createMesh = function (mesh, vertices, faces) {
    var newMesh = new Mesh(mesh.getGL());
    newMesh.setID(mesh.getID());
    newMesh.setVertices(vertices);
    newMesh.setFaces(faces);
    newMesh.init();
    newMesh.setRender(mesh.getRender());
    mesh.getRender().mesh_ = newMesh;
    newMesh.initRender();
    return newMesh;
  };

  // hole filling + transform to world + ComputeBox
  Remesh.prepareMeshes = function (meshes) {
    var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    var tmp = [0.0, 0.0, 0.0];
    for (var i = 0, nbm = meshes.length; i < nbm; ++i) {
      var mesh = meshes[i];
      var matrix = mesh.getMatrix();
      mesh = HoleFilling.closeHoles(mesh);
      if (mesh === meshes[i])
        mesh = HoleFilling.createMesh(mesh, new Float32Array(mesh.getVertices()), new Int32Array(mesh.getFaces()));
      meshes[i] = mesh;
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

  Remesh.remesh = function (mesh, meshes) {
    meshes = meshes.slice();
    console.time('prepareMeshes');
    var box = Remesh.prepareMeshes(meshes);
    console.timeEnd('prepareMeshes');

    var step = Math.max((box[3] - box[0]), (box[4] - box[1]), (box[5] - box[2])) / Remesh.resolution;
    var stepMin = step * 2.5;
    var stepMax = step * 2.5;
    var dims = [
      [box[0] - stepMin, box[3] + stepMax - step],
      [box[1] - stepMin, box[4] + stepMax - step],
      [box[2] - stepMin, box[5] + stepMax - step]
    ];
    console.time('voxelization');
    var voxels = Remesh.createVoxelData(dims, step);
    for (var i = 0, l = meshes.length; i < l; ++i)
      Remesh.voxelize(meshes[i], voxels, dims, step);
    console.timeEnd('voxelization');

    console.time('floodFill');
    Remesh.floodFill(voxels, step);
    console.timeEnd('floodFill');

    var min = [box[0] - stepMin, box[1] - stepMin, box[2] - stepMin];
    var max = [box[3] + stepMax, box[4] + stepMax, box[5] + stepMax];
    console.time('surfaceNet');
    var res = SurfaceNets.computeSurface(voxels.distanceField, voxels.dims, [min, max]);
    console.timeEnd('surfaceNet');

    return Remesh.createMesh(mesh, res.vertices, res.faces);
  };

  return Remesh;
});