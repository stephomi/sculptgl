precision mediump float;
uniform vec3 uCenterPicking;
uniform float uRadiusSquared;
varying vec3 vVertex;
varying vec3 vNormal;
void main()
{
  vec3 fragColor = vNormal * 0.5 + 0.5;
  vec3 vecDistance = vVertex - uCenterPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < uRadiusSquared * 1.06 && dotSquared > uRadiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < uRadiusSquared)
    fragColor *= 1.1;
  gl_FragColor = vec4(fragColor, 1.0);
}