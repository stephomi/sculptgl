// reference
// https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt

#define LIN_SRGB(x) x < 0.0031308 ? x * 12.92 : 1.055 * pow(x, 1.0/2.4) - 0.055
float linearTosRGB(const in float c) {
    return LIN_SRGB(c);
}
vec3 linearTosRGB(const in vec3 c) {
    return vec3(LIN_SRGB(c.r), LIN_SRGB(c.g), LIN_SRGB(c.b));
}
vec4 linearTosRGB(const in vec4 c) {
    return vec4(LIN_SRGB(c.r), LIN_SRGB(c.g), LIN_SRGB(c.b), c.a);
}

#define SRGB_LIN(x) x < 0.04045 ? x * (1.0 / 12.92) : pow((x + 0.055) * (1.0 / 1.055), 2.4)
float sRGBToLinear(const in float c) {
    return SRGB_LIN(c);
}
vec3 sRGBToLinear(const in vec3 c) {
    return vec3(SRGB_LIN(c.r), SRGB_LIN(c.g), SRGB_LIN(c.b));
}
vec4 sRGBToLinear(const in vec4 c) {
    return vec4(SRGB_LIN(c.r), SRGB_LIN(c.g), SRGB_LIN(c.b), c.a);
}

#define RANGE 5.0
// http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
vec4 encodeRGBM(const in vec3 col) {
    vec4 rgbm;
    vec3 color = col / RANGE;
    rgbm.a = clamp( max( max( color.r, color.g ), max( color.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = color / rgbm.a;
    return rgbm;
}

vec3 decodeRGBM(const in vec4 col) {
  return RANGE * col.rgb * col.a;
}
