#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uTexture0;
uniform float uExposure;
uniform mat3 uIblTransform;

vec2 environmentSize = vec2(1024, 512);
vec2 environmentLodRange = vec2(10, 5);

const mat3 LUVInverse = mat3( 6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720, 0.3007, -1.088, 5.6268 );
vec3 LUVToRGB( const in vec4 vLogLuv ) {
  float Le = vLogLuv.z * 255.0 + vLogLuv.w;
  vec3 Xp_Y_XYZp;
  Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
  Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
  Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
  return max(LUVInverse * Xp_Y_XYZp, 0.0);
}

vec2 computeUVForMipmap( const in float level, const in vec2 uv, const in float size, const in float maxLOD ) {
  float widthForLevel = exp2( maxLOD - level);
  vec2 uvSpaceLocal =  vec2(1.0) + uv * vec2(widthForLevel - 2.0, widthForLevel * 0.5 - 2.0);
  uvSpaceLocal.y += size - widthForLevel;
  return uvSpaceLocal / size;
}

vec2 normalToPanoramaUVY( const in vec3 dir ) {
  float n = length(dir.xz);
  vec2 pos = vec2( (n>0.0000001) ? max(-1.0,dir.x / n) : 0.0, dir.y);
  if ( pos.x > 0.0 ) pos.x = min( 0.999999, pos.x );
  pos = acos(pos)*INV_PI;
  pos.x = (dir.z > 0.0) ? pos.x*0.5 : 1.0-(pos.x*0.5);
  pos.x = mod(pos.x-0.25+1.0, 1.0 );
  pos.y = 1.0-pos.y;
  return pos;
}

vec3 texturePanoramaLod(const in sampler2D texture, const in vec2 size , const in vec3 direction, const in float lodInput, const in float maxLOD ) {
  float lod = min( maxLOD, lodInput );
  vec2 uvBase = normalToPanoramaUVY( direction );
  vec3 texel0 = LUVToRGB(texture2D( texture, computeUVForMipmap(floor(lod), uvBase, size.x, maxLOD )));
  vec3 texel1 = LUVToRGB(texture2D( texture, computeUVForMipmap(ceil(lod), uvBase, size.x, maxLOD )));
  return mix(texel0, texel1, fract( lod ) );
}

vec3 integrateBRDFApprox(const in vec3 specular, float roughness, float NoV) {
  const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04);
  vec4 r = roughness * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;
  return specular * AB.x + AB.y;
}

vec3 getSpecularDominantDir( const in vec3 N, const in vec3 R, const in float realRoughness ) {
    float smoothness = 1.0 - realRoughness;
    return mix( N, R, smoothness * ( sqrt( smoothness ) + realRoughness ) );
}

vec3 approximateSpecularIBL( const in vec3 specularColor, float rLinear, const in vec3 N, const in vec3 V ) {
  float NoV = clamp( dot( N, V ), 0.0, 1.0 );
  vec3 R = normalize( (2.0 * NoV ) * N - V);
  R = getSpecularDominantDir(N, R, rLinear);
  vec3 prefilteredColor = texturePanoramaLod( uTexture0, environmentSize, uIblTransform * R, rLinear * environmentLodRange[1], environmentLodRange[0] );
  return prefilteredColor * integrateBRDFApprox(specularColor, rLinear, NoV);
}

// expect shCoefs uniform
// https://github.com/cedricpinson/envtools/blob/master/Cubemap.cpp#L523
vec3 sphericalHarmonics( const in vec3 N ) {
  float x = N.x;
  float y = N.y;
  float z = N.z;
  vec3 result = uSPH[0] + uSPH[1] * y + uSPH[2] * z + uSPH[3] * x + uSPH[4] * y * x + uSPH[5] * y * z + uSPH[6] * (3.0 * z * z - 1.0) + uSPH[7] * (z * x) + uSPH[8] * (x*x - y*y);
  return max(result, vec3(0.0));
}

vec3 computeIBL_UE4( const in vec3 N, const in vec3 V, const in vec3 albedo, const in float roughness, const in vec3 specular) {
  vec3 color = vec3(0.0);
  if ( albedo != color )
    color += albedo * sphericalHarmonics( uIblTransform * N );
  color += approximateSpecularIBL(specular, roughness, N, V);
  return color;
}
