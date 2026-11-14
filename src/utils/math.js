/** Interpolação linear entre `from` e `to`. */
export const lerp = (from, to, t) => from + (to - from) * t;

/** Limita `value` ao intervalo [min, max]. */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Escala que faz uma imagem `size` cobrir totalmente `box` (como CSS object-fit: cover). */
export const coverScale = (size, box) =>
  Math.max(box.width / size.width, box.height / size.height);
