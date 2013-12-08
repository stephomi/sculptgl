precision mediump float;
uniform vec3 centerPicking;
uniform float radiusSquared;
uniform vec2 lineOrigin;
uniform vec2 lineNormal;
varying vec3 vVertex;
varying vec3 vNormal;
const vec4 colorCutPlane = vec4(0.81, 0.31, 0.23, 1.0);
void main()
{
  vec3 fragColor = vNormal * 0.5 + 0.5;
  vec3 vecDistance = vVertex - centerPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  if(dot(lineNormal, vec2(gl_FragCoord) - lineOrigin) <= 0.0)
    gl_FragColor = vec4(fragColor, 1.0);
  else
    gl_FragColor = vec4(fragColor, 1.0) * colorCutPlane;
}