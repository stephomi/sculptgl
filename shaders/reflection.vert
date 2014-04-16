attribute vec3 aVertex;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uMV;
uniform mat4 uMVP;
uniform mat3 uN;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;
void main()
{
  vec4 vertex4 = vec4(aVertex, 1.0);
  vNormal = normalize(uN * aNormal);
  vVertex = vec3(uMV * vertex4);
  vColor = aColor;
  gl_Position = uMVP * vertex4;
}