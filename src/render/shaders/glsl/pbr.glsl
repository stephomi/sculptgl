#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0 * 3.1415926535897932384626433832795)
#define INV_PI 1.0 / PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uTexture0;
uniform float uExposure;
uniform mat3 uIblTransform;
uniform vec3 uSPH[9];

uniform vec2 uEnvSize;
#define LIMIT_LOD 5.0

// https://mynameismjp.wordpress.com/2008/12/12/logluv-encoding-for-hdr/
const mat3 LUVInverse = mat3(6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720,
                             0.3007, -1.088, 5.6268);
vec3 decodeLUV(const in vec4 logLuv) {
  float Le = logLuv.z * 255.0 + logLuv.w;
  vec3 xp;
  xp.y = exp2((Le - 127.0) / 2.0);
  xp.z = xp.y / logLuv.y;
  xp.x = logLuv.x * xp.z;
  return max(LUVInverse * xp, 0.0);
}

vec2 toUVMipmap(const in float lod, const in vec2 uv) {
  float widthForLevel = uEnvSize.x / exp2(lod);
  vec2 uvSpaceLocal = vec2(1.0) + uv * (widthForLevel - 2.0);
  uvSpaceLocal.y += uEnvSize.y - widthForLevel * 2.0;
  return uvSpaceLocal / uEnvSize;
}

vec2 directionToUV(const in vec3 dir) {
  vec3 signOct = sign(dir);
  vec3 uvOct = dir / dot(dir, signOct);
  if (uvOct.z < 0.0) {
    uvOct.xy = signOct.xy * (1.0 - abs(uvOct)).yx;
  }
  return uvOct.xy * 0.5 + 0.5;
}

vec3 texturePanoramaLod(const in vec3 direction, const in float rLinear) {
  float lod = rLinear * (LIMIT_LOD - 1.0);
  vec2 uvBase = directionToUV(direction);
  return decodeLUV(mix(texture2D(uTexture0, toUVMipmap(floor(lod), uvBase)),
                       texture2D(uTexture0, toUVMipmap(ceil(lod), uvBase)),
                       fract(lod)));
}

vec3 integrateBRDFApprox(const in vec3 specular, float roughness, float NoV) {
  const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04);
  vec4 r = roughness * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;
  return specular * AB.x + AB.y;
}

vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R,
                            const in float realRoughness) {
  float smoothness = 1.0 - realRoughness;
  return mix(N, R, smoothness * (sqrt(smoothness) + realRoughness));
}

vec3 approximateSpecularIBL(const in vec3 specularColor, float rLinear,
                            const in vec3 N, const in vec3 V) {
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = normalize((2.0 * NoV) * N - V);
  R = getSpecularDominantDir(N, R, rLinear);
  vec3 prefilteredColor = texturePanoramaLod(uIblTransform * R, rLinear);
  return prefilteredColor * integrateBRDFApprox(specularColor, rLinear, NoV);
}

// expect shCoefs uniform
// https://github.com/cedricpinson/envtools/blob/master/Cubemap.cpp#L523
vec3 sphericalHarmonics(const in vec3 N) {
  float x = N.x;
  float y = N.y;
  float z = -N.z;
  vec3 result = uSPH[0] + uSPH[1] * y + uSPH[2] * z + uSPH[3] * x +
                uSPH[4] * y * x + uSPH[5] * y * z +
                uSPH[6] * (3.0 * z * z - 1.0) + uSPH[7] * (z * x) +
                uSPH[8] * (x * x - y * y);
  return max(result, vec3(0.0));
}

vec3 computeIBL_UE4(const in vec3 N, const in vec3 V, const in vec3 albedo,
                    const in float roughness, const in vec3 specular) {
  vec3 color = albedo * sphericalHarmonics(uIblTransform * N);
  color += approximateSpecularIBL(specular, roughness, N, V);
  return color;
}
