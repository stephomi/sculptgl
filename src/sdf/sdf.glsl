#define PI 3.141592653589793
#define PI_2 1.5707963267948966
#define SQRT1_2 0.7071067811865476
#define SQRT2 1.4142135623730951

// raymarching code from https://www.shadertoy.com/view/Xds3zN

// blend color for chamfer and round operators (sd is simple operator distance)
vec3 colorBlending(const in float sd, const in vec4 a, const in vec4 b) {
  float ra = clamp(sd / a.x, 0.0, 1.0);
  float rb = clamp(sd / b.x, 0.0, 1.0);
  return (a.yzw * ra + b.yzw * rb) / (ra + rb);
}

vec3 colorUnion(const in vec4 a, const in vec4 b){
#ifdef BLEND_COLOR
  return colorBlending(min(a.x, b.x), a, b);
#else
  return (a.x < b.x) ? a.yzw : b.yzw;
#endif
}

vec3 colorInter(const in vec4 a, const in vec4 b){
#ifdef BLEND_COLOR
  return colorBlending(max(a.x, b.x), a, b);
#else
  return (a.x < b.x) ? a.yzw : b.yzw;
#endif
}

vec2 pR45(const in vec2 p) {
  return (p + vec2(p.y, -p.x)) * SQRT1_2;
}

/////////////
// PRIMITIVES
/////////////

float cullPlane(const in vec3 p) {
  return p.y >= -0.502 ? p.y + 0.5 : 20.0;
}

float sdSphere(const in vec3 p, const in float s) {
  return length(p) - s;
}

float sdBox(const in vec3 p, const in vec4 b) {
  vec3 d = abs(p) - b.xyz;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0)) - b.w;
}

float sdTorus(const in vec3 p, const in vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

float sdCapsule(const in vec3 p, const in vec2 rh) {
  return mix(length(p.xz) - rh.x, length(vec3(p.x, abs(p.y) - rh.y, p.z)) - rh.x, step(rh.y, abs(p.y)));
}

float sdEllipsoid(const in  vec3 p, const in vec3 r) {
  return (length(p / r) - 1.0) * min(min(r.x, r.y), r.z);
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
  return vec4(opUnionRound(a.x, b.x, r), colorUnion(a, b));
}

// INTER ROUND
float opInterRound(const in float a, const in float b, const in float r) {
  vec2 u = max(vec2(r + a, r + b), vec2(0.0));
  return min(-r, max(a, b)) + length(u);
}
vec4 opInterRound(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opInterRound(a.x, b.x, r), colorInter(a, b));
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
  return min(min(a, b), (a - r + b) * SQRT1_2);
}
vec4 opUnionChamfer(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opUnionChamfer(a.x, b.x, r), colorUnion(a, b));
}

// INTER CHAMFER
float opInterChamfer(const in float a, const in float b, const in float r) {
  return max(max(a, b), (a + r + b) * SQRT1_2);
}
vec4 opInterChamfer(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opInterChamfer(a.x, b.x, r), colorInter(a, b));
}

// SUB CHAMFER
float opSubChamfer(const in float a, const in float b, const in float r) {
  return opInterChamfer(a, -b, r);
}
vec4 opSubChamfer(const in vec4 a, const in vec4 b, const in float r) {
  return vec4(opInterChamfer(a.x, -b.x, r), a.yzw);
}

//////////////////////
// COMBINATION COLUMNS
//////////////////////

// UNION COLUMNS
float opUnionColumns(const in float a, const in  float b, const in vec2 rn) {
  float r = rn.x;
  float n = rn.y;
  if((a < r) && (b < r)) {
    vec2 p = vec2(a, b);
    float columnradius = r * SQRT2 / ((n - 1.0) * 2.0 + SQRT2);
    p = pR45(p);
    p.x -= SQRT1_2 * r;
    p.x += columnradius * SQRT2;
    if(mod(n, 2.0) == 1.0) {
      p.y += columnradius;
    }
    // At this point, we have turned 45 degrees and moved at a point on the
    // diagonal that we want to place the columns on.
    // Now, repeat the domain along this direction and place a circle.
    p.y = mod(p.y + columnradius, columnradius * 2.0) - columnradius;
    float result = length(p) - columnradius;
    result = min(result, p.x);
    result = min(result, a);
    return min(result, b);
  } 

  return min(a, b);
}
vec4 opUnionColumns(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(opUnionColumns(a.x, b.x, rn), colorUnion(a, b));
}

// SUB COLUMNS
float opSubColumns(const in float ain, const float b, const vec2 rn) {
  float a = -ain;
  float r = rn.x;
  float n = rn.y;
  float m = min(a, b);
  //avoid the expensive computation where not needed (produces discontinuity though)
  if((a < r) && (b < r)) {
    vec2 p = vec2(a, b);
    float columnradius = r * SQRT2 / n / 2.0;
    columnradius = r * SQRT2 / ((n - 1.0) * 2.0 + SQRT2);

    p = pR45(p);
    p.y += columnradius;
    p.x -= SQRT1_2 * (r + columnradius);

    if(mod(n, 2.0) == 1.0) {
      p.y += columnradius;
    }
    p.y = mod(p.y + columnradius, columnradius * 2.0) - columnradius;

    float result = -length(p) + columnradius;
    result = max(result, p.x);
    result = min(result, a);
    return -min(result, b);
  }

  return -m;
}
vec4 opSubColumns(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(opSubColumns(a.x, b.x, rn), a.yzw);
}

// INTER COLUMNS
float opInterColumns(const in float a, const in float b, const in vec2 rn) {
  return opSubColumns(a, -b, rn);
}
vec4 opInterColumns(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(opSubColumns(a.x, -b.x, rn), colorInter(a, b));
}

/////////////////////
// COMBINATION STAIRS
/////////////////////
// UNION STAIRS
float opUnionStairs(const in float a, const in float b, const in vec2 rn) {
  float s = rn.x / rn.y;
  float u = b - rn.x;
  return min(min(a, b), 0.5 * (u + a + abs((mod(u - a + s, 2.0 * s)) - s)));
}
vec4 opUnionStairs(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(opUnionStairs(a.x, b.x, rn), colorUnion(a, b));
}

// INTER STAIRS
float opInterStairs(const in float a, const in float b, const in vec2 rn) {
  return -opUnionStairs(-a, -b, rn);
}
vec4 opInterStairs(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(-opUnionStairs(-a.x, -b.x, rn), colorInter(a, b));
}

// SUB STAIRS
float opSubStairs(const in float a, const in float b, const in vec2 rn) {
  return -opUnionStairs(-a, b, rn);
}
vec4 opSubStairs(const in vec4 a, const in vec4 b, const in vec2 rn) {
  return vec4(-opUnionStairs(-a.x, b.x, rn), a.yzw);
}

/////////////
// REPETITION
/////////////

vec3 pMod(const in vec3 p, const in vec3 size) {
  vec3 pmod = p;
  if(size.x > 0.0) pmod.x = mod(p.x + size.x * 0.5, size.x) - size.x * 0.5;
  if(size.y > 0.0) pmod.y = mod(p.y + size.y * 0.5, size.y) - size.y * 0.5;
  if(size.z > 0.0) pmod.z = mod(p.z + size.z * 0.5, size.z) - size.z * 0.5;
  return pmod;
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
  float tmax = 50.0;

  float precis = 0.002;
  for(int i = 0; i < 50; i++) {
    float dist = mapDistance(ro + rd * t);
    if(dist < precis || t > tmax)
      break;
    t += dist;
  }

  vec3 m = t > tmax ? vec3(-1.0) : mapDistanceColor(ro + rd * t).yzw;
  return vec4(t, m);
}

float softshadow(const in vec3 ro, const in vec3 rd) {
  float t = 0.02;
  float tmax = 2.5;
  float precis = 0.001;
  float res = 1.0;
  for(int i = 0; i < 16; i++) {
    float h = mapDistance(ro + rd * t);
    res = min(res, 20.0 * h / t);
    t += clamp( h, 0.02, 0.10 );
    if(h < 0.001 || t > tmax) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 calcNormal(const in vec3 pos) {
  vec3 eps = vec3(0.001, 0.0, 0.0);
  vec3 nor = vec3(
      mapDistance(pos + eps.xyy) - mapDistance(pos - eps.xyy),
      mapDistance(pos + eps.yxy) - mapDistance(pos - eps.yxy),
      mapDistance(pos + eps.yyx) - mapDistance(pos - eps.yyx));
  return normalize(nor);
}

float calcAO(const in vec3 pos, const in vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for(int i = 0; i < 5; i++) {
      float hr = 0.01 + 0.03 * float(i);
      vec3 aopos = nor * hr + pos;
      occ += (hr - mapDistance(aopos)) * sca;
      sca *= 0.95;
  }
  return clamp( 1.0 - 3.0 * occ, 0.0, 1.0 );    
}

vec3 render(const in vec3 ro, const in vec3 rd) {
  vec3 col = vec3(0.5, 0.5, 0.5);
  vec4 res = castRay(ro, rd);

  if(res.y >= 0.0) {
    vec3 pos = ro + res.x * rd;
    vec3 nor = calcNormal(pos);

    vec3 ref = reflect( rd, nor );
    float occ = calcAO( pos, nor );
    vec3  lig = normalize(vec3(-0.6, 0.7, -0.5));
    float amb = clamp(0.5 + 0.5 * nor.y, 0.0, 1.0);
    float dif = clamp(dot(nor, lig), 0.0, 1.0);
    float bac = clamp(dot(nor, normalize(vec3(-lig.x, 0.0, -lig.z))), 0.0, 1.0 ) * clamp( 1.0 - pos.y, 0.0, 1.0);
    float dom = smoothstep(-0.1, 0.1, ref.y);
    float fre = pow(clamp(1.0 + dot(nor, rd), 0.0, 1.0), 2.0);
    float spe = pow(clamp(dot(ref, lig), 0.0, 1.0),16.0);
        
    dif *= softshadow(pos, lig);
    dom *= softshadow(pos, ref);

    vec3 lin = vec3(0.0);
    lin += 1.20 * dif * vec3(1.00, 0.85, 0.55);
    lin += 1.20 * spe * vec3(1.00, 0.85, 0.55) * dif;
    lin += 0.20 * amb * vec3(0.50, 0.70, 1.00) * occ;
    lin += 0.30 * dom * vec3(0.50, 0.70, 1.00) * occ;
    lin += 0.30 * bac * vec3(0.25, 0.25, 0.25) * occ;
    lin += 0.40 * fre * vec3(1.00, 1.00, 1.00) * occ;

    col = res.yzw * lin;
  }

  return clamp(col, 0.0, 1.0);
}

#ifdef SHADERTOY
mat3 setCamera( const in vec3 ro, const in vec3 ta, const float cr ){
  vec3 cw = normalize(ta-ro);
  vec3 cp = vec3(sin(cr), cos(cr),0.0);
  vec3 cu = normalize( cross(cw,cp) );
  vec3 cv = normalize( cross(cu,cw) );
  return mat3( cu, cv, cw );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
  vec2 q = fragCoord.xy / iResolution.xy;
  vec2 p = -1.0 + 2.0 * q;
  p.x *= iResolution.x / iResolution.y;
  vec2 mo = iMouse.xy / iResolution.xy;
  float time = 15.0 + iGlobalTime;

  // camera 
  vec3 ro = SHADERTOY_ZOOM * vec3( -0.5 + 3.5 * cos(0.1 * time + 6.0 * mo.x), 1.0 + 2.0 * mo.y, 0.5 + 3.5 * sin(0.1 * time + 6.0 * mo.x));
  vec3 ta = vec3(-0.5, -0.4, 0.5);

  // camera-to-world transformation
  mat3 ca = setCamera(ro, ta, 0.0);

  // ray direction
  vec3 rd = ca * normalize(vec3(p.xy, 2.0));

  fragColor = vec4(render(ro, rd), 1.0);
}

#else

vec3 raymarch(const in vec3 origin, const in mat3 view, const in vec2 uv, const in vec2 invSize) {
  vec2 p = -1.0 + 2.0 * uv;
  p.x *= invSize.y / invSize.x;
  vec3 rd = normalize(view * vec3(p, 2.0));
  return render(origin, rd);
}

void main() {
  gl_FragColor = vec4(raymarch(uOrigin, uView, vUV, uInvSize), 1.0);
}

#endif
