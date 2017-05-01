import Utils from 'misc/Utils';
import MeshStatic from 'mesh/meshStatic/MeshStatic';
import Mesh from 'mesh/Mesh';

var Edge = function (v1, v2) {
  this.previous = null;
  this.next = null;
  this.v1 = v1;
  this.v2 = v2;
};

var detectHole = function (borderEdges) {
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
      last.next = testEdge;
      last = testEdge;
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

var detectHoles = function (mesh) {
  var eAr = mesh.getEdges();
  var fAr = mesh.getFaces();
  var feAr = mesh.getFaceEdges();
  var borderEdges = [];
  for (var i = 0, len = mesh.getNbFaces(); i < len; ++i) {
    var id = i * 4;
    var iv4 = feAr[id + 3];
    var isQuad = iv4 !== Utils.TRI_INDEX;
    if (eAr[feAr[id]] === 1) borderEdges.push(new Edge(fAr[id], fAr[id + 1]));
    if (eAr[feAr[id + 1]] === 1) borderEdges.push(new Edge(fAr[id + 1], fAr[id + 2]));
    if (eAr[feAr[id + 2]] === 1) borderEdges.push(new Edge(fAr[id + 2], fAr[isQuad ? id + 3 : id]));
    if (isQuad && eAr[iv4] === 1) borderEdges.push(new Edge(fAr[id + 3], fAr[id]));
  }

  var holes = [];
  while (true) {
    var firstEdge = detectHole(borderEdges);
    if (!firstEdge) break;
    holes.push(firstEdge);
  }
  return holes;
};

var advancingFrontMesh = function (mesh, firstEdge, newTris, newVerts, newColors, newMaterials) {
  var vAr = mesh.getVertices();
  var cAr = mesh.getColors();
  var mAr = mesh.getMaterials();
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

  var colr = 0.0;
  var colg = 0.0;
  var colb = 0.0;

  var mat1 = 0.0;
  var mat2 = 0.0;
  var mat3 = 0.0;
  var count = 0;
  do {
    var next = current.next;
    var iv1 = current.v1;
    var iv2 = current.v2;
    var iv3 = next.v2;

    newTris.push(iv1, iv2, last, Utils.TRI_INDEX);
    iv1 *= 3;
    iv2 *= 3;
    iv3 *= 3;
    count++;
    avx += vAr[iv1];
    avy += vAr[iv1 + 1];
    avz += vAr[iv1 + 2];

    colr += cAr[iv1];
    colg += cAr[iv1 + 1];
    colb += cAr[iv1 + 2];

    mat1 += mAr[iv1];
    mat2 += mAr[iv1 + 1];
    mat3 += mAr[iv1 + 2];

    var v2x = vAr[iv2];
    var v2y = vAr[iv2 + 1];
    var v2z = vAr[iv2 + 2];
    // compute normals
    var ax = vAr[iv1] - v2x;
    var ay = vAr[iv1 + 1] - v2y;
    var az = vAr[iv1 + 2] - v2z;
    var bx = vAr[iv3] - v2x;
    var by = vAr[iv3 + 1] - v2y;
    var bz = vAr[iv3 + 2] - v2z;
    var alen = ax * ax + ay * ay + az * az;
    var blen = bx * bx + by * by + bz * bz;
    current.angle = Math.acos((ax * bx + ay * by + az * bz) / Math.sqrt(alen * blen));
    current = next;
  } while (current !== firstEdge);

  newVerts.push(avx / count, avy / count, avz / count);
  newColors.push(colr / count, colg / count, colb / count);
  newMaterials.push(mat1 / count, mat2 / count, mat3 / count);
};

var createMesh = function (mesh, vertices, faces, colors, materials) {
  var newMesh = new MeshStatic();
  newMesh.setID(mesh.getID());
  newMesh.setVertices(vertices);
  if (colors) newMesh.setColors(colors);
  if (materials) newMesh.setMaterials(materials);
  newMesh.setFaces(faces);

  // small hack
  newMesh.setTransformData(mesh.getTransformData());
  newMesh.setRenderData(mesh.getRenderData());

  Mesh.OPTIMIZE = false;
  newMesh.init();
  Mesh.OPTIMIZE = true;

  return newMesh;
};

var closeHoles = function (mesh) {
  var holes = detectHoles(mesh);
  if (holes.length === 0)
    return mesh;

  var newFaces = [];
  var newVerts = [];
  var newColors = [];
  var newMaterials = [];
  // console.time('closeHoles');
  for (var i = 0, nbHoles = holes.length; i < nbHoles; ++i)
    advancingFrontMesh(mesh, holes[i], newFaces, newVerts, newColors, newMaterials);
  // console.timeEnd('closeHoles');

  var oldVertsLen = mesh.getNbVertices() * 3;
  var newVertsLen = oldVertsLen + newVerts.length;

  // set vertices
  var vertices = new Float32Array(newVertsLen);
  vertices.set(mesh.getVertices().subarray(0, oldVertsLen));
  // set colors
  var colors = new Float32Array(newVertsLen);
  colors.set(mesh.getColors().subarray(0, oldVertsLen));
  // set materials
  var materials = new Float32Array(newVertsLen);
  materials.set(mesh.getMaterials().subarray(0, oldVertsLen));

  if (newVertsLen > oldVertsLen) {
    vertices.set(newVerts, oldVertsLen);
    colors.set(newColors, oldVertsLen);
    materials.set(newMaterials, oldVertsLen);
  }

  // set faces
  var faces = new Uint32Array(mesh.getNbFaces() * 4 + newFaces.length);
  faces.set(mesh.getFaces());
  if (newFaces.length > 0)
    faces.set(newFaces, mesh.getNbFaces() * 4);

  return createMesh(mesh, vertices, faces, colors, materials);
};

var HoleFilling = {};

HoleFilling.createClosedMesh = function (mesh) {
  var closed = closeHoles(mesh);
  if (closed === mesh) {
    var lenv = mesh.getNbVertices() * 3;
    var lenf = mesh.getNbFaces() * 4;
    var faces = new Uint32Array(mesh.getFaces().subarray(0, lenf));
    var vertices = new Float32Array(mesh.getVertices().subarray(0, lenv));
    var colors = new Float32Array(mesh.getColors().subarray(0, lenv));
    var materials = new Float32Array(mesh.getMaterials().subarray(0, lenv));
    closed = createMesh(mesh, vertices, faces, colors, materials);
  }
  return closed;
};

export default HoleFilling;
