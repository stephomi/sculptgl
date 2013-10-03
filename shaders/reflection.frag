precision mediump float;
uniform sampler2D refTex;
uniform vec3 centerPicking;
uniform float radiusSquared;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;
const vec4 v4one = vec4(1.0);
void main()
{
  vec2 texCoord = vec2(0.5 * vNormal.x + 0.5, - 0.5 * vNormal.y - 0.5);
  vec4 vertColor = vec4(vColor, 1.0);
  vec4 fragColor = texture2D(refTex, texCoord) * vertColor;
  vec3 vecDistance = vVertex - centerPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  fragColor.a = 1.0;
  gl_FragColor = fragColor;
}