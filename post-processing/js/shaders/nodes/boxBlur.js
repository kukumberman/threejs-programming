export default `
vec3 boxBlur(sampler2D tex, vec2 uv, int kernel) {
  int upper = (kernel - 1) / 2;
  int lower = -upper;

  vec2 texelSize = vec2(1.0 / u_resolution);

  vec3 result = vec3(0.0);

  for(int x = lower; x <= upper; x++) {
    for(int y = lower; y <= upper; y++) {
      vec2 offset = vec2(texelSize.x * float(x), texelSize.y * float(y));
      result += texture2D(tex, uv + offset).xyz;
    }
  }

  result /= float(kernel * kernel);

  return result;
}
`
