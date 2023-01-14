export default `
vec2 rotateUv(vec2 uv, float angle, vec2 pivot) {
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);
  mat2 matrix = mat2(cosAngle, -sinAngle, sinAngle, cosAngle);
  uv -= pivot;
  uv *= matrix;
  uv += pivot;
  return uv;
}
`
