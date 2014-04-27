precision mediump float;
uniform sampler2D uTexture0;
uniform vec3 uCenterPicking;
uniform vec3 uCenterPickingSym;
uniform float uRadiusSquared;
uniform float uScale;
uniform vec3 ptPlane;
uniform vec3 nPlane;
varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vColor;

void picking(in vec3 vert, inout vec3 frag) {
  float r2 = abs(uRadiusSquared);
  vec3 vecDistance = vert - uCenterPicking;
  float dotSquared = dot(vecDistance, vecDistance);
  if(dotSquared < r2 * 1.06 && dotSquared > r2 * 0.94)
    frag *= 0.5;
  if(uRadiusSquared < 0.0) {
    vecDistance = vert - uCenterPickingSym;
    dotSquared = dot(vecDistance, vecDistance);
    if(dotSquared < r2 * 1.06 && dotSquared > r2 * 0.94)
      frag *= 0.5;
    float distToPlane = dot(nPlane,vert - ptPlane);
    if(abs(distToPlane) < 0.2 / uScale){
      frag = min(frag * 1.5, 1.0);
    }
  }
}

void main() {
  vec3 nm_z = normalize(vVertex);
  vec3 nm_x = cross(nm_z, vec3(0.0, 1.0, 0.0));
  vec3 nm_y = cross(nm_x, nm_z);
  vec2 texCoord = vec2(0.5 * dot(vNormal, nm_x) + 0.5, - 0.5 * dot(vNormal, nm_y) - 0.5);
  vec3 fragColor = texture2D(uTexture0, texCoord).rgb * vColor;
  picking(vVertex, fragColor);
  gl_FragColor = vec4(fragColor, 1.0);
}