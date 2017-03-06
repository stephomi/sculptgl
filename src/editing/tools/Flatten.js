import Tablet from 'misc/Tablet';
import SculptBase from 'editing/tools/SculptBase';

class Flatten extends SculptBase {

  constructor(main) {
    super(main);

    this._radius = 50;
    this._intensity = 0.75;
    this._negative = true;
    this._culling = false;
    this._idAlpha = 0;
    this._lockPosition = false;
  }

  stroke(picking) {
    var iVertsInRadius = picking.getPickedVertices();
    var intensity = this._intensity * Tablet.getPressureIntensity();

    // undo-redo
    this._main.getStateManager().pushVertices(iVertsInRadius);
    iVertsInRadius = this.dynamicTopology(picking);

    var iVertsFront = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());
    if (this._culling)
      iVertsInRadius = iVertsFront;

    var aNormal = this.areaNormal(iVertsFront);
    if (!aNormal)
      return;
    var aCenter = this.areaCenter(iVertsFront);
    picking.updateAlpha(this._lockPosition);
    picking.setIdAlpha(this._idAlpha);
    this.flatten(iVertsInRadius, aNormal, aCenter, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, picking);

    var mesh = this.getMesh();
    mesh.updateGeometry(mesh.getFacesFromVertices(iVertsInRadius), iVertsInRadius);
  }

  /** Flatten, projection of the sculpting vertex onto a plane defined by the barycenter and normals of all the sculpting vertices */
  flatten(iVertsInRadius, aNormal, aCenter, center, radiusSquared, intensity, picking) {
    var mesh = this.getMesh();
    var vAr = mesh.getVertices();
    var mAr = mesh.getMaterials();
    var radius = Math.sqrt(radiusSquared);
    var vProxy = this._accumulate === false && this._lockPosition === false ? mesh.getVerticesProxy() : vAr;
    var cx = center[0];
    var cy = center[1];
    var cz = center[2];
    var ax = aCenter[0];
    var ay = aCenter[1];
    var az = aCenter[2];
    var anx = aNormal[0];
    var any = aNormal[1];
    var anz = aNormal[2];
    var comp = this._negative ? -1.0 : 1.0;
    for (var i = 0, l = iVertsInRadius.length; i < l; ++i) {
      var ind = iVertsInRadius[i] * 3;
      var vx = vAr[ind];
      var vy = vAr[ind + 1];
      var vz = vAr[ind + 2];
      var distToPlane = (vx - ax) * anx + (vy - ay) * any + (vz - az) * anz;
      if (distToPlane * comp > 0.0)
        continue;
      var dx = vProxy[ind] - cx;
      var dy = vProxy[ind + 1] - cy;
      var dz = vProxy[ind + 2] - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (dist >= 1.0)
        continue;
      var fallOff = dist * dist;
      fallOff = 3.0 * fallOff * fallOff - 4.0 * fallOff * dist + 1.0;
      fallOff *= distToPlane * intensity * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
      vAr[ind] -= anx * fallOff;
      vAr[ind + 1] -= any * fallOff;
      vAr[ind + 2] -= anz * fallOff;
    }
  }
}

export default Flatten;
