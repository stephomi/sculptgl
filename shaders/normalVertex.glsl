attribute vec3 vertex, normal;
uniform mat4 mvMat, mvpMat;
uniform mat3 nMat;
varying vec3 vVertex;
varying vec3 vNormal;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  vNormal = normalize(nMat * normal);
  vVertex = vec3(mvMat * vertex4);
  gl_Position = mvpMat * vertex4;
}