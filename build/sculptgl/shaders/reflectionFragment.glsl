precision mediump float;
uniform sampler2D refTex;
uniform vec3 color, centerPicking;
uniform float radiusSquared;
varying vec3 vVertex, vNormal;
const vec4 v4one = vec4(1.0);
void main()
{
  vec2 texCoord = vec2(0.5 * vNormal.x + 0.5, - 0.5 * vNormal.y - 0.5);
  vec4 texel = texture2D(refTex, texCoord);
  vec4 fragColor = texel;
  if(color.r > 0.0)
  {
     vec4 mf = texel * 2.0;
    vec4 sf = mf - v4one;
    mf = min(mf, v4one);
    sf = max(sf, vec4(0.0));
    fragColor = mf - (v4one - vec4(color, 1.0)) * (v4one - sf) * mf;
  }
  vec3 vecDistance = vVertex - centerPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  fragColor.a = 1.0;
  gl_FragColor = fragColor;
}