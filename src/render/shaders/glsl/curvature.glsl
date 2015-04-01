// http://madebyevan.com/shaders/curvature/
vec3 computeCurvature( const in vec3 vertex, const in vec3 normal, const in vec3 color) {
  vec3 n = normalize(normal);
  // Compute curvature
  vec3 dx = dFdx(n);
  vec3 dy = dFdy(n);
  vec3 xneg = n - dx;
  vec3 xpos = n + dx;
  vec3 yneg = n - dy;
  vec3 ypos = n + dy;
  float depth = length(vertex);
  float curvature = (cross(xneg, xpos).y - cross(yneg, ypos).x) * 4.0 / depth;
  return mix(mix(color, color * 0.3, clamp(-curvature * 15.0, 0.0, 1.0)), color * 2.0, clamp(curvature * 25.0, 0.0, 1.0));
}
