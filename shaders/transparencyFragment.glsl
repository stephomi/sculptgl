precision mediump float;
uniform vec3 centerPicking;
uniform float radiusSquared;
varying vec3 vNormal, vVertex, vColor;
const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);
const float shininess = 1000.0;
void main ()
{
  vec4 color = vec4(vColor, 0.05);
  vec4 specularColor = color * 0.5;
  specularColor.a = color.a * 3.0;
  vec3 normal = -vNormal;
  if(gl_FrontFacing)
    normal = vNormal;
  vec3 reflect = -reflect(vecLight, normal);
  float specular = max(dot(-vecLight, reflect), 0.0);
  vec4 fragColor = color + specularColor * (specular + pow(specular, shininess));
  vec3 vecDistance = vVertex-centerPicking;
  float dotSquared = dot(vecDistance,vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  gl_FragColor = fragColor;
}