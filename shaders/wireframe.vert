attribute vec3 vertex;
attribute vec4 normal;
uniform mat4 mvMat, mvpMat;
uniform mat3 nMat;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vBarycenter;
void main()
{
  vec4 vertex4 = vec4(vertex, 1.0);
  float bVal = normal[3];
  if(bVal > 1.5)
    vBarycenter = vec3(0,0,1);
  else if(bVal < 0.5)
    vBarycenter = vec3(0,1,0);
  else
    vBarycenter = vec3(1,0,0);
  vNormal = normalize(nMat * vec3(normal));
  vVertex = vec3(mvMat * vertex4);
  gl_Position = mvpMat * vertex4;
}