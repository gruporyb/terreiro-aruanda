import { CARD, HAND } from "../config/constants.js";

/**
 * Calcula a posição de cada carta da mão em leque.
 * Função pura: recebe a quantidade e devolve `{ x, y, rotation }` por carta.
 */
export function computeHandLayout(count, layout = HAND, cardWidth = CARD.width) {
  if (count === 0) return [];

  const step =
    count === 1
      ? 0
      : Math.min(layout.maxStep, (layout.maxWidth - cardWidth) / (count - 1));
  const middle = (count - 1) / 2;

  return Array.from({ length: count }, (_, index) => {
    const offset = index - middle;
    const t = middle === 0 ? 0 : offset / middle; // -1 (esquerda) .. 1 (direita)
    return {
      x: layout.centerX + offset * step,
      y: layout.baseY + t * t * layout.arcDrop,
      rotation: t * layout.maxTilt,
    };
  });
}
