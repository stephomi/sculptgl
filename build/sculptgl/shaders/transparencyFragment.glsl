precision mediump float;
uniform vec3 lightPos, centerPicking;
uniform vec4 color;
uniform mat4 mvMat;
uniform float radiusSquared;
varying vec3 vNormal, vVertex;
const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);
const float shininess = 1000.0;
void main ()
{
  vec3 reflect = -reflect(normalize(vec3(mvMat * vec4(lightPos, 1.0))), vNormal);
  float specular = max(dot(-vecLight, reflect), 0.0);
  vec4 fragColor = color + color*(specular+pow(specular, shininess));
  vec3 vecDistance = vVertex-centerPicking;
  float dotSquared = dot(vecDistance,vecDistance);
  if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)
    fragColor *= 0.5;
  else if(dotSquared < radiusSquared)
    fragColor *= 1.1;
  gl_FragColor = fragColor;
}