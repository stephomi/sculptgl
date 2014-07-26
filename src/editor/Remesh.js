define([
  'lib/glMatrix',
  'editor/SurfaceNets',
  'math3d/Geometry',
  'mesh/Mesh',
  'misc/Utils'
], function (glm, SurfaceNets, Geometry, Mesh, Utils) {

  'use strict';

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

  Remesh.voxelize = function (mesh, dims, step) {
    var invStep = 1.0 / step;

    var vminx = dims[0][0];
    var vminy = dims[1][0];
    var vminz = dims[2][0];

    var res = [0, 0, 0];
    var rx = res[0] = 1 + Math.ceil((dims[0][1] - vminx) * invStep);
    var ry = res[1] = 1 + Math.ceil((dims[1][1] - vminy) * invStep);
    var rz = res[2] = 1 + Math.ceil((dims[2][1] - vminz) * invStep);
    var datalen = rx * ry * rz;
    var buffer = Utils.getMemory((4 + 3) * datalen);
    var distField = new Float32Array(buffer, 0, datalen);
    var crossedEdges = new Uint8Array(buffer, 4 * datalen, datalen * 3);
    // Initialize data
    for (var idf = 0; idf < datalen; ++idf)
      distField[idf] = Infinity;
    for (var ide = 0, datalene = datalen * 3; ide < datalene; ++ide)
      crossedEdges[ide] = 0;

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

    return {
      distanceField: distField,
      crossedEdges: crossedEdges,
      dims: res
    };
  };

  Remesh.createMesh = function (mesh, vertices, faces) {
    var newMesh = new Mesh();
    newMesh.setVertices(vertices);
    newMesh.setFaces(faces);

    newMesh.setTransformData(mesh.getTransformData());
    newMesh.getTransformData().mesh_ = newMesh;
    newMesh.setRender(mesh.getRender());
    newMesh.getRender().mesh_ = newMesh;

    newMesh.init(true);
    newMesh.initRender();
    return newMesh;
  };

  var Edge = function (v1, v2) {
    this.previous = null;
    this.next = null;
    this.v1 = v1;
    this.v2 = v2;
  };

  Remesh.detectHole = function (borderEdges) {
    if (borderEdges.length <= 2)
      return;
    var nbEdges = borderEdges.length;
    var iEnd = borderEdges[0].v1;
    var iLast = borderEdges[0].v2;
    var first = borderEdges[0];
    var last = first;

    borderEdges[0] = borderEdges[--nbEdges];
    var i = 0;
    while (i < nbEdges) {
      var testEdge = borderEdges[i];
      if (testEdge.v1 === iLast) {
        testEdge.previous = last;
        last.next = last = testEdge;
        iLast = borderEdges[i].v2;
        borderEdges[i] = borderEdges[--nbEdges];
        if (iLast === iEnd)
          break;
        i = 0;
      } else
        i++;
    }
    borderEdges.length = nbEdges;
    if (iLast !== iEnd)
      return;
    first.previous = last;
    last.next = first;
    return first;
  };

  Remesh.detectHoles = function (mesh) {
    var eAr = mesh.getEdges();
    var fAr = mesh.getFaces();
    var feAr = mesh.getFaceEdges();
    var borderEdges = [];
    for (var i = 0, len = mesh.getNbFaces(); i < len; ++i) {
      var id = i * 4;
      var iv4 = feAr[id + 3];
      if (eAr[feAr[id]] === 1) borderEdges.push(new Edge(fAr[id], fAr[id + 1]));
      if (eAr[feAr[id + 1]] === 1) borderEdges.push(new Edge(fAr[id + 1], fAr[id + 2]));
      if (eAr[feAr[id + 2]] === 1) borderEdges.push(new Edge(fAr[id + 2], fAr[iv4 < 0 ? id : id + 3]));
      if (iv4 >= 0 && eAr[iv4] === 1) borderEdges.push(new Edge(fAr[id + 3], fAr[id]));
    }

    var holes = [];
    while (true) {
      var firstEdge = Remesh.detectHole(borderEdges);
      if (!firstEdge) break;
      holes.push(firstEdge);
    }
    return holes;
  };

  Remesh.advancingFrontMesh = function (mesh, firstEdge, newTris, newVerts) {
    var vAr = mesh.getVertices();
    // var current = firstEdge;
    // var count = 1;
    // while (current.next !== firstEdge) {
    //   current = current.next;
    //   count++;
    // }
    // console.log(count)

    // TODO : stupid naive hole filling for now
    var last = mesh.getNbVertices() + newVerts.length / 3;
    var current = firstEdge;
    var avx = 0.0;
    var avy = 0.0;
    var avz = 0.0;
    var count = 0;
    do {
      var next = current.next;
      var iv1 = current.v1;
      var iv2 = current.v2;
      var iv3 = next.v2;

      newTris.push(iv1, iv2, last, -1);
      iv1 *= 3;
      iv2 *= 3;
      iv3 *= 3;
      count++;
      avx += vAr[iv1];
      avy += vAr[iv1 + 1];
      avz += vAr[iv1 + 2];

      var v1x = vAr[iv1];
      var v1y = vAr[iv1 + 1];
      var v1z = vAr[iv1 + 2];
      var v2x = vAr[iv2];
      var v2y = vAr[iv2 + 1];
      var v2z = vAr[iv2 + 2];
      var v3x = vAr[iv3];
      var v3y = vAr[iv3 + 1];
      var v3z = vAr[iv3 + 2];
      // compute normals
      var ax = v1x - v2x;
      var ay = v1y - v2y;
      var az = v1z - v2z;
      var bx = v3x - v2x;
      var by = v3y - v2y;
      var bz = v3z - v2z;
      var alen = ax * ax + ay * ay + az * az;
      var blen = bx * bx + by * by + bz * bz;
      current.angle = Math.acos((ax * bx + ay * by + az * bz) / Math.sqrt(alen * blen));
      current = next;
    } while (current !== firstEdge);
    newVerts.push(avx / count, avy / count, avz / count);
  };

  Remesh.closeHoles = function (mesh) {
    var holes = Remesh.detectHoles(mesh);
    if (holes.length === 0)
      return mesh;
    var newFaces = [];
    var newVerts = [];
    // console.time('closeHoles');
    for (var i = 0, nbHoles = holes.length; i < nbHoles; ++i)
      Remesh.advancingFrontMesh(mesh, holes[i], newFaces, newVerts);
    // console.timeEnd('closeHoles');

    // set vertices
    var vertices = new Float32Array(mesh.getNbVertices() * 3 + newVerts.length);
    vertices.set(mesh.getVertices());
    if (newVerts.length > 0)
      vertices.set(newVerts, mesh.getNbVertices() * 3);

    // set faces
    var faces = new Int32Array(mesh.getNbFaces() * 4 + newFaces.length);
    faces.set(mesh.getFaces());
    if (newFaces.length > 0)
      faces.set(newFaces, mesh.getNbFaces() * 4);

    return Remesh.createMesh(mesh, vertices, faces);
  };

  Remesh.remesh = function (mesh) {
    mesh = Remesh.closeHoles(mesh);

    var box = mesh.computeAabb();
    var step = Math.max((box[3] - box[0]), (box[4] - box[1]), (box[5] - box[2])) / Remesh.resolution;
    var stepMin = step * 2.5;
    var stepMax = step * 2.5;
    var dims = [
      [box[0] - stepMin, box[3] + stepMax - step],
      [box[1] - stepMin, box[4] + stepMax - step],
      [box[2] - stepMin, box[5] + stepMax - step]
    ];
    console.time('voxelization');
    var voxels = Remesh.voxelize(mesh, dims, step);
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