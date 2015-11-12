// reference
// https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt

// approximation
// http://chilliant.blogspot.fr/2012/08/srgb-approximations-for-hlsl.html
float lineartoSRGB(const in float c) {
    float S1 = sqrt(c);
    float S2 = sqrt(S1);
    float S3 = sqrt(S2);
    return 0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * c;
}
vec3 lineartoSRGB(const in vec3 c) {
    vec3 S1 = sqrt(c);
    vec3 S2 = sqrt(S1);
    vec3 S3 = sqrt(S2);
    return 0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * c;
}
vec4 lineartoSRGB(const in vec4 c) {
    vec3 S1 = sqrt(c.rgb);
    vec3 S2 = sqrt(S1);
    vec3 S3 = sqrt(S2);
    return vec4(0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * c.rgb, c.a);
}

float sRGBToLinear(const in float c) {
    return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
}
vec3 sRGBToLinear(const in vec3 c) {
    return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
}
vec4 sRGBToLinear(const in vec4 c) {
    return vec4(c.rgb * (c.rgb * (c.rgb * 0.305306011 + 0.682171111) + 0.012522878), c.a);
}

#define RANGE 1.0
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