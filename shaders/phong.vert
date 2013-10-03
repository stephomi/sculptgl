attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
uniform mat4 mvMat;
uniform mat4 mvpMat;
uniform mat3 nMat;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  vNormal = nMat * normal;
  vColor = color;
  vVertex = vec3(mvMat * vertex4);
  gl_Position = mvpMat * vertex4;
}