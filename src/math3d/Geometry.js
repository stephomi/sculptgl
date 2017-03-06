import { vec3 } from 'gl-matrix';

var Geometry = {};

/** Normalize coordinate mouse between -1 and 1 */
Geometry.normalizedMouse = function (mouseX, mouseY, width, height) {
  return [(2.0 * mouseX / width) - 1.0, 1.0 - (2.0 * mouseY / height)];
};

/** Projection of mouse coordinate on sphere unit */
Geometry.mouseOnUnitSphere = function (mouseXY) {
  var mouseX = mouseXY[0];
  var mouseY = mouseXY[1];
  var tempZ = 1.0 - mouseX * mouseX - mouseY * mouseY;
  var mouseZ = tempZ > 0.0 ? Math.sqrt(tempZ) : 0.0;
  var sourisSphere = [mouseX, mouseY, mouseZ];
  return vec3.normalize(sourisSphere, sourisSphere);
};

/** Compute intersection between a ray and a triangle. Returne the distance to the triangle if a hit occurs. */
Geometry.intersectionRayTriangleEdges = (function () {
  var EPSILON = 1E-15;
  // hmm we favor false positive just in case...
  // mainly because of the voxel-remesh that can do weird things
  // if the ray casting fail on a border of a triangle 
  var ONE_PLUS_EPSILON = 1.0 + EPSILON;
  var ZERO_MINUS_EPSILON = 0.0 - EPSILON;
  var pvec = [0.0, 0.0, 0.0];
  var tvec = [0.0, 0.0, 0.0];
  var qvec = [0.0, 0.0, 0.0];
  return function (orig, dir, edge1, edge2, v1, vertInter) {
    // moller trumbore intersection algorithm
    vec3.cross(pvec, dir, edge2);
    var det = vec3.dot(edge1, pvec);
    if (det > -EPSILON && det < EPSILON)
      return -1.0;
    var invDet = 1.0 / det;
    vec3.sub(tvec, orig, v1);
    var u = vec3.dot(tvec, pvec) * invDet;
    if (u < ZERO_MINUS_EPSILON || u > ONE_PLUS_EPSILON)
      return -1.0;
    vec3.cross(qvec, tvec, edge1);
    var v = vec3.dot(dir, qvec) * invDet;
    if (v < ZERO_MINUS_EPSILON || u + v > ONE_PLUS_EPSILON)
      return -1.0;
    var t = vec3.dot(edge2, qvec) * invDet;
    if (t < ZERO_MINUS_EPSILON)
      return -1.0;
    if (vertInter)
      vec3.scaleAndAdd(vertInter, orig, dir, t);
    return t;
  };
})();

/** Compute intersection between a ray and a triangle. Returne the distance to the triangle if a hit occurs. */
Geometry.intersectionRayTriangle = (function () {
  var edge1 = [0.0, 0.0, 0.0];
  var edge2 = [0.0, 0.0, 0.0];
  return function (orig, dir, v1, v2, v3, vertInter) {
    vec3.sub(edge1, v2, v1);
    vec3.sub(edge2, v3, v1);
    return Geometry.intersectionRayTriangleEdges(orig, dir, edge1, edge2, v1, vertInter);
  };
})();

//
// \2|
//  \|
//   \
// 3 |\  1
//   |0\
// __|__\___
// 4 | 5 \ 6
/** Compute distance between a point and a triangle. */
Geometry.distance2PointTriangleEdges = (function () {
  var diff = [0.0, 0.0, 0.0];
  return function (point, edge1, edge2, v1, a00, a01, a11, closest) {

    vec3.sub(diff, v1, point);
    var b0 = vec3.dot(diff, edge1);
    var b1 = vec3.dot(diff, edge2);
    var c = vec3.sqrLen(diff);
    var det = Math.abs(a00 * a11 - a01 * a01);
    var s = a01 * b1 - a11 * b0;
    var t = a01 * b0 - a00 * b1;
    var sqrDistance;
    var zone = 4;

    if (s + t <= det) {
      if (s < 0.0) {
        if (t < 0.0) { // region 4
          zone = 4;
          if (b0 < 0.0) {
            t = 0.0;
            if (-b0 >= a00) {
              s = 1.0;
              sqrDistance = a00 + 2.0 * b0 + c;
            } else {
              s = -b0 / a00;
              sqrDistance = b0 * s + c;
            }
          } else {
            s = 0.0;
            if (b1 >= 0.0) {
              t = 0.0;
              sqrDistance = c;
            } else if (-b1 >= a11) {
              t = 1.0;
              sqrDistance = a11 + 2.0 * b1 + c;
            } else {
              t = -b1 / a11;
              sqrDistance = b1 * t + c;
            }
          }
        } else { // region 3
          zone = 3;
          s = 0.0;
          if (b1 >= 0.0) {
            t = 0.0;
            sqrDistance = c;
          } else if (-b1 >= a11) {
            t = 1.0;
            sqrDistance = a11 + 2.0 * b1 + c;
          } else {
            t = -b1 / a11;
            sqrDistance = b1 * t + c;
          }
        }
      } else if (t < 0.0) { // region 5
        zone = 5;
        t = 0.0;
        if (b0 >= 0.0) {
          s = 0.0;
          sqrDistance = c;
        } else if (-b0 >= a00) {
          s = 1.0;
          sqrDistance = a00 + 2.0 * b0 + c;
        } else {
          s = -b0 / a00;
          sqrDistance = b0 * s + c;
        }
      } else { // region 0
        zone = 0;
        // minimum at interior point
        var invDet = 1.0 / det;
        s *= invDet;
        t *= invDet;
        sqrDistance = s * (a00 * s + a01 * t + 2.0 * b0) + t * (a01 * s + a11 * t + 2.0 * b1) + c;
      }
    } else {
      var tmp0, tmp1, numer, denom;

      if (s < 0.0) { // region 2
        zone = 2;
        tmp0 = a01 + b0;
        tmp1 = a11 + b1;
        if (tmp1 > tmp0) {
          numer = tmp1 - tmp0;
          denom = a00 - 2.0 * a01 + a11;
          if (numer >= denom) {
            s = 1.0;
            t = 0.0;
            sqrDistance = a00 + 2.0 * b0 + c;
          } else {
            s = numer / denom;
            t = 1.0 - s;
            sqrDistance = s * (a00 * s + a01 * t + 2.0 * b0) + t * (a01 * s + a11 * t + 2.0 * b1) + c;
          }
        } else {
          s = 0.0;
          if (tmp1 <= 0.0) {
            t = 1.0;
            sqrDistance = a11 + 2.0 * b1 + c;
          } else if (b1 >= 0.0) {
            t = 0.0;
            sqrDistance = c;
          } else {
            t = -b1 / a11;
            sqrDistance = b1 * t + c;
          }
        }
      } else if (t < 0.0) { // region 6
        zone = 6;
        tmp0 = a01 + b1;
        tmp1 = a00 + b0;
        if (tmp1 > tmp0) {
          numer = tmp1 - tmp0;
          denom = a00 - 2.0 * a01 + a11;
          if (numer >= denom) {
            t = 1.0;
            s = 0.0;
            sqrDistance = a11 + 2.0 * b1 + c;
          } else {
            t = numer / denom;
            s = 1.0 - t;
            sqrDistance = s * (a00 * s + a01 * t + 2.0 * b0) + t * (a01 * s + a11 * t + 2.0 * b1) + c;
          }
        } else {
          t = 0.0;
          if (tmp1 <= 0.0) {
            s = 1.0;
            sqrDistance = a00 + 2.0 * b0 + c;
          } else if (b0 >= 0.0) {
            s = 0.0;
            sqrDistance = c;
          } else {
            s = -b0 / a00;
            sqrDistance = b0 * s + c;
          }
        }
      } else { // region 1
        zone = 1;
        numer = a11 + b1 - a01 - b0;
        if (numer <= 0.0) {
          s = 0.0;
          t = 1.0;
          sqrDistance = a11 + 2.0 * b1 + c;
        } else {
          denom = a00 - 2.0 * a01 + a11;
          if (numer >= denom) {
            s = 1.0;
            t = 0.0;
            sqrDistance = a00 + 2.0 * b0 + c;
          } else {
            s = numer / denom;
            t = 1.0 - s;
            sqrDistance = s * (a00 * s + a01 * t + 2.0 * b0) + t * (a01 * s + a11 * t + 2.0 * b1) + c;
          }
        }
      }
    }

    // Account for numerical round-off error.
    if (sqrDistance < 0.0)
      sqrDistance = 0.0;

    if (closest) {
      closest[0] = v1[0] + s * edge1[0] + t * edge2[0];
      closest[1] = v1[1] + s * edge1[1] + t * edge2[1];
      closest[2] = v1[2] + s * edge1[2] + t * edge2[2];
      closest[3] = zone;
    }
    return sqrDistance;
  };
})();

/** Compute distance between a point and a triangle. */
Geometry.distance2PointTriangle = (function () {
  var edge1 = [0.0, 0.0, 0.0];
  var edge2 = [0.0, 0.0, 0.0];
  return function (point, v1, v2, v3, closest) {
    vec3.sub(edge1, v2, v1);
    vec3.sub(edge2, v3, v1);
    var a00 = vec3.sqrLen(edge1);
    var a01 = vec3.dot(edge1, edge2);
    var a11 = vec3.sqrLen(edge2);
    return Geometry.distance2PointTriangleEdges(point, edge1, edge2, v1, a00, a01, a11, closest);
  };
})();

/** If point is inside the triangle, test the sum of the areas */
Geometry.pointInsideTriangle = (function () {
  var vec1 = [0.0, 0.0, 0.0];
  var vec2 = [0.0, 0.0, 0.0];
  var vecP1 = [0.0, 0.0, 0.0];
  var vecP2 = [0.0, 0.0, 0.0];
  var temp = [0.0, 0.0, 0.0];
  return function (point, v1, v2, v3) {
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
})();

/** If a sphere intersect a triangle */
Geometry.triangleInsideSphere = function (point, radiusSq, v1, v2, v3) {
  if (Geometry.distanceSqToSegment(point, v1, v2) < radiusSq) return true;
  if (Geometry.distanceSqToSegment(point, v2, v3) < radiusSq) return true;
  if (Geometry.distanceSqToSegment(point, v1, v3) < radiusSq) return true;
  return false;
};

/** Minimum squared distance to a segment */
Geometry.distanceSqToSegment = (function () {
  var pt = [0.0, 0.0, 0.0];
  var v2v1 = [0.0, 0.0, 0.0];
  return function (point, v1, v2) {
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
})();

/** Sign angle between two 2d vectors in radians */
Geometry.signedAngle2d = function (v1, v2) {
  var v1x = v1[0],
    v1y = v1[1],
    v2x = v2[0],
    v2y = v2[1];
  return Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y);
};

/** Distance from a vertex and a plane */
Geometry.pointPlaneDistance = (function () {
  var temp = [0.0, 0.0, 0.0];
  return function (v, ptPlane, nPlane) {
    return vec3.dot(vec3.sub(temp, v, ptPlane), nPlane);
  };
})();

/** Mirror a vertex according to a plane */
Geometry.mirrorPoint = (function () {
  var temp = [0.0, 0.0, 0.0];
  return function (v, ptPlane, nPlane) {
    return vec3.sub(v, v, vec3.scale(temp, nPlane, Geometry.pointPlaneDistance(v, ptPlane, nPlane) * 2.0));
  };
})();

/** Compute the projection of a vertex on a line */
Geometry.vertexOnLine = (function () {
  var ab = [0.0, 0.0, 0.0];
  return function (vertex, vNear, vFar) {
    vec3.sub(ab, vFar, vNear);
    var proj = [0.0, 0.0, 0.0];
    var dot = vec3.dot(ab, vec3.sub(proj, vertex, vNear));
    return vec3.scaleAndAdd(proj, vNear, ab, dot / vec3.sqrLen(ab));
  };
})();

/** Return the intersection between a ray and a plane */
Geometry.intersectLinePlane = function (s1, s2, origin, normal, out) {
  var dist1 = vec3.dot(vec3.sub(out, s1, origin), normal);
  var dist2 = vec3.dot(vec3.sub(out, s2, origin), normal);
  // ray copplanar to triangle
  if (dist1 === dist2)
    return s2;
  // intersection between ray and triangle
  var val = -dist1 / (dist2 - dist1);
  return vec3.scaleAndAdd(out, s1, vec3.sub(out, s2, s1), val);
};

/** Return any perpendicular vector to another (normalized) vector */
Geometry.getPerpendicularVector = function (vec) {
  var perp = [0.0, 0.0, 0.0];
  if (vec[0] === 0.0)
    perp[0] = 1.0;
  else if (vec[1] === 0.0)
    perp[1] = 1.0;
  else if (vec[2] === 0.0)
    perp[2] = 1.0;
  else {
    perp[0] = vec[2];
    perp[1] = vec[2];
    perp[2] = -vec[0] - vec[1];
    vec3.normalize(perp, perp);
  }
  return perp;
};

export default Geometry;
