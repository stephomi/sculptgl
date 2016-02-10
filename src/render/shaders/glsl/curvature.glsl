// http://madebyevan.com/shaders/curvature/
#extension GL_OES_standard_derivatives : enable
vec3 computeCurvature( const in vec3 vertex, const in vec3 normal, const in vec3 color, const in float str, const in float fov) {
  if(str < 1e-3)
    return color;
#ifndef GL_OES_standard_derivatives
    return color * pow(length(normal), str * 100.0);
#else
  vec3 n = normalize(normal);
  // Compute curvature
  vec3 dx = dFdx(n);
  vec3 dy = dFdy(n);
  vec3 xneg = n - dx;
  vec3 xpos = n + dx;
  vec3 yneg = n - dy;
  vec3 ypos = n + dy;
  // fov < 0.0 means ortho
  float depth = fov > 0.0 ? length(vertex) * fov : -fov;
  float cur = (cross(xneg, xpos).y - cross(yneg, ypos).x) * str * 80.0 / depth;
  return mix(mix(color, color * 0.3, clamp(-cur * 15.0, 0.0, 1.0)), color * 2.0, clamp(cur * 25.0, 0.0, 1.0));
#endif
}
