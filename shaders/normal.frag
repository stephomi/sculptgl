precision mediump float;
uniform vec3 centerPicking;
uniform float radiusSquared;
varying vec3 vVertex;
varying vec3 vNormal;
void main()
{
  vec3 fragColor = vNormal * 0.5 + 0.5;
  vec3 vecDistance = vVertex - centerPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  gl_FragColor = vec4(fragColor, 1.0);
}