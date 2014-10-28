define([
  'mesh/Mesh'
], function (Mesh) {

  'use strict';

  var HoleFilling = {};

  var Edge = function (v1, v2) {
    this.previous = null;
    this.next = null;
    this.v1 = v1;
    this.v2 = v2;
  };

  HoleFilling.detectHole = function (borderEdges) {
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

  HoleFilling.detectHoles = function (mesh) {
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
      var firstEdge = HoleFilling.detectHole(borderEdges);
      if (!firstEdge) break;
      holes.push(firstEdge);
    }
    return holes;
  };

  HoleFilling.advancingFrontMesh = function (mesh, firstEdge, newTris, newVerts) {
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

  HoleFilling.createMesh = function (mesh, vertices, faces) {
    var newMesh = new Mesh();
    newMesh.setVertices(vertices);
    newMesh.setFaces(faces);

    // small hack
    newMesh.setTransformData(mesh.getTransformData());
    newMesh.setRender(mesh.getRender());

    newMesh.init(true);
    return newMesh;
  };

  HoleFilling.closeHoles = function (mesh) {
    var holes = HoleFilling.detectHoles(mesh);
    if (holes.length === 0)
      return mesh;
    var newFaces = [];
    var newVerts = [];
    // console.time('closeHoles');
    for (var i = 0, nbHoles = holes.length; i < nbHoles; ++i)
      HoleFilling.advancingFrontMesh(mesh, holes[i], newFaces, newVerts);
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

    return HoleFilling.createMesh(mesh, vertices, faces);
  };

  return HoleFilling;
});