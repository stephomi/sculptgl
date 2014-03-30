attribute vec3 vertex;
uniform mat4 mvpMat;
void main()
{
  vec4 pos = mvpMat * vec4(vertex, 1.0);
  pos[3] += 0.001;
  gl_Position =  pos;
}