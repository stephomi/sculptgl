attribute vec3 aVertex;
attribute vec3 aNormal;
uniform mat4 uMV;
uniform mat4 uMVP;
uniform mat3 uN;
varying vec3 vVertex;
varying vec3 vNormal;
void main()
{
  vec4 vert4 = vec4(aVertex, 1.0);
  vNormal = normalize(aNormal);
  vVertex = vec3(uMV * vert4);
  gl_Position = uMVP * vert4;
}