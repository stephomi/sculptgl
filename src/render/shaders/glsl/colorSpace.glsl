#define GAMMA 2.4
#define INV_GAMMA 1.0/2.4

// LINEAR TO SRGB
float linearTosRGB(const in float c) {
  float v = 0.0;
  if(c < 0.0031308) {
    if ( c > 0.0)
      v = c * 12.92;
  } else {
    v = 1.055 * pow(c, INV_GAMMA) - 0.055;
  }
  return v;
}
vec4 linearTosRGB(const in vec4 col_from) {
  vec4 col_to;
  col_to.r = linearTosRGB(col_from.r);
  col_to.g = linearTosRGB(col_from.g);
  col_to.b = linearTosRGB(col_from.b);
  col_to.a = col_from.a;
  return col_to;
}
vec3 linearTosRGB(const in vec3 col_from) {
  vec3 col_to;
  col_to.r = linearTosRGB(col_from.r);
  col_to.g = linearTosRGB(col_from.g);
  col_to.b = linearTosRGB(col_from.b);
  return col_to;
}

// SRGB TO LINEAR
float sRGBToLinear(const in float c) {
  float v = 0.0;
  if ( c < 0.04045 ) {
    if ( c >= 0.0 )
      v = c * ( 1.0 / 12.92 );
  } else {
    v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), GAMMA );
  }
  return v;
}
vec4 sRGBToLinear(const in vec4 col_from) {
  vec4 col_to;
  col_to.r = sRGBToLinear(col_from.r);
  col_to.g = sRGBToLinear(col_from.g);
  col_to.b = sRGBToLinear(col_from.b);
  col_to.a = col_from.a;
  return col_to;
}
vec3 sRGBToLinear(const in vec3 col_from) {
  vec3 col_to;
  col_to.r = sRGBToLinear(col_from.r);
  col_to.g = sRGBToLinear(col_from.g);
  col_to.b = sRGBToLinear(col_from.b);
  return col_to;
}
