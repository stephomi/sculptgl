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

  // Compute surface properties
  float corrosion = clamp(-curvature * 15.0, 0.0, 1.0);
  float shine = clamp(curvature * 25.0, 0.0, 1.0);
  vec3 light = normalize(vec3(0.0, 1.0, 10.0));
  vec3 diffuse = mix(mix(color, color * 0.3, corrosion), color * 2.0, shine);
  vec3 specular = mix(vec3(0.0), vec3(1.0) - diffuse, shine);
  float shininess = 128.0;

  // Compute final color
  float cosAngle = dot(n, light);
  return diffuse * max(0.0, cosAngle) + specular * pow(max(0.0, cosAngle), shininess);
}
