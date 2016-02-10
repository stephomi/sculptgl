
float outlineDistance( const in vec2 uv, const in sampler2D tex, const in vec2 invSize ) {
  float fac0 = 2.0;
  float fac1 = 1.0;
  float ox = invSize.x;
  float oy = invSize.y;
  vec4 texel0 = texture2D(tex, uv + vec2(ox, oy));
  vec4 texel1 = texture2D(tex, uv + vec2(ox, 0.0));
  vec4 texel2 = texture2D(tex, uv + vec2(ox, -oy));
  vec4 texel3 = texture2D(tex, uv + vec2(0.0, -oy));
  vec4 texel4 = texture2D(tex, uv + vec2(-ox, -oy));
  vec4 texel5 = texture2D(tex, uv + vec2(-ox, 0.0));
  vec4 texel6 = texture2D(tex, uv + vec2(-ox, oy));
  vec4 texel7 = texture2D(tex, uv + vec2(0.0, oy));
  vec4 rowx = -fac0 * texel5 + fac0 * texel1 + -fac1 * texel6 + fac1 * texel0 + -fac1 * texel4 + fac1 * texel2;
  vec4 rowy = -fac0 * texel3 + fac0 * texel7 + -fac1 * texel4 + fac1 * texel6 + -fac1 * texel2 + fac1 * texel0;
  return dot(rowy, rowy) + dot(rowx, rowx);
}
