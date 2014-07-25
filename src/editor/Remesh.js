define([
  'editor/SurfaceNets',
  'math3d/Geometry',
  'mesh/Mesh',
  'misc/Utils'
], function (SurfaceNets, Geometry, Mesh, Utils) {

  'use strict';

  var Remesh = {};

  var DEBUG_HIGH = 50001.0;
  var DEBUG_LOW = 50000.0;
  Remesh.resolution = 150;

  Remesh.fillVoxels = function (data, res) {
    var rx = res[0];
    var ry = res[1];
    var rz = res[2];
    var rxy = rx * ry;
    for (var x = 0; x < rx; ++x) {
      for (var y = 0; y < ry; ++y) {
        var id = x + y * rx;
        var previous = data[id];
        if (previous < DEBUG_LOW)
          data[id] = previous < 0.0 ? -Math.sqrt(-previous) : Math.sqrt(previous);
        for (var z = 1; z < rz; ++z) {
          id = x + y * rx + z * rxy;
          var val = data[id];
          if (val < DEBUG_LOW) {
            data[id] = val < 0.0 ? -Math.sqrt(-val) : Math.sqrt(val);
            previous = val;
            continue;
          }
          if (previous < 0.0)
            data[id] = -DEBUG_LOW;
        }
      }
    }
  };

  Remesh.computeAngleWeightedNormals = function (mesh, vertNormals, edgeNormals, triNormals, triToEdges) {
    var fAr = mesh.getFaces();
    var feAr = mesh.getFaceEdges();
    var fToTri = mesh.getFacesToTriangles();
    var nbFaces = mesh.getNbFaces();
    var accEdge = mesh.getNbEdges();
    for (var i = 0; i < nbFaces; ++i) {
      var id = i * 4;
      var triOff = fToTri[i] * 3;
      var fe1 = feAr[id];
      var fe2 = feAr[id + 1];
      var fe3 = feAr[id + 2];
      var fe4 = feAr[id + 3];
      triToEdges[triOff] = fe1;
      triToEdges[triOff + 1] = fe2;
      if (fAr[id + 3] < 0) {
        triToEdges[triOff + 2] = fe3;
        continue;
      }
      triToEdges[triOff + 2] = triToEdges[triOff + 3] = accEdge++;
      triToEdges[triOff + 4] = fe3;
      triToEdges[triOff + 5] = fe4;
    }

    var iAr = mesh.getTriangles();
    var vAr = mesh.getVertices();
    var nbTriangles = mesh.getNbTriangles();
    for (var iTri = 0; iTri < nbTriangles; ++iTri) {
      var idTri = iTri * 3;
      var iv1 = iAr[idTri] * 3;
      var iv2 = iAr[idTri + 1] * 3;
      var iv3 = iAr[idTri + 2] * 3;

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
      var ax = v2x - v1x;
      var ay = v2y - v1y;
      var az = v2z - v1z;
      var bx = v3x - v1x;
      var by = v3y - v1y;
      var bz = v3z - v1z;
      var cx = v3x - v2x;
      var cy = v3y - v2y;
      var cz = v3z - v2z;
      var trix = triNormals[idTri] = ay * bz - az * by;
      var triy = triNormals[idTri + 1] = az * bx - ax * bz;
      var triz = triNormals[idTri + 2] = ax * by - ay * bx;
      var lenTri = Math.sqrt(trix * trix + triy * triy + triz * triz);
      trix /= lenTri;
      triy /= lenTri;
      triz /= lenTri;

      var lenE1 = Math.sqrt(ax * ax + ay * ay + az * az);
      var lenE2 = Math.sqrt(bx * bx + by * by + bz * bz);
      var lenE3 = Math.sqrt(cx * cx + cy * cy + cz * cz);

      var angle = Math.asin(lenTri / (lenE1 * lenE2));
      vertNormals[iv1] += trix * angle;
      vertNormals[iv1 + 1] += triy * angle;
      vertNormals[iv1 + 2] += triz * angle;

      angle = Math.asin(lenTri / (lenE1 * lenE3));
      vertNormals[iv2] += trix * angle;
      vertNormals[iv2 + 1] += triy * angle;
      vertNormals[iv2 + 2] += triz * angle;

      angle = Math.asin(lenTri / (lenE2 * lenE3));
      vertNormals[iv3] += trix * angle;
      vertNormals[iv3 + 1] += triy * angle;
      vertNormals[iv3 + 2] += triz * angle;

      var e1 = triToEdges[idTri] * 3;
      var e2 = triToEdges[idTri + 1] * 3;
      var e3 = triToEdges[idTri + 2] * 3;
      edgeNormals[e1] += trix;
      edgeNormals[e1 + 1] += triy;
      edgeNormals[e1 + 2] += triz;
      edgeNormals[e2] += trix;
      edgeNormals[e2 + 1] += triy;
      edgeNormals[e2 + 2] += triz;
      edgeNormals[e3] += trix;
      edgeNormals[e3 + 1] += triy;
      edgeNormals[e3 + 2] += triz;
    }
  };

  Remesh.voxelize = function (mesh, dims) {
    var stepx = dims[0][2];
    var stepy = dims[1][2];
    var stepz = dims[2][2];

    var vminx = dims[0][0];
    var vminy = dims[1][0];
    var vminz = dims[2][0];

    var res = [0, 0, 0];
    var rx = res[0] = 1 + Math.ceil((dims[0][1] - vminx) / stepx);
    var ry = res[1] = 1 + Math.ceil((dims[1][1] - vminy) / stepy);
    var rz = res[2] = 1 + Math.ceil((dims[2][1] - vminz) / stepz);
    var datalen = rx * ry * rz;
    var data = new Float32Array(Utils.getMemory(4 * datalen), 0, datalen);
    for (var idd = 0; idd < datalen; ++idd)
      data[idd] = DEBUG_HIGH;

    var iAr = mesh.getTriangles();
    var vAr = mesh.getVertices();
    var nbTriangles = mesh.getNbTriangles();

    // Maybe use utils.getMemory()...
    var triToEdges = new Int32Array(mesh.getNbTriangles() * 3);
    var edgeNormals = new Float32Array(mesh.getNbEdges() * 3 + mesh.getNbQuads() * 3);
    var vertNormals = new Float32Array(mesh.getNbVertices() * 3);
    var triNormals = new Float32Array(mesh.getNbTriangles() * 3);
    Remesh.computeAngleWeightedNormals(mesh, vertNormals, edgeNormals, triNormals, triToEdges);

    var v1 = [0.0, 0.0, 0.0];
    var v2 = [0.0, 0.0, 0.0];
    var v3 = [0.0, 0.0, 0.0];
    var point = [0.0, 0.0, 0.0];
    var closest = [0.0, 0.0, 0.0, 0];
    var rxy = rx * ry;

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

      var xmin = v1x < v2x ? v1x < v3x ? v1x : v3x : v2x < v3x ? v2x : v3x;
      var xmax = v1x > v2x ? v1x > v3x ? v1x : v3x : v2x > v3x ? v2x : v3x;
      var ymin = v1y < v2y ? v1y < v3y ? v1y : v3y : v2y < v3y ? v2y : v3y;
      var ymax = v1y > v2y ? v1y > v3y ? v1y : v3y : v2y > v3y ? v2y : v3y;
      var zmin = v1z < v2z ? v1z < v3z ? v1z : v3z : v2z < v3z ? v2z : v3z;
      var zmax = v1z > v2z ? v1z > v3z ? v1z : v3z : v2z > v3z ? v2z : v3z;

      var trix = triNormals[idTri];
      var triy = triNormals[idTri + 1];
      var triz = triNormals[idTri + 2];

      var edge = triToEdges[idTri] * 3;
      var e1x = edgeNormals[edge];
      var e1y = edgeNormals[edge + 1];
      var e1z = edgeNormals[edge + 2];
      edge = triToEdges[idTri + 1] * 3;
      var e2x = edgeNormals[edge];
      var e2y = edgeNormals[edge + 1];
      var e2z = edgeNormals[edge + 2];
      edge = triToEdges[idTri + 2] * 3;
      var e3x = edgeNormals[edge];
      var e3y = edgeNormals[edge + 1];
      var e3z = edgeNormals[edge + 2];

      var n1x = vertNormals[iv1];
      var n1y = vertNormals[iv1 + 1];
      var n1z = vertNormals[iv1 + 2];
      var n2x = vertNormals[iv2];
      var n2y = vertNormals[iv2 + 1];
      var n2z = vertNormals[iv2 + 2];
      var n3x = vertNormals[iv3];
      var n3y = vertNormals[iv3 + 1];
      var n3z = vertNormals[iv3 + 2];

      var snapMinx = Math.floor((xmin - vminx) / stepx);
      var snapMiny = Math.floor((ymin - vminy) / stepy);
      var snapMinz = Math.floor((zmin - vminz) / stepz);

      var snapMaxx = Math.ceil((xmax - vminx) / stepx);
      var snapMaxy = Math.ceil((ymax - vminy) / stepy);
      var snapMaxz = Math.ceil((zmax - vminz) / stepz);

      // for (var k = 0; k < rz; ++k) {
      //   for (var j = 0; j < ry; ++j) {
      //     for (var i = 0; i < rx; ++i) {
      for (var k = snapMinz; k <= snapMaxz; ++k) {
        for (var j = snapMiny; j <= snapMaxy; ++j) {
          for (var i = snapMinx; i <= snapMaxx; ++i) {
            var x = vminx + i * stepx;
            var y = vminy + j * stepy;
            var z = vminz + k * stepz;
            var n = i + j * rx + k * rxy;

            point[0] = x;
            point[1] = y;
            point[2] = z;
            var newDist = Geometry.distance2PointTriangle(point, v1, v2, v3, closest);
            var dx = x - closest[0];
            var dy = y - closest[1];
            var dz = z - closest[2];
            var zone = closest[3];

            var distToTriangle = 0.0;
            if (zone === 0) distToTriangle = dx * trix + dy * triy + dz * triz; // tri
            else if (zone === 5) distToTriangle = dx * e1x + dy * e1y + dz * e1z; // edge 1
            else if (zone === 1) distToTriangle = dx * e2x + dy * e2y + dz * e2z; // edge 2
            else if (zone === 3) distToTriangle = dx * e3x + dy * e3y + dz * e3z; // edge 3
            else if (zone === 4) distToTriangle = dx * n1x + dy * n1y + dz * n1z; // vertex 1
            else if (zone === 6) distToTriangle = dx * n2x + dy * n2y + dz * n2z; // vertex 2
            else distToTriangle = dx * n3x + dy * n3y + dz * n3z; // vertex 3

            var oldDist = data[n];
            if (newDist < Math.abs(oldDist))
              data[n] = distToTriangle < 0.0 ? -newDist : newDist;
          }
        }
      }
    }

    Remesh.fillVoxels(data, res);

    return {
      data: data,
      dims: res
    };
  };

  Remesh.createMesh = function (mesh, vertices, faces) {
    var newMesh = new Mesh();
    newMesh.setVertices(vertices);
    newMesh.setFaces(faces);

    console.log(mesh.getBound());

    newMesh.setTransformData(mesh.getTransformData());
    newMesh.getTransformData().mesh_ = newMesh;
    newMesh.setRender(mesh.getRender());
    newMesh.getRender().mesh_ = newMesh;

    newMesh.init(true);
    newMesh.initRender();
    console.log(mesh.getBound());

    return newMesh;
  };

  Remesh.remesh = function (mesh) {
    var box = mesh.computeAabb();
    var step = Math.max((box[3] - box[0]), (box[4] - box[1]), (box[5] - box[2])) / Remesh.resolution;
    var dims = [
      [box[0] - step, box[3], step],
      [box[1] - step, box[4], step],
      [box[2] - step, box[5], step]
    ];
    console.time('voxelization');
    var voxels = Remesh.voxelize(mesh, dims);
    console.timeEnd('voxelization');

    var min = [box[0] - step, box[1] - step, box[2] - step];
    var max = [box[3] + step, box[4] + step, box[5] + step];
    console.time('surfaceNet');
    var res = SurfaceNets.computeSurface(voxels.data, voxels.dims, [min, max]);
    console.timeEnd('surfaceNet');

    return Remesh.createMesh(mesh, res.vertices, res.faces);
  };

  return Remesh;
});