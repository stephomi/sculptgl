attribute vec3 vertex, normal;
uniform mat4 mvMat, mvpMat;
varying vec3 vVertex, vNormal;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  vNormal = normal;
  vVertex = vec3(mvMat * vertex4);
  gl_Position = mvpMat * vertex4;
}