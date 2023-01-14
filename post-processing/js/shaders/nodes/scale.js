export default `
vec2 scaleUv(vec2 uv, vec2 scale, vec2 pivot) {
  uv -= pivot;
  uv *= scale;
  uv += pivot;
  return uv;
}
`
