/**
 *
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns
 */
export function lerp(a, b, t) {
  return a * (1.0 - t) + b * t;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns
 */
export function magnitude(x, y) {
  return x * x + y * y;
}

/**
 *
 * @param {number} min
 * @param {number} max
 * @returns
 */
export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}
