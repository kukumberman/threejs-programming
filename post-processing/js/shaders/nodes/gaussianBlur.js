export default `
float gaussianFormula(int x, int y, float spread) {
  float sigmaSqu = spread * spread;
  float result = (1.0 / sqrt(2.0 * PI * sigmaSqu)) * pow(E, -(float(x * x) + float(y * y)) / (2.0 * sigmaSqu));
  return result;
}

vec3 gaussianBlur(sampler2D tex, vec2 uv, int kernel, float spread) {
  int upper = (kernel - 1) / 2;
  int lower = -upper;

  float kernelSum = 0.0;

  vec2 texelSize = vec2(1.0 / u_resolution);

  vec3 result = vec3(0.0);

  for(int x = lower; x <= upper; x++) {
    for(int y = lower; y <= upper; y++) {
      float gaussian = gaussianFormula(x, y, spread);
      kernelSum += gaussian;
      vec2 offset = vec2(texelSize.x * float(x), texelSize.y * float(y));
      result += gaussian * texture2D(tex, uv + offset).xyz;
    }
  }

  result /= kernelSum;

  return result;
}
`
