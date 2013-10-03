precision mediump float;
uniform sampler2D backgroundTex;
varying vec2 vTexCoord;
void main()
{
  gl_FragColor =  texture2D(backgroundTex, vTexCoord);
}