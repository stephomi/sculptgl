define([
  'lib/glMatrix',
  'render/shaders/ShaderBase',
  'render/Attribute'
], function (glm, ShaderBase, Attribute) {

  'use strict';

  var mat4 = glm.mat4;

  var glfloat = 0x1406;

  var ShaderPBR = {};
  ShaderPBR.texPath = 'https://labs.sketchfab.com/siggraph2014/assets/3d/textures/terrace_near_the_granaries/solid/rgbe/terrace_near_the_granaries_mip.png';
  ShaderPBR.uniforms = {};
  ShaderPBR.attributes = {};
  ShaderPBR.program = undefined;

  ShaderPBR.uniformNames = ['uMV', 'uMVP', 'uN', 'uIblTransform', 'uTexture0', 'uRoughness', 'uMetallic', 'uExposure', 'uHammersley'];
  Array.prototype.push.apply(ShaderPBR.uniformNames, ShaderBase.uniformNames.picking);

  ShaderPBR.vertex = [
    'precision mediump float;',
    'attribute vec3 aVertex;',
    'attribute vec3 aNormal;',
    'attribute vec3 aColor;',
    'uniform mat4 uMV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uN;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vAlbedo;',
    'void main() {',
    '  vec4 vertex4 = vec4(aVertex, 1.0);',
    '  vNormal = normalize(uN * aNormal);',
    '  vAlbedo = aColor;',
    '  vVertex = vec3(uMV * vertex4);',
    '  gl_Position = uMVP * vertex4;',
    '}'
  ].join('\n');

  ShaderPBR.fragment = [
    'precision mediump float;',
    'varying vec3 vVertex;',
    'varying vec3 vNormal;',
    'varying vec3 vAlbedo;',
    ShaderBase.strings.pickingUniforms,
    ShaderBase.strings.pickingFunction,
    '#define NB_SAMPLES 4',
    '',
    '#define PI 3.1415926535897932384626433832795',
    '#define PI_2 (2.0*3.1415926535897932384626433832795)',
    '#define INV_PI 1.0/PI',
    '#define INV_LOG2 1.4426950408889634073599246810019',
    '#define DefaultGamma 2.4',
    '',
    'uniform mat4 uIblTransform;',
    'uniform sampler2D uTexture0;',
    'uniform vec2 uHammersley[NB_SAMPLES];',
    'uniform float uExposure;',
    'uniform float uRoughness;',
    'uniform float uMetallic;',
    '',
    '// uniform vec2 environmentSize;',
    'vec2 environmentSize = vec2(512, 512);',
    'float MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;',
    '',
    'const vec3 nullVec3 = vec3(0.0);',
    '',
    'vec3 MaterialAlbedo, MaterialSpecular;',
    'float MaterialRoughness;',
    '',
    'vec3 TangentX, TangentY;',
    'float NdotV, Alpha, Alpha2, Alpha2MinusOne, Alpha05;',
    '',
    'vec4 computeUVForMipmap( const in float level, const in vec2 uv, const in vec2 size ) {',
    '  // our texture is square, so each level is width x height/2',
    '  float heightInTextureSpace = pow( 2.0, level )/size.y; // rescale to the size of the mipmap lev',
    '  float maxU = 2.0 * heightInTextureSpace;',
    '  float u = uv[0] * maxU;',
    '  float v = uv[1] * maxU + heightInTextureSpace;',
    '  return vec4( u, v , maxU, maxU );',
    '}',
    '',
    '',
    'float linearTosRGB(const in float c, const in float gamma) {',
    '  float v = 0.0;',
    '  if(c < 0.0031308) {',
    '    if ( c > 0.0)',
    '      v = c * 12.92;',
    '  } else {',
    '    v = 1.055 * pow(c, 1.0/ gamma) - 0.055;',
    '  }',
    '  return v;',
    '}',
    '',
    'vec4 linearTosRGB(const in vec4 col_from, const in float gamma) {',
    '  vec4 col_to;',
    '  col_to.r = linearTosRGB(col_from.r, gamma);',
    '  col_to.g = linearTosRGB(col_from.g, gamma);',
    '  col_to.b = linearTosRGB(col_from.b, gamma);',
    '  col_to.a = col_from.a;',
    '  return col_to;',
    '}',
    '',
    'vec3 linearTosRGB(const in vec3 col_from, const in float gamma) {',
    '  vec3 col_to;',
    '  col_to.r = linearTosRGB(col_from.r, gamma);',
    '  col_to.g = linearTosRGB(col_from.g, gamma);',
    '  col_to.b = linearTosRGB(col_from.b, gamma);',
    '  return col_to;',
    '}',
    '',
    'float sRGBToLinear(const in float c, const in float gamma) {',
    '  float v = 0.0;',
    '  if ( c < 0.04045 ) {',
    '    if ( c >= 0.0 )',
    '      v = c * ( 1.0 / 12.92 );',
    '  } else {',
    '    v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );',
    '  }',
    '  return v;',
    '}',
    'vec4 sRGBToLinear(const in vec4 col_from, const in float gamma) {',
    '  vec4 col_to;',
    '  col_to.r = sRGBToLinear(col_from.r, gamma);',
    '  col_to.g = sRGBToLinear(col_from.g, gamma);',
    '  col_to.b = sRGBToLinear(col_from.b, gamma);',
    '  col_to.a = col_from.a;',
    '  return col_to;',
    '}',
    'vec3 sRGBToLinear(const in vec3 col_from, const in float gamma) {',
    '  vec3 col_to;',
    '  col_to.r = sRGBToLinear(col_from.r, gamma);',
    '  col_to.g = sRGBToLinear(col_from.g, gamma);',
    '  col_to.b = sRGBToLinear(col_from.b, gamma);',
    '  return col_to;',
    '}',
    '',
    'vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
    '  vec4 rgbe = texture2D(texture, uv );',
    '  return rgbe.rgb * 255.0 * pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
    '}',
    '',
    'vec2 normalToSphericalUV( const in vec3 n ) {',
    '  float EPS = 1e-5;',
    '  if ( n.y > (1.0-EPS) ) return vec2( 0.5, 0.0);',
    '  else if ( n.y < -(1.0-EPS) ) return vec2( 0.5, 1.0-EPS);',
    '',
    '  float yaw = acos(n.y) * INV_PI;',
    '  float pitch;',
    '  float y = n.z;',
    '  if ( abs( y ) < EPS )',
    '    y = EPS;',
    '  pitch = ( atan(n.x, y) + PI) * 0.5 * INV_PI;',
    '  return vec2( pitch, yaw );',
    '}',
    '',
    'vec3 textureRGBELinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {',
    '  vec2 t = 1.0 / size;',
    '',
    '  float maxX = mod(uv.x+t.x, maxBox.x);',
    '  float maxY = min(uv.y+t.y, maxBox.y-t.y); // clamp to one pixel befo',
    '',
    '  vec3 a = textureRGBE(texture, uv ),',
    '    b = textureRGBE(texture, vec2( maxX, uv.y) ),',
    '    c = textureRGBE(texture, vec2( uv.x, maxY) ),',
    '    d = textureRGBE(texture, vec2( maxX, maxY) );',
    '  vec2 f = fract(uv * size);',
    '  vec3 A = mix(a, b, f.x),',
    '    B = mix(c, d, f.x);',
    '  return mix(A, B, f.y);',
    '}',
    '',
    'vec3 texturePanoramicRGBELod(const in sampler2D texture, const in vec2 size , const in vec3 direction, const float lodInput) {',
    '  vec2 uvBase = normalToSphericalUV( direction );',
    '  uvBase.y *= 0.5;',
    '  float lod = max(1.0, MaxLOD-lodInput);',
    '  float lod0 = floor(lod);',
    '  vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );',
    '  vec3 texel0 = textureRGBELinearPanoramic( texture, size, uv0.xy, uv0.zw);',
    '',
    '  float lod1 = ceil(lod);',
    '  vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );',
    '  vec3 texel1 = textureRGBELinearPanoramic( texture, size, uv1.xy, uv1.zw);',
    '',
    '  return mix(texel0, texel1, fract( lod ) );',
    '}',
    '',
    'vec3 texturePanoramicRGBELod2(const in sampler2D texture, const in vec2 size , const in vec3 direction, const float lodInput) {',
    '  vec2 uvBase = normalToSphericalUV( direction );',
    '  uvBase.y *= 0.5;',
    '  float lod = max(1.0, MaxLOD-lodInput);',
    '  float lod0 = floor(lod);',
    '  vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );',
    '  vec3 texel0 = textureRGBELinearPanoramic( texture, size, uv0.xy, uv0.zw);',
    '',
    '  float lod1 = ceil(lod);',
    '  vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );',
    '  vec3 texel1 = textureRGBELinearPanoramic( texture, size, uv1.xy, uv1.zw);',
    '',
    '  return mix(texel0, texel1, fract( lod ) );',
    '}',
    '',
    'vec3 textureRGBELinear(const in sampler2D texture, const in vec2 size, const in vec2 uv) {',
    '  vec2 t = 1.0 / size;',
    '',
    '  vec3 a = textureRGBE(texture, uv ),',
    '    b = textureRGBE(texture, uv + vec2(t.x, 0.0) ),',
    '    c = textureRGBE(texture, uv + vec2(0.0, t.y) ),',
    '    d = textureRGBE(texture, uv + vec2(t.x, t.y) );',
    '',
    '  vec2 f = fract(uv * size);',
    '  vec3 A = mix(a, b, f.x),',
    '    B = mix(c, d, f.x);',
    '  return mix(A, B, f.y);',
    '}',
    '',
    'vec3 textureSpheremapRGBE(const in sampler2D texture, const in vec2 size, const in vec3 normal) {',
    '  return textureRGBELinear(texture, size, normalToSphericalUV( normal ) ).rgb;',
    '}',
    '',
    'mat3 getIBLTransfrom( mat4 transform ) {',
    '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
    '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
    '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
    '  mat3 m = mat3(x,y,z);',
    '  return m;',
    '}',
    '',
    'float distortion(const in vec3 Wn) {',
    '  return 1.0/max(0.0000001, sqrt(1.0-Wn.y*Wn.y));',
    '}',
    '',
    'float computeLOD(const in vec3 Ln, const in float p) {',
    '  return max(0.0, (MaxLOD-1.5) - 0.5*(log(float(NB_SAMPLES)) + log( p * distortion(Ln) ))* INV_LOG2);',
    '}',
    '',
    'float G1( float ndw, float k ) {',
    '  return 1.0 / mix( ndw, 1.0, k);',
    '}',
    '',
    'vec3 F_Schlick( const in vec3 f0, const in float vdh ) {',
    '  float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);',
    '  return mix(vec3(sphg), vec3(1.0), f0);',
    '}',
    '',
    '',
    'void texturePanoramicGenericLod( const in vec3 dir, const in float lod, out vec3 texel ) {',
    '  texel = texturePanoramicRGBELod(uTexture0, environmentSize, dir, lod);',
    '}',
    '',
    'void texturePanoramicGenericLod2( const in vec3 dir, const in float lod, out vec3 texel ) {',
    '  texel = texturePanoramicRGBELod2(uTexture0, environmentSize, dir, lod);',
    '}',
    '',
    '',
    'void evaluateIBLDiffuseOptimSample0( const in mat3 iblTransform, const in vec3 N, out vec3 color) {',
    '  float pdf = INV_PI;',
    '  vec3 dir = iblTransform * N;',
    '  float lod = computeLOD(N, pdf);',
    '  texturePanoramicGenericLod( dir, lod, color );',
    '}',
    '',
    'void computeDiffuseDirLod( const in mat3 iblTransform, const in vec3 N, const in vec2 u, out vec3 dir, out float lod )',
    '{',
    '  vec3 L;',
    '  float pdf, NdotL;',
    '  float phi = PI_2*u.x;',
    '  float cosT = sqrt( 1.0 - u.y );',
    '  float sinT = sqrt( 1.0 - cosT * cosT );',
    '',
    '  L = sinT* cos(phi ) * TangentX + ( sinT* sin(phi) ) * TangentY + cosT * N;',
    '  NdotL = dot( L, N );',
    '  pdf = max( 0.0, NdotL * INV_PI );',
    '  lod = computeLOD(L, pdf);',
    '  dir = iblTransform * L;',
    '}',
    '',
    'void evaluateIBLDiffuseOptim(const in mat3 iblTransform, const in vec3 N, out vec3 contrib ) {',
    '',
    '  evaluateIBLDiffuseOptimSample0( iblTransform, N, contrib);',
    '',
    '#if NB_SAMPLES > 1',
    '  vec3 dir, color;',
    '  float lod;',
    '  vec2 u;',
    '  for ( int j = 1; j < NB_SAMPLES; j++ ) {',
    '    u = uHammersley[j];',
    '    computeDiffuseDirLod( iblTransform, N, u, dir, lod );',
    '    texturePanoramicGenericLod(dir, lod, color);',
    '    contrib += color;',
    '  }',
    '#endif',
    '}',
    '',
    'void evaluateIBLSpecularOptimSample0(const in mat3 iblTransform, const in vec3 N, const in vec3 V, out vec3 color ) {',
    '',
    '  vec3 H = N;',
    '  vec3 L = normalize(2.0 * NdotV * H - V);',
    '  float NdotL = max( 0.0, dot(L, N));',
    '  float LdotH = NdotL;',
    '  float D = INV_PI / Alpha2;',
    '  float pdf   = D / (4.0 * LdotH);',
    '',
    '  if ( NdotL > 0.0 && pdf > 0.0 ) {',
    '    float k = Alpha * 0.5;',
    '    vec3 weight = F_Schlick(MaterialSpecular, LdotH) * G1(NdotL, k) * G1(NdotV, k) * LdotH * NdotL;',
    '    float lod = MaterialRoughness < 0.01 ? 0.0: computeLOD( L, pdf );',
    '    texturePanoramicGenericLod( iblTransform * L, lod, color );',
    '    color *= weight;',
    '  }',
    '}',
    '',
    'vec3 evaluateIBLSpecularOptimSampleX(const in vec3 L, const in vec3 H, const in float G1NdotV, const in mat3 iblTransform, const in vec3 N, const in vec3 V) {',
    '  float LdotH = max( 0.0, dot(H, L));',
    '  float NdotH = max( 0.0, dot(H, N));',
    '  float NdotL = max( 0.0, dot(L, N));',
    '',
    '  float tmp = Alpha / ( NdotH * NdotH*( Alpha2MinusOne ) + 1.0);',
    '  float D = tmp * tmp * INV_PI;',
    '',
    '  float pdfH   = D * NdotH;',
    '  float pdf   = pdfH / (4.0 * LdotH);',
    '  if ( NdotL > 0.0 && pdf > 0.0 ) {',
    '    vec3 weight = F_Schlick(MaterialSpecular, LdotH) * ( G1(NdotL, Alpha05) * G1NdotV * LdotH * NdotL / NdotH );',
    '    float lod = MaterialRoughness < 0.01 ? 0.0: computeLOD( L, pdf );',
    '    vec3 color;',
    '    texturePanoramicGenericLod( iblTransform * L, lod, color );',
    '    return color * weight;',
    '  } else {',
    '    return nullVec3;',
    '  }',
    '}',
    '',
    'void evaluateIBLSpecularOptim(const in mat3 iblTransform, const in vec3 N, const in vec3 V, out vec3 contrib ) {',
    '',
    '  evaluateIBLSpecularOptimSample0(iblTransform, N, V, contrib );',
    '',
    '#if NB_SAMPLES > 1',
    '  float cosThetaH, sinThetaH;',
    '  float G1NdotV = G1(NdotV, Alpha05);',
    '  if ( G1NdotV < 1e-5 )',
    '    return;',
    '  vec3 H;',
    '  float phi;',
    '  vec2 u;',
    '  const float horizonFade = 1.3;',
    '  for ( int i = 1; i < NB_SAMPLES; i++ ) {',
    '    u = uHammersley[i];',
    '    phi = PI_2*u.x;',
    '    cosThetaH = sqrt( (1.0-u.y) / (1.0 + Alpha2MinusOne * u.y) );',
    '    sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );',
    '',
    '    // Convert sample from half angle to incident angle',
    '    H = vec3( sinThetaH * cos(phi), sinThetaH * sin(phi), cosThetaH);',
    '    H = normalize(TangentX * H.x + TangentY * H.y + N * H.z);',
    '    vec3 L = normalize(2.0 * dot(V, H) * H - V);',
    '    float factor = clamp(1.0 + horizonFade * dot(L, N), 0.0, 1.0);',
    '    contrib += evaluateIBLSpecularOptimSampleX(L, H, G1NdotV, iblTransform, N, V) * factor * factor;',
    '  }',
    '#endif',
    '}',
    '',
    'vec3 evaluateIBLOptim( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {',
    '  // if dont simplify the math you can get a rougness of 0 and it will',
    '  // produce an error on D_GGX / 0.0',
    '  NdotV = max( 0.0, dot(V, N));',
    '  Alpha = MaterialRoughness * MaterialRoughness;',
    '  Alpha2 = Alpha * Alpha;',
    '  Alpha05 = Alpha * 0.5;',
    '  Alpha2MinusOne = Alpha2 - 1.0;',
    '',
    '  vec3 diffuse = nullVec3;',
    '  vec3 specular = nullVec3;',
    '  if ( MaterialAlbedo[0] != 0.0 || MaterialAlbedo[1] != 0.0 || MaterialAlbedo[2] != 0.0 )',
    '    evaluateIBLDiffuseOptim( iblTransform, N, diffuse);',
    '  evaluateIBLSpecularOptim( iblTransform, N, V, specular );',
    '  return ( diffuse * MaterialAlbedo + specular ) / float(NB_SAMPLES);',
    '}',
    '',
    'vec3 solid2( const in mat3 iblTransform, const in vec3 normal, const in vec3 view) {',
    // '  TangentX = normalize(cross(abs(normal.y) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), normal));',
    // '  TangentY = cross(normal, TangentX);',
    '  TangentX = normalize(vec3(normal.zz, -normal.x - normal.y));',
    '  TangentY = normalize(cross(normal, TangentX ));',
    '',
    '  vec3 color = evaluateIBLOptim( iblTransform, normal, view ) * uExposure;',
    '  return linearTosRGB( color, DefaultGamma);',
    '}',
    '',
    'void main() {',
    '  vec3 fragNormal = normalize(vNormal);',
    '  vec3 fragEye = normalize(vVertex);',
    '  MaterialRoughness = max( 0.05 , uRoughness );',
    '  MaterialAlbedo = vAlbedo * (1.0 - uMetallic);',
    '  MaterialSpecular = mix( vec3(0.04), vAlbedo, uMetallic);',
    '  vec3 fragColor = picking(solid2( getIBLTransfrom( uIblTransform ), fragNormal, -fragEye ));',
    '  gl_FragColor = vec4( fragColor, 1.0);',
    '}'
  ].join('\n');

  /** Draw */
  ShaderPBR.draw = function (render, main) {
    render.getGL().useProgram(this.program);
    this.bindAttributes(render);
    this.updateUniforms(render, main);
    ShaderBase.drawBuffer(render);
  };
  /** Get or create the shader */
  ShaderPBR.getOrCreate = function (gl) {
    return ShaderPBR.program ? ShaderPBR : ShaderBase.getOrCreate.call(this, gl);
  };
  /** Initialize attributes */
  ShaderPBR.initAttributes = function (gl) {
    var program = ShaderPBR.program;
    var attrs = ShaderPBR.attributes;
    attrs.aVertex = new Attribute(gl, program, 'aVertex', 3, glfloat);
    attrs.aNormal = new Attribute(gl, program, 'aNormal', 3, glfloat);
    attrs.aColor = new Attribute(gl, program, 'aColor', 3, glfloat);
  };
  /** Bind attributes */
  ShaderPBR.bindAttributes = function (render) {
    var attrs = ShaderPBR.attributes;
    attrs.aVertex.bindToBuffer(render.getVertexBuffer());
    attrs.aNormal.bindToBuffer(render.getNormalBuffer());
    attrs.aColor.bindToBuffer(render.getColorBuffer());
  };

  /** Get or create hammerSequence */
  ShaderPBR.getOrCreateHammersleySequence = function (size) {
    var hammersley = ShaderPBR['hammersley' + size];
    if (hammersley) return hammersley;
    hammersley = ShaderPBR['hammersley' + size] = new Float32Array(size * 2);
    for (var i = 0; i < size; i++) {
      var a = i;
      a = (a << 16 | a >>> 16) >>> 0;
      a = ((a & 1431655765) << 1 | (a & 2863311530) >>> 1) >>> 0;
      a = ((a & 858993459) << 2 | (a & 3435973836) >>> 2) >>> 0;
      a = ((a & 252645135) << 4 | (a & 4042322160) >>> 4) >>> 0;
      a = (((a & 16711935) << 8 | (a & 4278255360) >>> 8) >>> 0) / 4294967296;
      hammersley[i * 2] = i / size;
      hammersley[i * 2 + 1] = a;
    }
    return hammersley;
  };
  ShaderPBR.onLoadEnvironment = function (gl, tex, main) {
    this.texture0 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (main)
      main.render();
  };
  /** Return or create texture0 */
  ShaderPBR.getOrCreateEnvironment = function (gl, texPath, main) {
    if (this.texture0)
      return this.texture0;
    if (this.texture0 === null) // download
      return;
    this.texture0 = null;
    var tex = new Image();
    tex.crossOrigin = 'Anonymous';
    tex.src = texPath;
    tex.onload = ShaderPBR.onLoadEnvironment.bind(this, gl, tex, main);
    return false;
  };
  /** Updates uniforms */
  ShaderPBR.updateUniforms = (function () {
    var tmpMat = mat4.create();
    mat4.rotateZ(tmpMat, tmpMat, Math.PI);
    mat4.rotateY(tmpMat, tmpMat, Math.PI);
    return function (render, main) {
      var gl = render.getGL();
      var uniforms = this.uniforms;
      var mesh = render.getMesh();

      gl.uniformMatrix4fv(uniforms.uMV, false, mesh.getMV());
      gl.uniformMatrix4fv(uniforms.uMVP, false, mesh.getMVP());
      gl.uniformMatrix3fv(uniforms.uN, false, mesh.getN());

      gl.uniformMatrix4fv(uniforms.uIblTransform, false, tmpMat);

      gl.uniform2fv(uniforms.uHammersley, ShaderPBR.getOrCreateHammersleySequence(4));

      gl.uniform1f(uniforms.uRoughness, render.getRoughness());
      gl.uniform1f(uniforms.uMetallic, render.getMetallic());
      gl.uniform1f(uniforms.uExposure, render.getExposure());

      gl.activeTexture(gl.TEXTURE0);
      var tex = ShaderPBR.getOrCreateEnvironment(gl, ShaderPBR.texPath, main);
      if (tex)
        gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uniforms.uTexture0, 0);

      ShaderBase.updateUniforms.call(this, render, main);
    };
  })();

  return ShaderPBR;
});