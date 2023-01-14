import baseVertex from "./shaders/baseVertex.js"
import rotate from "./shaders/nodes/rotate.js"
import scale from "./shaders/nodes/scale.js"
import boxBlur from "./shaders/nodes/boxBlur.js"
import gaussianBlur from "./shaders/nodes/gaussianBlur.js"

export default {
  uniforms: {
    tDiffuse: {
      type: "t",
      value: null,
    },
    u_resolution: {
      type: "vec2",
      value: [window.innerWidth, window.innerHeight],
    },
    u_time: {
      type: "float",
      value: 0,
    },
    u_rainDropsTexture: {
      type: "t",
      value: null,
    },
    u_distortionAmount: {
      type: "float",
      value: 0.2,
    },
    u_fadeSpeed: {
      type: "float",
      value: 0.5,
    },
    u_size: {
      type: "float",
      value: 2,
    },
    u_kernel: {
      type: "int",
      value: 20,
    },
    u_spread: {
      type: "float",
      value: 5,
    },
  },

  vertexShader: baseVertex,

  fragmentShader: `
    #include <common>

    const float E = 2.71828183;

    uniform sampler2D tDiffuse;

    uniform vec2 u_resolution;
    uniform float u_time;

    uniform sampler2D u_rainDropsTexture;
    uniform float u_distortionAmount;
    uniform float u_fadeSpeed;
    uniform float u_size;

    uniform int u_kernel;
    uniform float u_spread;
    
    varying vec2 vUv;

    ${boxBlur}
    ${gaussianBlur}
    ${rotate}
    ${scale}

    struct RainData {
      vec2 distortion;
      float mask;
    };

    RainData calculateRain(sampler2D tex, vec2 uv) {
      float s01 = sin(u_time) * 0.5 + 0.5;
      float scale = mix(1.0, 3.0, s01);

      scale = u_size;

      uv = scaleUv(uv, vec2(scale), vec2(0.5, 0.5));

      float aspect = u_resolution.x / u_resolution.y;
      uv.x *= aspect;

      vec4 rainDropColor = texture2D(tex, uv);

      vec3 remapped = rainDropColor.rga * 2.0 - 1.0;

      vec2 distortion = remapped.xy * u_distortionAmount;
      float mask = remapped.z;

      // big drops = 1
      // small drops = -1

      float bigDropsMask = saturate(mask);

      float smallDropsMask = -1.0 * mask - rainDropColor.a;
      smallDropsMask = saturate(smallDropsMask);

      float baseOffset = rainDropColor.b;
      baseOffset -= u_time * u_fadeSpeed;
      float animated01 = fract(baseOffset);

      vec2 bigDrops = bigDropsMask * animated01 * distortion;
      vec2 smallDrops = smallDropsMask * distortion;
      
      RainData data;
      data.distortion = bigDrops + smallDrops;
      data.mask = smallDropsMask + bigDropsMask;
      return data;
    }
    
    void main() {
      vec2 uv = vUv;

      // uv = rotateUv(uv, u_time * 0.5, vec2(0.5, 0.5));

      RainData rain = calculateRain(u_rainDropsTexture, uv);

      vec2 distortedUv = uv + rain.distortion;
      vec4 textureColor = texture2D(tDiffuse, distortedUv);
      
      vec3 blurredTextureColor = gaussianBlur(tDiffuse, uv, u_kernel, u_spread);
      vec3 result = textureColor.xyz * rain.mask + blurredTextureColor * (1.0 - rain.mask) * 0.9;

      gl_FragColor = vec4(result, 1);
    }
  `,
}
