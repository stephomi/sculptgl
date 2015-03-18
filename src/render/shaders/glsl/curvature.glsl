
vec3 computeCurvature( const in vec3 vertex, const in vec3 normal, const in vec3 color) {
  float curvature = length(fwidth(normal)) / length(vertex);
  float shine = clamp(curvature * 200.0, 0.0, 1.0);
  vec3 light = normalize(vec3(0.0, 1.0, 10.0));
  const vec3 ambient = vec3(0.15, 0.1, 0.1);
  vec3 diffuse = mix(color, color*2.0, shine) - ambient;
  vec3 spec = mix(vec3(0.0), vec3(1.0) - ambient - diffuse, shine);
  const float shininess = 128.0;
  float cosAngle = dot(normal, light);
  return ambient + diffuse * max(0.0, cosAngle) + spec * pow(max(0.0, cosAngle), shininess);
}
