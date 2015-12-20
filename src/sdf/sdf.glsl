// blend color for chamfer and round operators (sd is simple operator distance)
vec3 colorBlending(const in float sd, const in vec4 a, const in vec4 b) {
  float ra = clamp(sd / a.x, 0.0, 1.0);
  float rb = clamp(sd / b.x, 0.0, 1.0);
  return (a.yzw * ra + b.yzw * rb) / (ra + rb);
}

/////////////
// PRIMITIVES
/////////////

float sdSphere(const in vec3 p, const in float s) {
  return length(p) - s;
}

float sdBox(const in vec3 p, const in vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdEllipsoid(const in  vec3 p, const in vec3 r) {
  return (length(p / r) - 1.0) * min(min(r.x, r.y), r.z);
}

float udRoundBox(const in  vec3 p, const in vec3 b, const in float r) {
  return length(max(abs(p) - b, 0.0)) - r;
}

float sdTorus(const in vec3 p, const in vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

///////////////
// COMBINATIONS
///////////////

// UNION
float opUnion(const in float a, const in float b) {
  return min(a, b);
}
vec4 opUnion(const in vec4 a, const in vec4 b) {
  return (a.x < b.x) ? a : b;
}

// INTER
float opInter(const in float a, const in float b) {
  return max(a, b);
}
vec4 opInter(const in vec4 a, const in vec4 b) {
  return (a.x > b.x) ? a : b;
}

// SUB
float opSub(const in float a, const in float b) {
  return max(-b, a);
}
vec4 opSub(const in vec4 a, const in vec4 b) {
  // to keep b material on diff intersection instead of a mat
  // return (-b.x > a.x) ? vec4(-b.x, b.yzw) : a);
  return vec4(max(-b.x, a.x), a.yzw);
}

// see hg_sdf.glsl
/////////////////////
// COMBINATIONS ROUND
/////////////////////

// UNION ROUND (soft media mol version)
float opUnionRound(const in float a, const in float b, const in float r) {
  float e = max(r - abs(a - b), 0.0);
  return min(a, b) - e * e * 0.25 / r;
}
vec4 opUnionRound(const in vec4 a, const in vec4 b, const in float r) {
  float e = max(r - abs(a.x - b.x), 0.0);
  float sd = min(a.x, b.x);
  float d = sd - e * e * 0.25/r;

#ifdef BLEND_COLOR
  vec3 col = colorBlending(sd, a, b);
#else
  vec3 col = (a.x < b.x) ? a.yzw : b.yzw;
#endif

  return vec4(d, col);
}

// INTER ROUND
float opInterRound(const in float a, const in float b, const in float r) {
  vec2 u = max(vec2(r + a, r + b), vec2(0.0));
  return min(-r, max(a, b)) + length(u);
}
vec4 opInterRound(const in vec4 a, const in vec4 b, const in float r) {
  vec2 u = max(vec2(r + a.x, r + b.x), vec2(0.0));
  float sd = max(a.x, b.x);
  float d = min(-r, sd) + length(u);

#ifdef BLEND_COLOR
  vec3 col = colorBlending(sd, a, b);
#else
  vec3 col = (a.x > b.x) ? a.yzw : b.yzw;
#endif

  return vec4(d, col);
}

// SUB ROUND
float opSubRound(const in float a, const in float b, const in float r) {
  return opInterRound(a, -b, r);
}
vec4 opSubRound(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opInterRound(a.x, -b.x, r), a.yzw);
}

///////////////////////
// COMBINATIONS CHAMFER
///////////////////////

// UNION CHAMFER
float opUnionChamfer(const in float a, const in float b, const in float r) {
  return min(min(a, b), (a - r + b) * 0.7071067811865476);
}
vec4 opUnionChamfer(const in vec4 a, const in vec4 b, const in float r) {
  float sd = min(a.x, b.x);
  float d = min(sd, (a.x - r + b.x) * 0.7071067811865476);

#ifdef BLEND_COLOR
  vec3 col = colorBlending(sd, a, b);
#else
  vec3 col = (a.x < b.x) ? a.yzw : b.yzw;
#endif

  return vec4(d, col);
}

// INTER CHAMFER
float opInterChamfer(const in float a, const in float b, const in float r) {
  return max(max(a, b), (a + r + b) * 0.7071067811865476);
}
vec4 opInterChamfer(const in vec4 a, const in vec4 b, const in float r) {
  float sd = max(a.x, b.x);
  float d = max(sd, (a.x + r + b.x) * 0.7071067811865476);

#ifdef BLEND_COLOR
  vec3 col = colorBlending(sd, a, b);
#else
  vec3 col = (a.x > b.x) ? a.yzw : b.yzw;
#endif

  return vec4(d, col);
}

// SUB CHAMFER
float opSubChamfer(const in float a, const in float b, const in float r) {
  return opInterChamfer(a, -b, r);
}
vec4 opSubChamfer(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opInterChamfer(a.x, -b.x, r), a.yzw);
}

////////////
// HELPERS
////////////
vec4 mapDistanceColor(const in vec3 point) {
  %ID_MAP_DISTANCE_COLOR
}

float mapDistance(const in vec3 point) {
  %ID_MAP_DISTANCE
}

vec4 castRay(const in vec3 ro, const in vec3 rd) {
  float t = 1.0;
  float tmax = 1000.0;

  float precis = 0.02;
  vec3 m = vec3(-1.0);
  for( int i = 0; i < 100; i++ ) {
    vec4 res = mapDistanceColor( ro + rd * t );
    if( res.x < precis || t > tmax ) {
      m = res.yzw;
      break;
    }
    t += res.x;
    m = res.yzw;
  }

  if( t > tmax ) m.x = -1.0;
  return vec4( t, m );
}

float softshadow( const in vec3 ro, const in vec3 rd ) {
  float t = 10.0;
  float tmax = 1000.0;
  float precis = 0.005;
  float res = 1.0;
  for( int i = 0; i < 16; i++ ) {
    float h = mapDistance( ro + rd * t );
    res = min( res, 20.0 * h / t );
    t += h;
    if( h < precis || t > tmax ) break;
  }
  return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal(const in vec3 pos) {
  vec3 eps = vec3( 0.001, 0.0, 0.0 );
  vec3 nor = vec3(
      mapDistance(pos + eps.xyy) - mapDistance(pos - eps.xyy),
      mapDistance(pos + eps.yxy) - mapDistance(pos - eps.yxy),
      mapDistance(pos + eps.yyx) - mapDistance(pos - eps.yyx));
  return normalize(nor);
}

vec3 render(const in vec3 ro, const in vec3 rd) {
  vec3 col = vec3(0.5, 0.5, 0.5);
  vec4 res = castRay(ro, rd);

  if( res.y >= 0.0 ) {
    vec3 pos = ro + res.x * rd;
    vec3 nor = calcNormal( pos );

    // special case of plane
    if( res.y == 10000.0 ) {
      float f = mod( floor(0.5*pos.z) + floor(0.5*pos.x), 2.0);
      col = 0.4 + 0.1 * f * vec3(1.0);
    } else {
      col = res.yzw;
    }

    vec3 lig = normalize( vec3(-0.4, 0.8, 0.4) );
    vec3 lig2 = normalize( vec3(0.5, 0.7, -0.5) );

    vec3 lin = 1.10 * clamp(dot(nor, lig), 0.0, 1.0) * vec3(0.80, 0.70, 0.60) * softshadow(pos, lig);
    lin += 0.50 * clamp(dot(nor, lig2), 0.0, 1.0) * vec3(1.00, 0.90, 0.70) * softshadow(pos, lig2);
    lin += 0.30 * clamp(0.5 - 0.5 * nor.y, 0.0, 1.0) * vec3(0.70, 0.70, 0.60);

    col *= lin;
  }

  return clamp(col, 0.0, 1.0);
}

// https://www.shadertoy.com/view/Xds3zN
vec3 raymarch(const in vec3 origin, const in mat3 view, const in vec2 uv, const in vec2 invSize) {
  vec2 p = -1.0 + 2.0 * uv;
  p.x *= invSize.y / invSize.x;
  vec3 rd = normalize(view * vec3(p, 2.0));
  return render(origin, rd);
}