import { CARD } from "../config/constants.js";

/**
 * Calcula a posição de cada carta da mão em leque.
 * Função pura: recebe a quantidade e a configuração da mão (layout.hand) e
 * devolve `{ x, y, rotation }` por carta.
 */
export function computeHandLayout(count, handLayout, cardWidth = CARD.width) {
  if (count === 0) return [];

  const step =
    count === 1
      ? 0
      : Math.min(handLayout.maxStep, (handLayout.maxWidth - cardWidth) / (count - 1));
  const middle = (count - 1) / 2;

  return Array.from({ length: count }, (_, index) => {
    const offset = index - middle;
    const t = middle === 0 ? 0 : offset / middle; // -1 (esquerda) .. 1 (direita)
    return {
      x: handLayout.centerX + offset * step,
      y: handLayout.baseY + t * t * handLayout.arcDrop,
      rotation: t * handLayout.maxTilt,
    };
  });
}
