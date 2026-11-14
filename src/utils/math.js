/** Interpolação linear entre `from` e `to`. */
export const lerp = (from, to, t) => from + (to - from) * t;

/** Limita `value` ao intervalo [min, max]. */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
