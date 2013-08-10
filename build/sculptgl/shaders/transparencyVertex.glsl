attribute vec3 vertex, normal, color;
uniform mat4 mvMat, mvpMat;
uniform mat3 nMat;
varying vec3 vVertex, vNormal, vColor;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  vNormal = nMat * normal;
  vColor = color;
  vVertex = vec3(mvMat * vertex4);
  gl_Position = mvpMat * vertex4;
}