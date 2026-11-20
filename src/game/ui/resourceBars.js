import { COLORS } from "../../config/constants.js";

/** Barra de recurso (vida): trilho cinza e preenchimento proporcional. */
export function drawResourceBar(graphics, { barHeight }, { barX, barY, barWidth }, ratio, color) {
  graphics.roundRect(barX, barY, barWidth, barHeight, barHeight / 2).fill({ color: COLORS.track });
  if (ratio > 0) {
    graphics
      .roundRect(barX, barY, barWidth * Math.min(1, ratio), barHeight, barHeight / 2)
      .fill({ color });
  }
}

/** Esferas de Axé: cheias = disponíveis, vazias = já gastas. */
export function drawAxeOrbs(graphics, hud, axe, maxAxe) {
  const { orbRadius, orbSpacing, axe: spec } = hud;
  for (let i = 0; i < maxAxe; i++) {
    const x = spec.orbsX + (i - (maxAxe - 1) / 2) * orbSpacing;
    graphics
      .circle(x, spec.orbsY, orbRadius)
      .fill({ color: i < axe ? COLORS.axe : COLORS.track })
      .stroke({ width: 2, color: COLORS.axe });
  }
}
