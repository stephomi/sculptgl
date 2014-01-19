'use strict';

function Aabb()
{
  this.min_ = [Infinity, Infinity, Infinity]; //min vertex
  this.max_ = [-Infinity, -Infinity, -Infinity]; //max vertex
  this.center_ = [0.0, 0.0, 0.0]; //center (computed only for triangle's aabb)
}

Aabb.prototype = {
  /** Clone aabb */
  clone: function ()
  {
    var ab = new Aabb();
    ab.min_ = this.min_.slice();
    ab.max_ = this.max_.slice();
    return ab;
  },

  /** Copy aabb */
  copy: function (aabb)
  {
    vec3.copy(this.min_, aabb.min_);
    vec3.copy(this.max_, aabb.max_);
    return this;
  },

  /** Set aabb */
  setCopy: function (min, max)
  {
    vec3.copy(this.min_, min);
    vec3.copy(this.max_, max);
    return this;
  },

  /** Set aabb */
  set: function (xmin, ymin, zmin, xmax, ymax, zmax)
  {
    var min = this.min_,
      max = this.max_;
    min[0] = xmin;
    min[1] = ymin;
    min[2] = zmin;
    max[0] = xmax;
    max[1] = ymax;
    max[2] = zmax;
    return this;
  },

  /** Compute center */
  computeCenter: function ()
  {
    var temp = [0.0, 0.0, 0.0];
    return vec3.scale(temp, vec3.add(temp, this.min_, this.max_), 0.5);
  },

  /** Collision detection */
  isOutside: function (aabb)
  {
    var min = this.min_,
      max = this.max_;
    var abmin = aabb.min_,
      abmax = aabb.max_;

    if (abmin[0] > max[0] || abmax[0] < min[0]) return true;
    if (abmin[1] > max[1] || abmax[1] < min[1]) return true;
    if (abmin[2] > max[2] || abmax[2] < min[2]) return true;
    return false;
  },

  /** Return true if aabb is inside the box */
  isInside: function (aabb)
  {
    var min = this.min_,
      max = this.max_;
    var abmin = aabb.min_,
      abmax = aabb.max_;

    if (min[0] >= abmin[0] && max[0] <= abmax[0] &&
      min[1] >= abmin[1] && max[1] <= abmax[1] &&
      min[2] >= abmin[2] && max[2] <= abmax[2])
      return true;
    return false;
  },

  /** Return true if vert is inside the aabb */
  pointInside: function (vert)
  {
    var min = this.min_,
      max = this.max_;
    var vx = vert[0],
      vy = vert[1],
      vz = vert[2];

    if (vx <= min[0]) return false;
    if (vx > max[0]) return false;
    if (vy <= min[1]) return false;
    if (vy > max[1]) return false;
    if (vz <= min[2]) return false;
    if (vz > max[2]) return false;
    return true;
  },

  /** Change the size of the aabb to include vert */
  expandsWithPoint: function (vx, vy, vz)
  {
    var min = this.min_,
      max = this.max_;

    if (vx > max[0]) max[0] = vx;
    if (vx < min[0]) min[0] = vx;
    if (vy > max[1]) max[1] = vy;
    if (vy < min[1]) min[1] = vy;
    if (vz > max[2]) max[2] = vz;
    if (vz < min[2]) min[2] = vz;
  },

  /** Change the size of the aabb to include another aabb */
  expandsWithAabb: function (aabb)
  {
    var min = this.min_,
      max = this.max_;
    var abmin = aabb.min_,
      abmax = aabb.max_;
    var abminx = abmin[0],
      abminy = abmin[1],
      abminz = abmin[2];
    var abmaxx = abmax[0],
      abmaxy = abmax[1],
      abmaxz = abmax[2];

    if (abmaxx > max[0]) max[0] = abmaxx;
    if (abminx < min[0]) min[0] = abminx;
    if (abmaxy > max[1]) max[1] = abmaxy;
    if (abminy < min[1]) min[1] = abminy;
    if (abmaxz > max[2]) max[2] = abmaxz;
    if (abminz < min[2]) min[2] = abminz;
  },

  /** Return true if a ray intersection the box */
  intersectRay: function (vert, rayInv)
  {
    var min = this.min_,
      max = this.max_;
    var irx = rayInv[0],
      iry = rayInv[1],
      irz = rayInv[2];
    var vx = vert[0],
      vy = vert[1],
      vz = vert[2];

    var t1 = (min[0] - vx) * irx,
      t2 = (max[0] - vx) * irx,
      t3 = (min[1] - vy) * iry,
      t4 = (max[1] - vy) * iry,
      t5 = (min[2] - vz) * irz,
      t6 = (max[2] - vz) * irz;

    var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
      tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
    return (tmax >= 0 && tmin < tmax);
  },

  /** Return true if a sphere intersect with the box */
  intersectSphere: function (vert, radiusSquared)
  {
    var min = this.min_,
      max = this.max_;
    var vx = vert[0],
      vy = vert[1],
      vz = vert[2];
    var dx = 0.0,
      dy = 0.0,
      dz = 0.0;

    if (min[0] > vx) dx = min[0] - vx;
    else if (max[0] < vx) dx = max[0] - vx;
    else dx = 0.0;

    if (min[1] > vy) dy = min[1] - vy;
    else if (max[1] < vy) dy = max[1] - vy;
    else dy = 0.0;

    if (min[2] > vz) dz = min[2] - vz;
    else if (max[2] < vz) dz = max[2] - vz;
    else dz = 0.0;

    return (dx * dx + dy * dy + dz * dz) < radiusSquared;
  },

  /** Check if the aabb is a plane, if so... enlarge it */
  enlargeIfFlat: function (offset)
  {
    var min = this.min_,
      max = this.max_;

    if (min[0] === max[0])
    {
      min[0] -= offset;
      max[0] += offset;
    }
    if (min[1] === max[1])
    {
      min[1] -= offset;
      max[1] += offset;
    }
    if (min[2] === max[2])
    {
      min[2] -= offset;
      max[2] += offset;
    }
  },

  /**
   * Because of laziness I approximate the box by a sphere
   * Return 0 if the sphere is below the plane
   * Return 1 if the sphere is above the plane
   * Return 2 if the sphere intersects the plane
   */
  intersectPlane: function (origin, normal)
  {
    var center = this.computeCenter();
    var distToPlane = vec3.dot(vec3.sub(center, center, origin), normal);
    if (distToPlane * distToPlane < vec3.sqrDist(this.min_, this.max_) * 0.25)
      return 2;
    return distToPlane > 0.0 ? 1 : 0;
  }
};