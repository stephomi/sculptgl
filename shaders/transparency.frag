precision mediump float;
uniform vec3 centerPicking;
uniform float radiusSquared;
uniform vec2 lineOrigin;
uniform vec2 lineNormal;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;
const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);
const vec4 colorCutPlane = vec4(0.81, 0.31, 0.23, 1.0);
const float shininess = 1000.0;
void main ()
{
  vec4 color = vec4(vColor, 0.05);
  vec4 specularColor = color * 0.5;
  specularColor.a = color.a * 3.0;
  float specular = max(dot(-vecLight, -reflect(vecLight, vNormal)), 0.0);
  vec4 fragColor = color + specularColor * (specular + pow(specular, shininess));
  vec3 vecDistance = vVertex-centerPicking;
  float dotSquared = dot(vecDistance,vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  if(dot(lineNormal, vec2(gl_FragCoord) - lineOrigin) <= 0.0)
    gl_FragColor = fragColor;
  else
    gl_FragColor = fragColor * colorCutPlane;
}