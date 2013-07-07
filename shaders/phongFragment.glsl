precision mediump float;
uniform vec3 color, centerPicking;
uniform float radiusSquared;
varying vec3 vVertex, vNormal;
const vec3 colorBackface = vec3(0.81, 0.71, 0.23);
const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);
const float shininess = 100.0;
void main()
{
  vec3 normal;
  vec3 fragColor;
  if(gl_FrontFacing)
  {
    normal = vNormal;
    fragColor = color;
  }
  else
  {
    normal = -vNormal;
    fragColor = colorBackface;
  }
  float dotLN = dot(normal, vecLight);
  vec3 vecR = normalize(2.0 * dotLN * normal - vecLight);
  float dotRVpow = pow(dot(vecR, vecLight), shininess);
  vec3 ambiant = fragColor * 0.5;
  vec3 diffuse = fragColor * 0.5 * max(0.0, dotLN);
  vec3 specular = fragColor * 0.8 * max(0.0, dotRVpow);
  fragColor = ambiant + diffuse + specular;
  vec3 vecDistance = vVertex - centerPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  gl_FragColor = vec4(fragColor, 1.0);
}