import Tablet from 'misc/Tablet';
import SculptBase from 'editing/tools/SculptBase';

class Inflate extends SculptBase {

  constructor(main) {
    super(main);

    this._radius = 50;
    this._intensity = 0.3;
    this._negative = false;
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
    this.inflate(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, picking);

    var mesh = this.getMesh();
    mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
  }

  /** Inflate a group of vertices */
  inflate(iVerts, center, radiusSquared, intensity, picking) {
    var mesh = this.getMesh();
    var vAr = mesh.getVertices();
    var mAr = mesh.getMaterials();
    var vProxy = mesh.getVerticesProxy();
    var nAr = mesh.getNormals();
    var radius = Math.sqrt(radiusSquared);
    var deformIntensity = intensity * radius * 0.1;
    if (this._negative)
      deformIntensity = -deformIntensity;
    var cx = center[0];
    var cy = center[1];
    var cz = center[2];
    for (var i = 0, l = iVerts.length; i < l; ++i) {
      var ind = iVerts[i] * 3;
      var dx = vProxy[ind] - cx;
      var dy = vProxy[ind + 1] - cy;
      var dz = vProxy[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (dist >= 1.0)
        continue;
      var fallOff = dist * dist;
      fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
      fallOff = deformIntensity * fallOff;
      var vx = vAr[ind];
      var vy = vAr[ind + 1];
      var vz = vAr[ind + 2];
      var nx = nAr[ind];
      var ny = nAr[ind + 1];
      var nz = nAr[ind + 2];
      fallOff /= Math.sqrt(nx * nx + ny * ny + nz * nz);
      fallOff *= mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
      vAr[ind] = vx + nx * fallOff;
      vAr[ind + 1] = vy + ny * fallOff;
      vAr[ind + 2] = vz + nz * fallOff;
    }
  }
}

export default Inflate;
