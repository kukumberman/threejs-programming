/**
 *
 * @param {number} a
 * @param {number} b
 * @param {number} value
 * @returns
 */
export function inverseLerp(a, b, value) {
  return (value - a) / (b - a)
}

/**
 *
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}
