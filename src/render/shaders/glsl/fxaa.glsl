// https://github.com/mattdesl/glsl-fxaa
#define FXAA_REDUCE_MIN (1.0/ 128.0)
#define FXAA_REDUCE_MUL (1.0 / 8.0)
#define FXAA_SPAN_MAX 8.0

vec3 fxaa(const in sampler2D tex, const in vec2 uvNW, const in vec2 uvNE, const in vec2 uvSW, const in vec2 uvSE, const in vec2 uvM, const in vec2 invRes) {
    const vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(texture2D(tex, uvNW).xyz, luma);
    float lumaNE = dot(texture2D(tex, uvNE).xyz, luma);
    float lumaSW = dot(texture2D(tex, uvSW).xyz, luma);
    float lumaSE = dot(texture2D(tex, uvSE).xyz, luma);
    float lumaM  = dot(texture2D(tex, uvM).xyz,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * invRes;
    
    vec3 rgbA = 0.5 * ( texture2D(tex, uvM + dir * (1.0 / 3.0 - 0.5)).xyz + texture2D(tex, uvM + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * ( texture2D(tex, uvM - dir * 0.5).xyz + texture2D(tex, uvM + dir * 0.5).xyz);
    
    float lumaB = dot(rgbB, luma);
    if((lumaB < lumaMin) || (lumaB > lumaMax))
      return rgbA;
    return rgbB;
}