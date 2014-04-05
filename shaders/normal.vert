attribute vec3 vertex;
attribute vec3 normal;
uniform mat4 mvMat;
uniform mat4 mvpMat;
uniform mat3 nMat;
varying vec3 vVertex;
varying vec3 vNormal;
void main()
{
  vec4 vert4 = vec4(vertex, 1.0);
  vNormal = normalize(normal);
  vVertex = vec3(mvMat * vert4);
  gl_Position = mvpMat * vert4;
}