'use strict';

var Geometry = {};

/** Normalize coordinate mouse between -1 and 1 */
Geometry.normalizedMouse = function (mouseX, mouseY, width, height)
{
  return [(2 * mouseX / width) - 1, 1 - (2 * mouseY / height)];
};

/** Projection of mouse coordinate on sphere unit */
Geometry.mouseOnUnitSphere = function (mouseXY)
{
  var mouseX = mouseXY[0];
  var mouseY = mouseXY[1];
  var tempZ = 1 - mouseX * mouseX - mouseY * mouseY;
  var mouseZ = tempZ > 0 ? Math.sqrt(tempZ) : 0;
  var sourisSphere = [mouseX, mouseY, mouseZ];
  return vec3.normalize(sourisSphere, sourisSphere);
};

/** Compute intersection vertex between a ray and a triangle. Returne false if it doesn't intersect. */
Geometry.intersectionRayTriangle = function (s1, s2, v1, v2, v3, normal, vertInter)
{
  var temp = [0, 0, 0];
  vec3.sub(temp, s1, v1);
  var dist1 = vec3.dot(temp, normal);
  var dist2 = vec3.dot(vec3.sub(temp, s2, v1), normal);
  //ray copplanar to triangle
  if ((dist1 * dist2) >= 0)
    return false;
  //intersection between ray and triangle
  var val = -dist1 / (dist2 - dist1);
  vec3.scaleAndAdd(vertInter, s1, vec3.sub(temp, s2, s1), val);
  var cross = [0, 0, 0];
  vec3.cross(cross, normal, vec3.sub(temp, v2, v1));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v1)) < 0)
    return false;
  vec3.cross(cross, normal, vec3.sub(temp, v3, v2));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v2)) < 0)
    return false;
  vec3.cross(cross, normal, vec3.sub(temp, v1, v3));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v1)) < 0)
    return false;
  return true;
};

/** Compute the bounding box of a triangle defined by three vertices */
Geometry.computeTriangleAabb = function (aabb, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  var xmin = Math.min(v1x, v2x, v3x),
    ymin = Math.min(v1y, v2y, v3y),
    zmin = Math.min(v1z, v2z, v3z);
  var xmax = Math.max(v1x, v2x, v3x),
    ymax = Math.max(v1y, v2y, v3y),
    zmax = Math.max(v1z, v2z, v3z);
  var min = aabb.min_,
    max = aabb.max_;
  min[0] = xmin;
  min[1] = ymin;
  min[2] = zmin;
  max[0] = xmax;
  max[1] = ymax;
  max[2] = zmax;
};

/** Compute from a plane defined by 3 vertices */
Geometry.normal = function (normal, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  var ax = v2x - v1x,
    ay = v2y - v1y,
    az = v2z - v1z;
  var bx = v3x - v1x,
    by = v3y - v1y,
    bz = v3z - v1z;
  var nx = 0,
    ny = 0,
    nz = 0;
  nx = ay * bz - az * by;
  ny = az * bx - ax * bz;
  nz = ax * by - ay * bx;
  var len = nx * nx + ny * ny + nz * nz;
  if (len !== 0)
  {
    len = 1 / Math.sqrt(len);
    normal[0] = nx * len;
    normal[1] = ny * len;
    normal[2] = nz * len;
  }
};

/** If point is inside the triangle, test the sum of the areas */
Geometry.pointInsideTriangle = function (point, v1, v2, v3)
{
  var vec1 = [0, 0, 0];
  vec3.sub(vec1, v1, v2);
  var vec2 = [0, 0, 0];
  vec3.sub(vec2, v1, v3);
  var vecP1 = [0, 0, 0];
  vec3.sub(vecP1, point, v2);
  var vecP2 = [0, 0, 0];
  vec3.sub(vecP2, point, v3);
  var temp = [0, 0, 0];
  var total = vec3.len(vec3.cross(temp, vec1, vec2));
  var area1 = vec3.len(vec3.cross(temp, vec1, vecP1));
  var area2 = vec3.len(vec3.cross(temp, vec2, vecP2));
  var area3 = vec3.len(vec3.cross(temp, vecP1, vecP2));
  if (Math.abs(total - (area1 + area2 + area3)) < 0.0001) //magic epsilon...
    return true;
  else
    return false;
};

/** If a sphere intersect a triangle */
Geometry.sphereIntersectTriangle = function (point, radiusSq, v1, v2, v3)
{
  if (Geometry.distanceToSegment(point, v1, v2) < radiusSq) return true;
  if (Geometry.distanceToSegment(point, v2, v3) < radiusSq) return true;
  if (Geometry.distanceToSegment(point, v1, v3) < radiusSq) return true;
  return false;
};

/** Minimum distance to a segment */
Geometry.distanceToSegment = function (point, v1, v2)
{
  var pt = [0, 0, 0];
  vec3.sub(pt, point, v1);
  var v2v1 = [0, 0, 0];
  vec3.sub(v2v1, v2, v1);
  var len = vec3.sqrLen(v2v1);
  var t = vec3.dot(pt, v2v1) / len;
  if (t < 0) return vec3.sqrLen(pt);
  if (t > 1) return vec3.sqrLen(vec3.sub(pt, point, v2));

  pt[0] = point[0] - v1[0] + t * v2v1[0];
  pt[1] = point[1] - v1[1] + t * v2v1[1];
  pt[2] = point[2] - v1[2] + t * v2v1[2];
  return vec3.sqrLen(pt);
};

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
Geometry.pointPlaneDistance = function (v, ptPlane, nPlane)
{
  return vec3.dot(vec3.sub([0, 0, 0], v, ptPlane), nPlane);
};

/** Mirror a vertex according to a plane */
Geometry.mirrorPoint = function (v, ptPlane, nPlane)
{
  return vec3.sub(v, v, vec3.scale([0, 0, 0], nPlane, Geometry.pointPlaneDistance(v, ptPlane, nPlane) * 2));
};

/** Compute the projection of a vertex on a line */
Geometry.vertexOnLine = function (vertex, vNear, vFar)
{
  var ab = [0, 0, 0];
  vec3.sub(ab, vFar, vNear);
  var temp = [0, 0, 0];
  var dot = vec3.dot(ab, vec3.sub(temp, vertex, vNear));
  return vec3.scaleAndAdd(temp, vNear, ab, dot / vec3.sqrLen(ab));
};