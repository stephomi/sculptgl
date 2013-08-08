attribute vec3 vertex, normal, color;
uniform mat4 mvMat, mvpMat;
uniform mat3 nMat;
varying vec3 vVertex, vNormal, vColor;
varying vec2 vTexCoord;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  vNormal = nMat * normal;
  vVertex = vec3(mvMat * vertex4);
  vColor = color;
  vec3 nm_z = normalize(vVertex);
  vec3 nm_x = cross(nm_z, vec3(0.0, 1.0, 0.0));
  vec3 nm_y = cross(nm_x, nm_z);
  vNormal = vec3(dot(vNormal, nm_x), dot(vNormal, nm_y), dot(vNormal, nm_z));
  gl_Position = mvpMat * vertex4;
}