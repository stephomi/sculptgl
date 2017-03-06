import Tablet from 'misc/Tablet';
import SculptBase from 'editing/tools/SculptBase';

class Crease extends SculptBase {

  constructor(main) {
    super(main);

    this._radius = 25;
    this._intensity = 0.75;
    this._negative = true;
    this._culling = false;
    this._idAlpha = 0;
    this._lockPosition = false;
  }

  stroke(picking) {
    var iVertsInRadius = picking.getPickedVertices();
    var intensity = this._intensity * Tablet.getPressureIntensity();

    this.updateProxy(iVertsInRadius);
    // undo-redo
    this._main.getStateManager().pushVertices(iVertsInRadius);
    iVertsInRadius = this.dynamicTopology(picking);

    if (this._culling)
      iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

    picking.updateAlpha(this._lockPosition);
    picking.setIdAlpha(this._idAlpha);
    this.crease(iVertsInRadius, picking.getPickedNormal(), picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, picking);

    var mesh = this.getMesh();
    mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
  }

  /** Pinch+brush-like sculpt */
  crease(iVertsInRadius, aNormal, center, radiusSquared, intensity, picking) {
    var mesh = this.getMesh();
    var vAr = mesh.getVertices();
    var mAr = mesh.getMaterials();
    var vProxy = mesh.getVerticesProxy();
    var radius = Math.sqrt(radiusSquared);
    var cx = center[0];
    var cy = center[1];
    var cz = center[2];
    var anx = aNormal[0];
    var any = aNormal[1];
    var anz = aNormal[2];
    var deformIntensity = intensity * 0.07;
    var brushFactor = deformIntensity * radius;
    if (this._negative)
      brushFactor = -brushFactor;
    for (var i = 0, l = iVertsInRadius.length; i < l; ++i) {
      var ind = iVertsInRadius[i] * 3;
      var dx = cx - vProxy[ind];
      var dy = cy - vProxy[ind + 1];
      var dz = cz - vProxy[ind + 2];
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (dist >= 1.0)
        continue;
      var vx = vAr[ind];
      var vy = vAr[ind + 1];
      var vz = vAr[ind + 2];
      var fallOff = dist * dist;
      fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
      fallOff *= mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
      var brushModifier = Math.pow(fallOff, 5) * brushFactor;
      fallOff *= deformIntensity;
      vAr[ind] = vx + dx * fallOff + anx * brushModifier;
      vAr[ind + 1] = vy + dy * fallOff + any * brushModifier;
      vAr[ind + 2] = vz + dz * fallOff + anz * brushModifier;
    }
  }
}

export default Crease;
