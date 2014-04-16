attribute vec3 aVertex;
uniform mat4 uMVP;
void main()
{
  vec4 pos = uMVP * vec4(aVertex, 1.0);
  pos[3] += 0.001;
  gl_Position =  pos;
}