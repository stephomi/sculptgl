import Utils from 'misc/Utils';
import Subdivision from 'editing/Subdivision';
import Mesh from 'mesh/Mesh';
import createMeshData from 'mesh/MeshData';

class MeshResolution extends Mesh {

  constructor(mesh, keepMesh) {
    super();

    this.setID(mesh.getID());
    this.setMeshData(keepMesh ? mesh.getMeshData() : createMeshData());
    this.setRenderData(mesh.getRenderData());
    this.setTransformData(mesh.getTransformData());

    this._detailsXYZ = null; // details vectors (Float32Array)
    this._detailsRGB = null; // details vectors (Float32Array)
    this._detailsPBR = null; // details vectors (Float32Array)
    this._vertMapping = null; // vertex mapping to higher res (Uint32Array)
    this._evenMapping = false; // if the even vertices are not aligned with higher res
  }

  optimize() {}

  getEvenMapping() {
    return this._evenMapping;
  }

  getVerticesMapping() {
    return this._vertMapping;
  }

  setVerticesMapping(vmAr) {
    this._vertMapping = vmAr;
  }

  setEvenMapping(bool) {
    this._evenMapping = bool;
  }

  /** Go to one level above (down to up) */
  higherSynthesis(meshDown) {
    meshDown.computePartialSubdivision(this.getVertices(), this.getColors(), this.getMaterials(), this.getNbVertices());
    this.applyDetails();
  }

  /** Go to one level below (up to down) */
  lowerAnalysis(meshUp) {
    this.copyDataFromHigherRes(meshUp);
    var nbVertices = meshUp.getNbVertices();
    var subdVerts = new Float32Array(nbVertices * 3);
    var subdColors = new Float32Array(nbVertices * 3);
    var subdMaterials = new Float32Array(nbVertices * 3);

    this.computePartialSubdivision(subdVerts, subdColors, subdMaterials, nbVertices);
    meshUp.computeDetails(subdVerts, subdColors, subdMaterials, nbVertices);
  }

  copyDataFromHigherRes(meshUp) {
    var vArDown = this.getVertices();
    var cArDown = this.getColors();
    var mArDown = this.getMaterials();
    var nbVertices = this.getNbVertices();
    var vArUp = meshUp.getVertices();
    var cArUp = meshUp.getColors();
    var mArUp = meshUp.getMaterials();

    if (this.getEvenMapping() === false) {
      vArDown.set(vArUp.subarray(0, nbVertices * 3));
      cArDown.set(cArUp.subarray(0, nbVertices * 3));
      mArDown.set(mArUp.subarray(0, nbVertices * 3));
    } else {
      var vertMap = this.getVerticesMapping();
      for (var i = 0; i < nbVertices; ++i) {
        var id = i * 3;
        var idUp = vertMap[i] * 3;
        vArDown[id] = vArUp[idUp];
        vArDown[id + 1] = vArUp[idUp + 1];
        vArDown[id + 2] = vArUp[idUp + 2];
        cArDown[id] = cArUp[idUp];
        cArDown[id + 1] = cArUp[idUp + 1];
        cArDown[id + 2] = cArUp[idUp + 2];
        mArDown[id] = mArUp[idUp];
        mArDown[id + 1] = mArUp[idUp + 1];
        mArDown[id + 2] = mArUp[idUp + 2];
      }
    }
  }

  computePartialSubdivision(subdVerts, subdColors, subdMaterials, nbVerticesUp) {
    var vertMap = this.getVerticesMapping();
    if (!vertMap) {
      Subdivision.partialSubdivision(this, subdVerts, subdColors, subdMaterials);
      return;
    }

    var verts = new Float32Array(nbVerticesUp * 3);
    var colors = new Float32Array(nbVerticesUp * 3);
    var materials = new Float32Array(nbVerticesUp * 3);

    Subdivision.partialSubdivision(this, verts, colors, materials);

    var startMapping = this.getEvenMapping() === true ? 0 : this.getNbVertices();
    if (startMapping > 0) {
      subdVerts.set(verts.subarray(0, startMapping * 3));
      subdColors.set(colors.subarray(0, startMapping * 3));
      subdMaterials.set(materials.subarray(0, startMapping * 3));
    }

    for (var i = startMapping; i < nbVerticesUp; ++i) {
      var id = i * 3;
      var idUp = vertMap[i] * 3;
      subdVerts[idUp] = verts[id];
      subdVerts[idUp + 1] = verts[id + 1];
      subdVerts[idUp + 2] = verts[id + 2];
      subdColors[idUp] = colors[id];
      subdColors[idUp + 1] = colors[id + 1];
      subdColors[idUp + 2] = colors[id + 2];
      subdMaterials[idUp] = materials[id];
      subdMaterials[idUp + 1] = materials[id + 1];
      subdMaterials[idUp + 2] = materials[id + 2];
    }
  }

  /** Apply back the detail vectors */
  applyDetails() {
    var vrvStartCountUp = this.getVerticesRingVertStartCount();
    var vertRingVertUp = this.getVerticesRingVert();
    var vArUp = this.getVertices();
    var nArUp = this.getNormals();
    var cArUp = this.getColors();
    var mArUp = this.getMaterials();
    var nbVerticesUp = this.getNbVertices();

    var vArTemp = new Float32Array(Utils.getMemory(nbVerticesUp * 3 * 4), 0, nbVerticesUp * 3);
    vArTemp.set(vArUp.subarray(0, nbVerticesUp * 3));

    var dAr = this._detailsXYZ;
    var dColorAr = this._detailsRGB;
    var dMaterialAr = this._detailsPBR;

    var min = Math.min;
    var max = Math.max;
    for (var i = 0; i < nbVerticesUp; ++i) {
      var j = i * 3;

      // color delta vec
      cArUp[j] = min(1.0, max(0.0, cArUp[j] + dColorAr[j]));
      cArUp[j + 1] = min(1.0, max(0.0, cArUp[j + 1] + dColorAr[j + 1]));
      cArUp[j + 2] = min(1.0, max(0.0, cArUp[j + 2] + dColorAr[j + 2]));

      // material delta vec
      mArUp[j] = min(1.0, max(0.0, mArUp[j] + dMaterialAr[j]));
      mArUp[j + 1] = min(1.0, max(0.0, mArUp[j + 1] + dMaterialAr[j + 1]));
      mArUp[j + 2] = min(1.0, max(0.0, mArUp[j + 2] + dMaterialAr[j + 2]));

      // vertex coord
      var vx = vArTemp[j];
      var vy = vArTemp[j + 1];
      var vz = vArTemp[j + 2];

      // normal vec
      var nx = nArUp[j];
      var ny = nArUp[j + 1];
      var nz = nArUp[j + 2];
      // normalize vector
      var len = nx * nx + ny * ny + nz * nz;
      if (len === 0.0)
        continue;

      len = 1.0 / Math.sqrt(len);
      nx *= len;
      ny *= len;
      nz *= len;

      // tangent vec (vertex neighbor - vertex)
      var k = vertRingVertUp[vrvStartCountUp[i * 2]] * 3;
      var tx = vArTemp[k] - vx;
      var ty = vArTemp[k + 1] - vy;
      var tz = vArTemp[k + 2] - vz;
      // distance to normal plane
      len = tx * nx + ty * ny + tz * nz;
      // project on normal plane
      tx -= nx * len;
      ty -= ny * len;
      tz -= nz * len;
      // normalize vector
      len = tx * tx + ty * ty + tz * tz;
      if (len === 0.0)
        continue;

      len = 1.0 / Math.sqrt(len);
      tx *= len;
      ty *= len;
      tz *= len;

      // bi normal/tangent
      var bix = ny * tz - nz * ty;
      var biy = nz * tx - nx * tz;
      var biz = nx * ty - ny * tx;

      // displacement/detail vector (object space)
      var dx = dAr[j];
      var dy = dAr[j + 1];
      var dz = dAr[j + 2];

      // detail vec in the local frame
      vArUp[j] = vx + nx * dx + tx * dy + bix * dz;
      vArUp[j + 1] = vy + ny * dx + ty * dy + biy * dz;
      vArUp[j + 2] = vz + nz * dx + tz * dy + biz * dz;
    }
  }

  /** Compute the detail vectors */
  computeDetails(subdVerts, subdColors, subdMaterials, nbVerticesUp) {
    var vrvStartCountUp = this.getVerticesRingVertStartCount();
    var vertRingVertUp = this.getVerticesRingVert();
    var vArUp = this.getVertices();
    var nArUp = this.getNormals();
    var cArUp = this.getColors();
    var mArUp = this.getMaterials();
    var nbVertices = this.getNbVertices();

    var dAr = this._detailsXYZ = new Float32Array(nbVerticesUp * 3);
    var dColorAr = this._detailsRGB = new Float32Array(nbVerticesUp * 3);
    var dMaterialAr = this._detailsPBR = new Float32Array(nbVerticesUp * 3);

    for (var i = 0; i < nbVertices; ++i) {
      var j = i * 3;

      // color delta vec
      dColorAr[j] = cArUp[j] - subdColors[j];
      dColorAr[j + 1] = cArUp[j + 1] - subdColors[j + 1];
      dColorAr[j + 2] = cArUp[j + 2] - subdColors[j + 2];

      // material delta vec
      dMaterialAr[j] = mArUp[j] - subdMaterials[j];
      dMaterialAr[j + 1] = mArUp[j + 1] - subdMaterials[j + 1];
      dMaterialAr[j + 2] = mArUp[j + 2] - subdMaterials[j + 2];

      // normal vec
      var nx = nArUp[j];
      var ny = nArUp[j + 1];
      var nz = nArUp[j + 2];
      // normalize vector
      var len = nx * nx + ny * ny + nz * nz;
      if (len === 0.0)
        continue;
      len = 1.0 / Math.sqrt(len);
      nx *= len;
      ny *= len;
      nz *= len;

      // tangent vec (vertex neighbor - vertex)
      var k = vertRingVertUp[vrvStartCountUp[i * 2]] * 3;
      var tx = subdVerts[k] - subdVerts[j];
      var ty = subdVerts[k + 1] - subdVerts[j + 1];
      var tz = subdVerts[k + 2] - subdVerts[j + 2];
      // distance to normal plane
      len = tx * nx + ty * ny + tz * nz;
      // project on normal plane
      tx -= nx * len;
      ty -= ny * len;
      tz -= nz * len;
      // normalize vector
      len = tx * tx + ty * ty + tz * tz;
      if (len === 0.0)
        continue;
      len = 1.0 / Math.sqrt(len);
      tx *= len;
      ty *= len;
      tz *= len;

      // bi normal/tangent
      var bix = ny * tz - nz * ty;
      var biy = nz * tx - nx * tz;
      var biz = nx * ty - ny * tx;

      // displacement/detail vector (object space)
      var dx = vArUp[j] - subdVerts[j];
      var dy = vArUp[j + 1] - subdVerts[j + 1];
      var dz = vArUp[j + 2] - subdVerts[j + 2];

      // order : n/t/bi
      dAr[j] = nx * dx + ny * dy + nz * dz;
      dAr[j + 1] = tx * dx + ty * dy + tz * dz;
      dAr[j + 2] = bix * dx + biy * dy + biz * dz;
    }
  }
}

export default MeshResolution;
