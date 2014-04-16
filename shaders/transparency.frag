precision mediump float;
uniform vec3 uCenterPicking;
uniform float uRadiusSquared;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;
const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);
const float shininess = 1000.0;
void main ()
{
  vec4 color = vec4(vColor, 0.05);
  vec4 specularColor = color * 0.5;
  specularColor.a = color.a * 3.0;
  float specular = max(dot(-vecLight, -reflect(vecLight, vNormal)), 0.0);
  vec4 fragColor = color + specularColor * (specular + pow(specular, shininess));
  vec3 vecDistance = vVertex - uCenterPicking;
  float dotSquared = dot(vecDistance,vecDistance);
  if(dotSquared < uRadiusSquared * 1.06 && dotSquared > uRadiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < uRadiusSquared)
    fragColor *= 1.1;
  gl_FragColor = fragColor;
}