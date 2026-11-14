import { Container, Graphics } from "pixi.js";
import { COLORS } from "../../config/constants.js";

const OUTSET = 5;
const PULSE_PERIOD_MS = 900;

/**
 * Contornos pulsantes ao redor do que o tutorial quer mostrar.
 * Recebe funções que devolvem o retângulo atual de cada alvo, então o
 * contorno acompanha cartas que se movem (hover, mão reorganizada).
 */
export class TutorialHighlight extends Container {
  #outline = new Graphics();
  #resolvers = [];
  #elapsedMs = 0;

  constructor() {
    super();
    this.addChild(this.#outline);
  }

  /** @param {Array<() => ({x: number, y: number, width: number, height: number} | null)>} resolvers */
  setTargets(resolvers) {
    this.#resolvers = resolvers;
    if (resolvers.length === 0) this.#outline.clear();
  }

  /** Chamado a cada frame pelo ticker. */
  tick({ deltaMS }) {
    if (this.#resolvers.length === 0) return;

    this.#elapsedMs += deltaMS;
    const wave = (Math.sin((this.#elapsedMs / PULSE_PERIOD_MS) * Math.PI * 2) + 1) / 2;
    const alpha = 0.45 + 0.55 * wave;

    this.#outline.clear();
    for (const resolve of this.#resolvers) {
      const rect = resolve();
      if (!rect) continue;
      this.#outline
        .roundRect(rect.x - OUTSET, rect.y - OUTSET, rect.width + OUTSET * 2, rect.height + OUTSET * 2, 12)
        .stroke({ width: 4, color: COLORS.axe, alpha });
    }
  }
}
