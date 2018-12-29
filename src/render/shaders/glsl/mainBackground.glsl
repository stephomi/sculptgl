uniform int uBackgroundType;
uniform float uBlur;

void main() {
    vec3 color;
    if (uBackgroundType == 0) {
        color = sRGBToLinear(texture2D(uTexture0, vTexCoord).rgb);
    } else {
        vec3 dir = uIblTransform * vec3(vTexCoord.xy * 2.0 - 1.0, -1.0);
        dir = normalize(dir);
        if (uBackgroundType == 1) {
            color = texturePanoramaLod(uTexture0, environmentSize, dir, uBlur * uBlur * environmentLodRange[1], environmentLodRange[0]);
        } else {
            color = sphericalHarmonics(dir);
        }
    }
    gl_FragColor = encodeRGBM(color);
}
