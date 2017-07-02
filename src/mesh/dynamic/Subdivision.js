import { vec3 } from 'gl-matrix';
import Utils from 'misc/Utils';
import Geometry from 'math3d/Geometry';
import Smooth from 'editing/tools/Smooth';

var SubData = {
  _mesh: null,
  _linear: false, // linear subdivision
  _verticesMap: new Map(), // to detect new vertices at the middle of edge (for subdivision)
  _states: null, // for undo-redo

  _center: [0.0, 0.0, 0.0], // center point of select sphere
  _radius2: 0.0, // radius squared of select sphere

  _edgeMax2: 0.0 // maximal squared edge length before we subdivide it
};

/** Fill crack on one triangle */
var fillTriangle = function (iTri, iv1, iv2, iv3, ivMid) {
  var mesh = SubData._mesh;

  var vrv = mesh.getVerticesRingVert();
  var vrf = mesh.getVerticesRingFace();
  var pil = mesh.getFacePosInLeaf();
  var fleaf = mesh.getFaceLeaf();
  var fstf = mesh.getFacesStateFlags();
  var fAr = mesh.getFaces();

  var j = iTri * 4;
  fAr[j] = iv1;
  fAr[j + 1] = ivMid;
  fAr[j + 2] = iv3;
  fAr[j + 3] = Utils.TRI_INDEX;
  var leaf = fleaf[iTri];
  var iTrisLeaf = leaf._iFaces;

  vrv[ivMid].push(iv3);
  vrv[iv3].push(ivMid);

  var iNewTri = mesh.getNbTriangles();
  vrf[ivMid].push(iTri, iNewTri);

  j = iNewTri * 4;
  fAr[j] = ivMid;
  fAr[j + 1] = iv2;
  fAr[j + 2] = iv3;
  fAr[j + 3] = Utils.TRI_INDEX;
  fstf[iNewTri] = Utils.STATE_FLAG;
  fleaf[iNewTri] = leaf;
  pil[iNewTri] = iTrisLeaf.length;

  vrf[iv3].push(iNewTri);
  Utils.replaceElement(vrf[iv2], iTri, iNewTri);

  iTrisLeaf.push(iNewTri);
  mesh.addNbFace(1);
};

/**
 * Fill the triangles. It checks if a newly vertex has been created at the middle
 * of the edge. If several split are needed, it first chooses the split that minimize
 * the valence of the vertex.
 */
var fillTriangles = function (iTris) {
  var mesh = SubData._mesh;
  var vrv = mesh.getVerticesRingVert();
  var fAr = mesh.getFaces();

  var nbTris = iTris.length;
  var iTrisNext = new Uint32Array(Utils.getMemory(4 * 2 * nbTris), 0, 2 * nbTris);
  var nbNext = 0;
  var vMap = SubData._verticesMap;
  for (var i = 0; i < nbTris; ++i) {
    var iTri = iTris[i];
    var j = iTri * 4;
    var iv1 = fAr[j];
    var iv2 = fAr[j + 1];
    var iv3 = fAr[j + 2];

    var val1 = vMap.get(Math.min(iv1, iv2) + '+' + Math.max(iv1, iv2));
    var val2 = vMap.get(Math.min(iv2, iv3) + '+' + Math.max(iv2, iv3));
    var val3 = vMap.get(Math.min(iv1, iv3) + '+' + Math.max(iv1, iv3));

    var num1 = vrv[iv1].length;
    var num2 = vrv[iv2].length;
    var num3 = vrv[iv3].length;
    var split = 0;
    if (val1) {
      if (val2) {
        if (val3) {
          if (num1 < num2 && num1 < num3) split = 2;
          else if (num2 < num3) split = 3;
          else split = 1;
        } else if (num1 < num3) split = 2;
        else split = 1;
      } else if (val3 && num2 < num3) split = 3;
      else split = 1;
    } else if (val2) {
      if (val3 && num2 < num1) split = 3;
      else split = 2;
    } else if (val3) split = 3;

    if (split === 1) fillTriangle(iTri, iv1, iv2, iv3, val1);
    else if (split === 2) fillTriangle(iTri, iv2, iv3, iv1, val2);
    else if (split === 3) fillTriangle(iTri, iv3, iv1, iv2, val3);
    else continue;
    iTrisNext[nbNext++] = iTri;
    iTrisNext[nbNext++] = mesh.getNbTriangles() - 1;
  }
  return new Uint32Array(iTrisNext.subarray(0, nbNext));
};

/**
 * Subdivide one triangle, it simply cut the triangle in two at a given edge.
 * The position of the vertex is computed as follow :
 * 1. Initial position of the new vertex at the middle of the edge
 * 2. Compute normal of the new vertex (average of the two normals of the two vertices defining the edge)
 * 3. Compute angle between those two normals
 * 4. Move the new vertex along its normal with a strengh proportional to the angle computed at step 3.
 */
var halfEdgeSplit = function (iTri, iv1, iv2, iv3) {
  var mesh = SubData._mesh;
  var vAr = mesh.getVertices();
  var nAr = mesh.getNormals();
  var cAr = mesh.getColors();
  var mAr = mesh.getMaterials();
  var fAr = mesh.getFaces();

  var pil = mesh.getFacePosInLeaf();
  var fleaf = mesh.getFaceLeaf();
  var vrv = mesh.getVerticesRingVert();
  var vrf = mesh.getVerticesRingFace();
  var fstf = mesh.getFacesStateFlags();
  var vstf = mesh.getVerticesStateFlags();

  var vMap = SubData._verticesMap;
  var key = Math.min(iv1, iv2) + '+' + Math.max(iv1, iv2);
  var isNewVertex = false;
  var ivMid = vMap.get(key);
  if (ivMid === undefined) {
    ivMid = mesh.getNbVertices();
    isNewVertex = true;
    vMap.set(key, ivMid);
  }

  vrv[iv3].push(ivMid);
  var id = iTri * 4;
  fAr[id] = iv1;
  fAr[id + 1] = ivMid;
  fAr[id + 2] = iv3;
  fAr[id + 3] = Utils.TRI_INDEX;

  var iNewTri = mesh.getNbTriangles();
  id = iNewTri * 4;
  fAr[id] = ivMid;
  fAr[id + 1] = iv2;
  fAr[id + 2] = iv3;
  fAr[id + 3] = Utils.TRI_INDEX;
  fstf[iNewTri] = Utils.STATE_FLAG;

  vrf[iv3].push(iNewTri);
  Utils.replaceElement(vrf[iv2], iTri, iNewTri);
  var leaf = fleaf[iTri];
  var iTrisLeaf = leaf._iFaces;
  fleaf[iNewTri] = leaf;
  pil[iNewTri] = iTrisLeaf.length;
  iTrisLeaf.push(iNewTri);

  if (!isNewVertex) {
    vrv[ivMid].push(iv3);
    vrf[ivMid].push(iTri, iNewTri);
    mesh.addNbFace(1);
    return;
  }

  //new vertex
  var id1 = iv1 * 3;
  var v1x = vAr[id1];
  var v1y = vAr[id1 + 1];
  var v1z = vAr[id1 + 2];
  var n1x = nAr[id1];
  var n1y = nAr[id1 + 1];
  var n1z = nAr[id1 + 2];

  var id2 = iv2 * 3;
  var v2x = vAr[id2];
  var v2y = vAr[id2 + 1];
  var v2z = vAr[id2 + 2];
  var n2x = nAr[id2];
  var n2y = nAr[id2 + 1];
  var n2z = nAr[id2 + 2];

  var n1n2x = n1x + n2x;
  var n1n2y = n1y + n2y;
  var n1n2z = n1z + n2z;
  id = ivMid * 3;
  nAr[id] = n1n2x * 0.5;
  nAr[id + 1] = n1n2y * 0.5;
  nAr[id + 2] = n1n2z * 0.5;
  cAr[id] = (cAr[id1] + cAr[id2]) * 0.5;
  cAr[id + 1] = (cAr[id1 + 1] + cAr[id2 + 1]) * 0.5;
  cAr[id + 2] = (cAr[id1 + 2] + cAr[id2 + 2]) * 0.5;
  mAr[id] = (mAr[id1] + mAr[id2]) * 0.5;
  mAr[id + 1] = (mAr[id1 + 1] + mAr[id2 + 1]) * 0.5;
  mAr[id + 2] = (mAr[id1 + 2] + mAr[id2 + 2]) * 0.5;

  if (SubData._linear) {
    vAr[id] = (v1x + v2x) * 0.5;
    vAr[id + 1] = (v1y + v2y) * 0.5;
    vAr[id + 2] = (v1z + v2z) * 0.5;
  } else {
    var len = n1x * n1x + n1y * n1y + n1z * n1z;
    if (len === 0.0) {
      n1x = 1.0;
    } else {
      len = 1.0 / Math.sqrt(len);
      n1x *= len;
      n1y *= len;
      n1z *= len;
    }
    len = n2x * n2x + n2y * n2y + n2z * n2z;
    if (len === 0.0) {
      n2x = 1.0;
    } else {
      len = 1.0 / Math.sqrt(len);
      n2x *= len;
      n2y *= len;
      n2z *= len;
    }
    var dot = n1x * n2x + n1y * n2y + n1z * n2z;
    var angle = 0;
    if (dot <= -1) angle = Math.PI;
    else if (dot >= 1) angle = 0;
    else angle = Math.acos(dot);

    var edgex = v1x - v2x;
    var edgey = v1y - v2y;
    var edgez = v1z - v2z;
    var offset = angle * 0.12;
    offset *= Math.sqrt(edgex * edgex + edgey * edgey + edgez * edgez);
    len = n1n2x * n1n2x + n1n2y * n1n2y + n1n2z * n1n2z;
    if (len > 0) offset /= Math.sqrt(len);

    if ((edgex * (n1x - n2x) + edgey * (n1y - n2y) + edgez * (n1z - n2z)) < 0)
      offset = -offset;
    vAr[id] = (v1x + v2x) * 0.5 + n1n2x * offset;
    vAr[id + 1] = (v1y + v2y) * 0.5 + n1n2y * offset;
    vAr[id + 2] = (v1z + v2z) * 0.5 + n1n2z * offset;
  }

  vstf[ivMid] = Utils.STATE_FLAG;
  vrv[ivMid] = [iv1, iv2, iv3];
  vrf[ivMid] = [iTri, iNewTri];
  Utils.replaceElement(vrv[iv1], iv2, ivMid);
  Utils.replaceElement(vrv[iv2], iv1, ivMid);
  mesh.addNbVertice(1);
  mesh.addNbFace(1);
};

/** Find the edge to be split (0 otherwise) */
var findSplit = (function () {
  var v1 = [0.0, 0.0, 0.0];
  var v2 = [0.0, 0.0, 0.0];
  var v3 = [0.0, 0.0, 0.0];
  var tis = Geometry.triangleInsideSphere;
  var pit = Geometry.pointInsideTriangle;
  return function (iTri, checkInsideSphere) {
    var mesh = SubData._mesh;
    var vAr = mesh.getVertices();
    var fAr = mesh.getFaces();

    var id = iTri * 4;
    var ind1 = fAr[id] * 3;
    var ind2 = fAr[id + 1] * 3;
    var ind3 = fAr[id + 2] * 3;
    v1[0] = vAr[ind1];
    v1[1] = vAr[ind1 + 1];
    v1[2] = vAr[ind1 + 2];
    v2[0] = vAr[ind2];
    v2[1] = vAr[ind2 + 1];
    v2[2] = vAr[ind2 + 2];
    v3[0] = vAr[ind3];
    v3[1] = vAr[ind3 + 1];
    v3[2] = vAr[ind3 + 2];

    if (checkInsideSphere && !tis(SubData._center, SubData._radius2, v1, v2, v3) && !pit(SubData._center, v1, v2, v3))
      return 0;

    var mAr = mesh.getMaterials();
    var m1 = mAr[ind1 + 2];
    var m2 = mAr[ind2 + 2];
    var m3 = mAr[ind3 + 2];

    var length1 = vec3.sqrDist(v1, v2);
    var length2 = vec3.sqrDist(v2, v3);
    var length3 = vec3.sqrDist(v1, v3);
    if (length1 > length2 && length1 > length3) return (m1 + m2) * 0.5 * length1 > SubData._edgeMax2 ? 1 : 0;
    else if (length2 > length3) return (m2 + m3) * 0.5 * length2 > SubData._edgeMax2 ? 2 : 0;
    else return (m1 + m3) * 0.5 * length3 > SubData._edgeMax2 ? 3 : 0;
  };
})();

/** Subdivide all the triangles that need to be subdivided */
var subdivideTriangles = function (iTrisSubd, split) {
  var fAr = SubData._mesh.getFaces();
  var nbTris = iTrisSubd.length;
  for (var i = 0; i < nbTris; ++i) {
    var iTri = iTrisSubd[i];
    var splitNum = split[i];
    if (splitNum === 0) splitNum = findSplit(iTri);
    var ind = iTri * 4;
    if (splitNum === 1) halfEdgeSplit(iTri, fAr[ind], fAr[ind + 1], fAr[ind + 2]);
    else if (splitNum === 2) halfEdgeSplit(iTri, fAr[ind + 1], fAr[ind + 2], fAr[ind]);
    else if (splitNum === 3) halfEdgeSplit(iTri, fAr[ind + 2], fAr[ind], fAr[ind + 1]);
  }
};

/** Detect which triangles to split and the edge that need to be split */
var initSplit = function (iTris) {
  var nbTris = iTris.length;

  var buffer = Utils.getMemory((4 + 1) * nbTris);
  var iTrisSubd = new Uint32Array(buffer, 0, nbTris);
  var split = new Uint8Array(buffer, 4 * nbTris, nbTris);

  var acc = 0;
  for (var i = 0; i < nbTris; ++i) {
    var iTri = iTris[i];
    var splitNum = findSplit(iTri, true);
    if (splitNum === 0) continue;
    split[acc] = splitNum;
    iTrisSubd[acc++] = iTri;
  }
  return [new Uint32Array(iTrisSubd.subarray(0, acc)), new Uint8Array(split.subarray(0, acc))];
};

/**
 * Subdivide a set of triangle. Main steps are :
 * 1. Detect the triangles that need to be split, and at which edge the split should occur
 * 2. Subdivide all those triangles (split them in two)
 * 3. Take the 2-ring neighborhood of the triangles that have been split
 * 4. Fill the triangles (just create an edge where it's needed)
 * 5. Smooth newly created vertices (along the plane defined by their own normals)
 * 6. Tag the newly created vertices if they are inside the sculpt brush radius
 */
var subdivide = function (iTris) {
  var mesh = SubData._mesh;
  var nbVertsInit = mesh.getNbVertices();
  var nbTrisInit = mesh.getNbTriangles();
  SubData._verticesMap = new Map();

  var res = initSplit(iTris);
  var iTrisSubd = res[0];
  var split = res[1];
  if (iTrisSubd.length > 5) {
    iTrisSubd = mesh.expandsFaces(iTrisSubd, 3);
    split = new Uint8Array(iTrisSubd.length);
    split.set(res[1]);
  }

  // undo-redo
  SubData._states.pushVertices(mesh.getVerticesFromFaces(iTrisSubd));
  SubData._states.pushFaces(iTrisSubd);

  mesh.reAllocateArrays(split.length);
  subdivideTriangles(iTrisSubd, split);

  var i = 0;
  var nbNewTris = mesh.getNbTriangles() - nbTrisInit;
  var newTriangles = new Uint32Array(nbNewTris);
  for (i = 0; i < nbNewTris; ++i)
    newTriangles[i] = nbTrisInit + i;
  newTriangles = mesh.expandsFaces(newTriangles, 1);

  // undo-redo
  iTrisSubd = newTriangles.subarray(nbNewTris);
  SubData._states.pushVertices(mesh.getVerticesFromFaces(iTrisSubd));
  SubData._states.pushFaces(iTrisSubd);

  var temp = iTris;
  var nbTris = iTris.length;
  iTris = new Uint32Array(nbTris + newTriangles.length);
  iTris.set(temp);
  iTris.set(newTriangles, nbTris);

  var ftf = mesh.getFacesTagFlags();
  var nbTrisMask = iTris.length;
  var iTrisMask = new Uint32Array(Utils.getMemory(nbTrisMask * 4), 0, nbTrisMask);
  var nbTriMask = 0;
  var tagFlag = ++Utils.TAG_FLAG;
  for (i = 0; i < nbTrisMask; ++i) {
    var iTri = iTris[i];
    if (ftf[iTri] === tagFlag)
      continue;
    ftf[iTri] = tagFlag;
    iTrisMask[nbTriMask++] = iTri;
  }
  iTrisMask = new Uint32Array(iTrisMask.subarray(0, nbTriMask));

  var nbTrianglesOld = mesh.getNbTriangles();
  while (newTriangles.length > 0) {
    mesh.reAllocateArrays(newTriangles.length);
    newTriangles = fillTriangles(newTriangles);
  }

  nbNewTris = mesh.getNbTriangles() - nbTrianglesOld;
  temp = iTrisMask;
  iTrisMask = new Uint32Array(nbTriMask + nbNewTris);
  iTrisMask.set(temp);
  for (i = 0; i < nbNewTris; ++i)
    iTrisMask[nbTriMask + i] = nbTrianglesOld + i;

  var nbVNew = mesh.getNbVertices() - nbVertsInit;
  var vNew = new Uint32Array(nbVNew);
  for (i = 0; i < nbVNew; ++i)
    vNew[i] = nbVertsInit + i;

  vNew = mesh.expandsVertices(vNew, 1);
  if (!SubData._linear) {
    var expV = vNew.subarray(nbVNew);
    var smo = new Smooth();
    smo.setToolMesh(mesh);
    smo.smoothTangent(expV, 1.0);
  }

  var vAr = mesh.getVertices();
  var vscf = mesh.getVerticesSculptFlags();
  var centerPoint = SubData._center;
  var xcen = centerPoint[0];
  var ycen = centerPoint[1];
  var zcen = centerPoint[2];

  var vertexSculptMask = Utils.SCULPT_FLAG;
  nbVNew = vNew.length;
  for (i = 0; i < nbVNew; ++i) {
    var ind = vNew[i];
    var j = ind * 3;
    var dx = vAr[j] - xcen;
    var dy = vAr[j + 1] - ycen;
    var dz = vAr[j + 2] - zcen;
    vscf[ind] = (dx * dx + dy * dy + dz * dz) < SubData._radius2 ? vertexSculptMask : vertexSculptMask - 1;
  }
  return iTrisMask;
};

var Subdivision = {};

/** Subdivide until every selected triangles comply with a detail level */
Subdivision.subdivision = function (mesh, iTris, center, radius2, detail2, states, linear) {
  SubData._mesh = mesh;
  SubData._linear = linear;
  vec3.copy(SubData._center, center);
  SubData._radius2 = radius2;
  SubData._edgeMax2 = detail2;
  SubData._states = states;

  var nbTriangles = 0;
  while (nbTriangles !== mesh.getNbTriangles()) {
    nbTriangles = mesh.getNbTriangles();
    iTris = subdivide(iTris);
  }
  return iTris;
};

export default Subdivision;
