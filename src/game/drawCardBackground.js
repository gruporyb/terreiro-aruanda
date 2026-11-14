import { BORDER_WIDTH, CARD, COLORS } from "../config/constants.js";

const BORDER_BY_HIGHLIGHT = {
  idle: { color: COLORS.borderIdle, width: BORDER_WIDTH.idle },
  active: { color: COLORS.borderActive, width: BORDER_WIDTH.active },
  blocked: { color: COLORS.borderBlocked, width: BORDER_WIDTH.active },
};

/**
 * Redesenha o fundo da carta.
 * @param {"idle"|"active"|"blocked"} highlight estado da borda
 * @param {boolean} isPlayable cartas sem Axé suficiente ficam acinzentadas
 */
export function drawCardBackground(graphics, { highlight, isPlayable }) {
  const border = BORDER_BY_HIGHLIGHT[highlight];

  graphics
    .clear()
    .roundRect(0, 0, CARD.width, CARD.height, CARD.radius)
    .fill({ color: isPlayable ? COLORS.cardFill : COLORS.cardDisabled })
    .stroke({ width: border.width, color: border.color });
}
