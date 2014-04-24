attribute vec2 aVertex;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main()
{
  vTexCoord = aTexCoord;
  gl_Position = vec4(aVertex, 0.5, 1.0);
}