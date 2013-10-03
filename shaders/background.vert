attribute vec2 vertex;
attribute vec2 texCoord;
varying vec2 vTexCoord;
void main()
{
  vTexCoord = texCoord;
  gl_Position = vec4(vertex, 0.5, 1.0);
}