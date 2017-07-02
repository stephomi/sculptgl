import { vec3, mat3 } from 'gl-matrix';
import Utils from 'misc/Utils';
import SculptBase from 'editing/tools/SculptBase';
import Paint from 'editing/tools/Paint';
import Smooth from 'editing/tools/Smooth';
import MeshStatic from 'mesh/meshStatic/MeshStatic';

class Masking extends SculptBase {

  constructor(main) {
    super(main);

    this._radius = 50;
    this._hardness = 0.25;
    this._intensity = 1.0;
    this._negative = true;
    this._culling = false;
    this._idAlpha = 0;
    this._lockPosition = false;

    this._thickness = 1.0;
  }

  pushState() {
    // too lazy to add a pushStateMaterial
    this._main.getStateManager().pushStateColorAndMaterial(this.getMesh());
  }

  updateMeshBuffers() {
    var mesh = this.getMesh();
    if (mesh.isDynamic)
      mesh.updateBuffers();
    else
      mesh.updateMaterialBuffer();
  }

  stroke(picking) {
    Paint.prototype.stroke.call(this, picking);
  }

  dynamicTopology(picking) {
    // no dynamic topo with masking
    return picking.getPickedVertices();
  }

  /** Paint color vertices */
  paint(iVerts, center, radiusSquared, intensity, hardness, picking) {
    var mesh = this.getMesh();
    var vAr = mesh.getVertices();
    var mAr = mesh.getMaterials();
    var radius = Math.sqrt(radiusSquared);
    var cx = center[0];
    var cy = center[1];
    var cz = center[2];
    var softness = 2 * (1 - hardness);
    var maskIntensity = this._negative ? -intensity : intensity;
    for (var i = 0, l = iVerts.length; i < l; ++i) {
      var ind = iVerts[i] * 3;
      var vx = vAr[ind];
      var vy = vAr[ind + 1];
      var vz = vAr[ind + 2];
      var dx = vx - cx;
      var dy = vy - cy;
      var dz = vz - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (dist > 1) dist = 1.0;

      var fallOff = Math.pow(1.0 - dist, softness);
      fallOff *= maskIntensity * picking.getAlpha(vx, vy, vz);
      mAr[ind + 2] = Math.min(Math.max(mAr[ind + 2] + fallOff, 0.0), 1.0);
    }
  }

  updateAndRenderMask() {
    var mesh = this.getMesh();
    mesh.updateDuplicateColorsAndMaterials();
    mesh.updateDrawArrays();
    this.updateRender();
  }

  blur() {
    var mesh = this.getMesh();
    var iVerts = this.getMaskedVertices();
    if (iVerts.length === 0)
      return;
    iVerts = mesh.expandsVertices(iVerts, 1);

    this.pushState();
    this._main.getStateManager().pushVertices(iVerts);

    var mAr = mesh.getMaterials();
    var nbVerts = iVerts.length;
    var smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts, mAr);
    for (var i = 0; i < nbVerts; ++i)
      mAr[iVerts[i] * 3 + 2] = smoothVerts[i * 3 + 2];
    this.updateAndRenderMask();
  }

  sharpen() {
    var mesh = this.getMesh();
    var iVerts = this.getMaskedVertices();
    if (iVerts.length === 0)
      return;

    this.pushState();
    this._main.getStateManager().pushVertices(iVerts);

    var mAr = mesh.getMaterials();
    var nbVerts = iVerts.length;
    for (var i = 0; i < nbVerts; ++i) {
      var idm = iVerts[i] * 3 + 2;
      var val = mAr[idm];
      mAr[idm] = val > 0.5 ? Math.min(val + 0.1, 1.0) : Math.max(val - 1.0, 0.0);
    }
    this.updateAndRenderMask();
  }

  clear() {
    var mesh = this.getMesh();
    var iVerts = this.getMaskedVertices();
    if (iVerts.length === 0)
      return;

    this.pushState();
    this._main.getStateManager().pushVertices(iVerts);

    var mAr = mesh.getMaterials();
    for (var i = 0, nb = iVerts.length; i < nb; ++i)
      mAr[iVerts[i] * 3 + 2] = 1.0;

    this.updateAndRenderMask();
  }

  invert(isState, meshState) {
    var mesh = meshState;
    if (!mesh) mesh = this.getMesh();
    if (!isState)
      this._main.getStateManager().pushStateCustom(this.invert.bind(this, true, mesh));

    var mAr = mesh.getMaterials();
    for (var i = 0, nb = mesh.getNbVertices(); i < nb; ++i)
      mAr[i * 3 + 2] = 1.0 - mAr[i * 3 + 2];

    this.updateAndRenderMask();
  }

  remapAndMirrorIndices(fAr, nbFaces, iVerts) {
    var nbVertices = this.getMesh().getNbVertices();
    var iTag = new Uint32Array(Utils.getMemory(nbVertices * 4), 0, nbVertices);
    var i = 0;
    var j = 0;
    var nbVerts = iVerts.length;
    for (i = 0; i < nbVerts; ++i)
      iTag[iVerts[i]] = i;

    var endFaces = nbFaces * 2;
    for (i = 0; i < endFaces; ++i) {
      j = i * 4;
      var offset = i < nbFaces ? 0 : nbVerts;
      fAr[j] = iTag[fAr[j]] + offset;
      fAr[j + 1] = iTag[fAr[j + 1]] + offset;
      fAr[j + 2] = iTag[fAr[j + 2]] + offset;
      var id4 = fAr[j + 3];
      if (id4 !== Utils.TRI_INDEX) fAr[j + 3] = iTag[id4] + offset;
    }

    var end = fAr.length / 4;
    for (i = endFaces; i < end; ++i) {
      j = i * 4;
      fAr[j] = iTag[fAr[j]];
      fAr[j + 1] = iTag[fAr[j + 1]];
      fAr[j + 2] = iTag[fAr[j + 2]] + nbVerts;
      fAr[j + 3] = iTag[fAr[j + 3]] + nbVerts;
    }
  }

  invertFaces(fAr) {
    for (var i = 0, nb = fAr.length / 4; i < nb; ++i) {
      var id = i * 4;
      var temp = fAr[id];
      fAr[id] = fAr[id + 2];
      fAr[id + 2] = temp;
    }
  }

  extractFaces(iFaces, iVerts, maskClamp) {
    var mesh = this.getMesh();
    var fAr = mesh.getFaces();
    var mAr = mesh.getMaterials();
    var eAr = mesh.getVerticesOnEdge();

    var noThick = this._thickness === 0;

    var nbFaces = iFaces.length;
    var nbNewFaces = new Uint32Array(Utils.getMemory(nbFaces * 4 * 4 * 3), 0, nbFaces * 4 * 3);
    var offsetFLink = noThick ? nbFaces : nbFaces * 2;
    for (var i = 0; i < nbFaces; ++i) {
      var idf = i * 4;
      var idOld = iFaces[i] * 4;
      var iv1 = nbNewFaces[idf] = fAr[idOld];
      var iv2 = nbNewFaces[idf + 1] = fAr[idOld + 1];
      var iv3 = nbNewFaces[idf + 2] = fAr[idOld + 2];
      var iv4 = nbNewFaces[idf + 3] = fAr[idOld + 3];
      if (noThick)
        continue;
      var isQuad = iv4 !== Utils.TRI_INDEX;

      var b1 = mAr[iv1 * 3 + 2] >= maskClamp || eAr[iv1] >= 1;
      var b2 = mAr[iv2 * 3 + 2] >= maskClamp || eAr[iv2] >= 1;
      var b3 = mAr[iv3 * 3 + 2] >= maskClamp || eAr[iv3] >= 1;
      var b4 = isQuad ? mAr[iv4 * 3 + 2] >= maskClamp || eAr[iv4] >= 1 : false;

      // create opposite face (layer), invert clockwise
      // quad =>
      // 1 2    3 2
      // 4 3    4 1
      // tri => 
      // 1 2    3 2
      //  3      1

      idf += nbFaces * 4;
      nbNewFaces[idf] = iv3;
      nbNewFaces[idf + 1] = iv2;
      nbNewFaces[idf + 2] = iv1;
      nbNewFaces[idf + 3] = iv4;

      // create bridges faces
      if (b2) {
        if (b1) {
          idf = 4 * (offsetFLink++);
          nbNewFaces[idf] = nbNewFaces[idf + 3] = iv2;
          nbNewFaces[idf + 1] = nbNewFaces[idf + 2] = iv1;
        }
        if (b3) {
          idf = 4 * (offsetFLink++);
          nbNewFaces[idf] = nbNewFaces[idf + 3] = iv3;
          nbNewFaces[idf + 1] = nbNewFaces[idf + 2] = iv2;
        }
      }
      if (isQuad) {
        if (b4) {
          if (b1) {
            idf = 4 * (offsetFLink++);
            nbNewFaces[idf] = nbNewFaces[idf + 3] = iv1;
            nbNewFaces[idf + 1] = nbNewFaces[idf + 2] = iv4;
          }
          if (b3) {
            idf = 4 * (offsetFLink++);
            nbNewFaces[idf] = nbNewFaces[idf + 3] = iv4;
            nbNewFaces[idf + 1] = nbNewFaces[idf + 2] = iv3;
          }
        }
      } else {
        if (b1 && b3) {
          idf = 4 * (offsetFLink++);
          nbNewFaces[idf] = nbNewFaces[idf + 3] = iv1;
          nbNewFaces[idf + 1] = nbNewFaces[idf + 2] = iv3;
        }
      }
    }

    var fArNew = new Uint32Array(nbNewFaces.subarray(0, offsetFLink * 4));
    this.remapAndMirrorIndices(fArNew, nbFaces, iVerts);
    if (this._thickness > 0)
      this.invertFaces(fArNew);
    return fArNew;
  }

  extractVertices(iVerts) {
    var mesh = this.getMesh();

    var vAr = mesh.getVertices();
    var nAr = mesh.getNormals();
    var mat = mesh.getMatrix();
    var nMat = mat3.normalFromMat4(mat3.create(), mat);
    var nbVerts = iVerts.length;
    var vArNew = new Float32Array(nbVerts * 2 * 3);
    var vTemp = [0.0, 0.0, 0.0];
    var nTemp = [0.0, 0.0, 0.0];
    var vOffset = nbVerts * 3;
    var thick = this._thickness;
    var eps = 0.01;
    if (thick < 0) eps = -eps;
    for (var i = 0; i < nbVerts; ++i) {
      var idv = i * 3;
      var idvOld = iVerts[i] * 3;
      vTemp[0] = vAr[idvOld];
      vTemp[1] = vAr[idvOld + 1];
      vTemp[2] = vAr[idvOld + 2];
      nTemp[0] = nAr[idvOld];
      nTemp[1] = nAr[idvOld + 1];
      nTemp[2] = nAr[idvOld + 2];
      vec3.transformMat3(nTemp, nTemp, nMat);
      vec3.normalize(nTemp, nTemp);

      vec3.transformMat4(vTemp, vTemp, mat);
      vec3.scaleAndAdd(vTemp, vTemp, nTemp, eps);
      vArNew[idv] = vTemp[0];
      vArNew[idv + 1] = vTemp[1];
      vArNew[idv + 2] = vTemp[2];

      vec3.scaleAndAdd(vTemp, vTemp, nTemp, thick);
      idv += vOffset;
      vArNew[idv] = vTemp[0];
      vArNew[idv + 1] = vTemp[1];
      vArNew[idv + 2] = vTemp[2];
    }
    return vArNew;
  }

  smoothBorder(mesh, iFaces) {
    var startBridge = iFaces.length * 2;
    var fBridge = new Uint32Array(mesh.getNbFaces() - startBridge);
    for (var i = 0, nbBridge = fBridge.length; i < nbBridge; ++i)
      fBridge[i] = startBridge + i;
    var vBridge = mesh.expandsVertices(mesh.getVerticesFromFaces(fBridge), 1);
    var smo = new Smooth();
    smo.setToolMesh(mesh);
    smo.smooth(vBridge, 1.0);
    smo.smooth(vBridge, 1.0);
    smo.smooth(vBridge, 1.0);
  }

  extract() {
    var mesh = this.getMesh();
    var maskClamp = 0.5;

    var iVerts = this.filterMaskedVertices(-Infinity, maskClamp);
    if (iVerts.length === 0)
      return;
    var iFaces = mesh.getFacesFromVertices(iVerts);
    iVerts = mesh.getVerticesFromFaces(iFaces);

    var fArNew = this.extractFaces(iFaces, iVerts, maskClamp);
    var vArNew = this.extractVertices(iVerts);

    var newMesh = new MeshStatic(mesh.getGL());
    newMesh.setVertices(vArNew);
    newMesh.setFaces(fArNew);

    // we don't use newMesh.init because we want to smooth
    // the border (we want to avoid an update octree/normal/etc...)
    newMesh.initColorsAndMaterials();
    newMesh.allocateArrays();
    newMesh.initTopology();
    if (this._thickness !== 0.0)
      this.smoothBorder(newMesh, iFaces);
    newMesh.updateGeometry();
    newMesh.updateDuplicateColorsAndMaterials();

    newMesh.copyRenderConfig(mesh);
    newMesh.initRender();

    var main = this._main;
    main.addNewMesh(newMesh);
    main.setMesh(mesh);
  }
}

export default Masking;
