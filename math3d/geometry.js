'use strict';

var Geometry = {};

/** Normalize coordinate mouse between -1 and 1 */
Geometry.normalizedMouse = function (mouseX, mouseY, width, height)
{
  return [(2.0 * mouseX / width) - 1.0, 1.0 - (2.0 * mouseY / height)];
};

/** Projection of mouse coordinate on sphere unit */
Geometry.mouseOnUnitSphere = function (mouseXY)
{
  var mouseX = mouseXY[0];
  var mouseY = mouseXY[1];
  var tempZ = 1.0 - mouseX * mouseX - mouseY * mouseY;
  var mouseZ = tempZ > 0.0 ? Math.sqrt(tempZ) : 0.0;
  var sourisSphere = [mouseX, mouseY, mouseZ];
  return vec3.normalize(sourisSphere, sourisSphere);
};

/** Compute intersection vertex between a ray and a triangle. Returne false if it doesn't intersect. */
Geometry.intersectionRayTriangle = function ()
{
  var EPSILON = 1E-20;
  var edge1 = [0.0, 0.0, 0.0];
  var edge2 = [0.0, 0.0, 0.0];
  var pvec = [0.0, 0.0, 0.0];
  var tvec = [0.0, 0.0, 0.0];
  var qvec = [0.0, 0.0, 0.0];
  return function (orig, dir, v1, v2, v3, vertInter)
  {
    // moller trumbore intersection algorithm
    // http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-9-ray-triangle-intersection/m-ller-trumbore-algorithm/
    vec3.sub(edge1, v2, v1);
    vec3.sub(edge2, v3, v1);
    vec3.cross(pvec, dir, edge2);
    var det = vec3.dot(edge1, pvec);
    if (det > -EPSILON && det < EPSILON)
      return false;
    var invDet = 1.0 / det;
    vec3.sub(tvec, orig, v1);
    var u = vec3.dot(tvec, pvec) * invDet;
    if (u < 0.0 || u > 1.0)
      return false;
    vec3.cross(qvec, tvec, edge1);
    var v = vec3.dot(dir, qvec) * invDet;
    if (v < 0.0 || u + v > 1.0)
      return false;
    var t = vec3.dot(edge2, qvec) * invDet;
    if (t < 0.0)
      return false;
    vec3.scaleAndAdd(vertInter, orig, dir, t);
    return true;
  };
}();

/** Compute the bounding box of a triangle defined by three vertices */
Geometry.computeTriangleAabb = function (aabb, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  var min = aabb.min_,
    max = aabb.max_,
    center = aabb.center_;
  min[0] = Math.min(v1x, v2x, v3x);
  min[1] = Math.min(v1y, v2y, v3y);
  min[2] = Math.min(v1z, v2z, v3z);
  max[0] = Math.max(v1x, v2x, v3x);
  max[1] = Math.max(v1y, v2y, v3y);
  max[2] = Math.max(v1z, v2z, v3z);
  center[0] = (min[0] + max[0]) * 0.5;
  center[1] = (min[1] + max[1]) * 0.5;
  center[2] = (min[2] + max[2]) * 0.5;
};

/** Compute from a plane defined by 3 vertices */
Geometry.triangleNormal = function (normal, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  var ax = v2x - v1x,
    ay = v2y - v1y,
    az = v2z - v1z;
  var bx = v3x - v1x,
    by = v3y - v1y,
    bz = v3z - v1z;
  var nx = ay * bz - az * by,
    ny = az * bx - ax * bz,
    nz = ax * by - ay * bx;
  var len = nx * nx + ny * ny + nz * nz;
  if (len !== 0.0)
  {
    len = 1.0 / Math.sqrt(len);
    normal[0] = nx * len;
    normal[1] = ny * len;
    normal[2] = nz * len;
  }
};

/** If point is inside the triangle, test the sum of the areas */
Geometry.pointInsideTriangle = function ()
{
  var vec1 = [0.0, 0.0, 0.0];
  var vec2 = [0.0, 0.0, 0.0];
  var vecP1 = [0.0, 0.0, 0.0];
  var vecP2 = [0.0, 0.0, 0.0];
  var temp = [0.0, 0.0, 0.0];
  return function (point, v1, v2, v3)
  {
    vec3.sub(vec1, v1, v2);
    vec3.sub(vec2, v1, v3);
    vec3.sub(vecP1, point, v2);
    vec3.sub(vecP2, point, v3);
    var total = vec3.len(vec3.cross(temp, vec1, vec2));
    var area1 = vec3.len(vec3.cross(temp, vec1, vecP1));
    var area2 = vec3.len(vec3.cross(temp, vec2, vecP2));
    var area3 = vec3.len(vec3.cross(temp, vecP1, vecP2));
    return Math.abs(total - (area1 + area2 + area3)) < 1E-20;
  };
}();

/** If a sphere intersect a triangle */
Geometry.sphereIntersectTriangleEdges = function (point, radiusSq, v1, v2, v3)
{
  if (Geometry.distanceSqToSegment(point, v1, v2) < radiusSq) return true;
  if (Geometry.distanceSqToSegment(point, v2, v3) < radiusSq) return true;
  if (Geometry.distanceSqToSegment(point, v1, v3) < radiusSq) return true;
  return false;
};

/** Minimum squared distance to a segment */
Geometry.distanceSqToSegment = function ()
{
  var pt = [0.0, 0.0, 0.0];
  var v2v1 = [0.0, 0.0, 0.0];
  return function (point, v1, v2)
  {
    vec3.sub(pt, point, v1);
    vec3.sub(v2v1, v2, v1);
    var len = vec3.sqrLen(v2v1);
    var t = vec3.dot(pt, v2v1) / len;
    if (t < 0.0) return vec3.sqrLen(pt);
    if (t > 1.0) return vec3.sqrLen(vec3.sub(pt, point, v2));

    pt[0] = point[0] - v1[0] - t * v2v1[0];
    pt[1] = point[1] - v1[1] - t * v2v1[1];
    pt[2] = point[2] - v1[2] - t * v2v1[2];
    return vec3.sqrLen(pt);
  };
}();

/** Sign angle between two 2d vectors in radians */
Geometry.signedAngle2d = function (v1, v2)
{
  var v1x = v1[0],
    v1y = v1[1],
    v2x = v2[0],
    v2y = v2[1];
  return Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y);
};

/** Distance from a vertex and a plane */
Geometry.pointPlaneDistance = function ()
{
  var temp = [0.0, 0.0, 0.0];
  return function (v, ptPlane, nPlane)
  {
    return vec3.dot(vec3.sub(temp, v, ptPlane), nPlane);
  };
}();

/** Mirror a vertex according to a plane */
Geometry.mirrorPoint = function ()
{
  var temp = [0.0, 0.0, 0.0];
  return function (v, ptPlane, nPlane)
  {
    return vec3.sub(v, v, vec3.scale(temp, nPlane, Geometry.pointPlaneDistance(v, ptPlane, nPlane) * 2.0));
  };
}();

/** Compute the projection of a vertex on a line */
Geometry.vertexOnLine = function ()
{
  var ab = [0.0, 0.0, 0.0];
  return function (vertex, vNear, vFar)
  {
    vec3.sub(ab, vFar, vNear);
    var proj = [0.0, 0.0, 0.0];
    var dot = vec3.dot(ab, vec3.sub(proj, vertex, vNear));
    return vec3.scaleAndAdd(proj, vNear, ab, dot / vec3.sqrLen(ab));
  };
}();

/** Return the intersection between a ray and a plane */
Geometry.intersectLinePlane = function (s1, s2, origin, normal, out)
{
  if (out === undefined)
    out = [0.0, 0.0, 0.0];
  var dist1 = vec3.dot(vec3.sub(out, s1, origin), normal);
  var dist2 = vec3.dot(vec3.sub(out, s2, origin), normal);
  //ray copplanar to triangle
  if (dist1 === dist2)
    return s2;
  //intersection between ray and triangle
  var val = -dist1 / (dist2 - dist1);
  return vec3.scaleAndAdd(out, s1, vec3.sub(out, s2, s1), val);
};

/** Return any perpendicular vector to another (normalized) vector */
Geometry.getPerpendicularVector = function (vec)
{
  var perp = [0.0, 0.0, 0.0];
  if (vec[0] === 0.0)
    perp[0] = 1.0;
  else if (vec[1] === 0.0)
    perp[1] = 1.0;
  else if (vec[2] === 0.0)
    perp[2] = 1.0;
  else
  {
    perp[0] = vec[2];
    perp[1] = vec[2];
    perp[2] = -vec[0] - vec[1];
    vec3.normalize(perp, perp);
  }
  return perp;
};